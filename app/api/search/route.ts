import { NextRequest } from "next/server";
import { getAdapter } from "@/lib/adapters";
import { getCached, setCached } from "@/lib/cache";
import { SearchParams } from "@/lib/adapters/types";
import { Application } from "@/lib/types";
import { enrichPostcodes } from "@/lib/enrichment/postcode";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawParams = searchParams.get("params");

  if (!rawParams) {
    return new Response(JSON.stringify({ error: "Missing params" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let params: SearchParams;
  try {
    params = JSON.parse(decodeURIComponent(rawParams));
  } catch {
    return new Response(JSON.stringify({ error: "Invalid params JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate
  if (!params.boroughs || params.boroughs.length === 0) {
    return new Response(JSON.stringify({ error: "At least one borough required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // SSE response headers
  const responseHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };

  // Check cache first
  const cached = getCached(params);
  if (cached) {
    const body = `data: ${JSON.stringify({ type: "cached", data: cached, total: cached.length })}\n\n`;
    return new Response(body, { headers: responseHeaders });
  }

  // Stream results via SSE
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: Record<string, unknown>) => {
        try {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // Controller already closed
        }
      };

      const allResults: Application[] = [];
      const failures: { borough: string; message: string }[] = [];

      // Each borough is fetched independently so one council being down (or
      // changing its portal) doesn't wipe out the whole search. Failures are
      // reported back per borough and the rest of the results still come through.
      for (const boroughId of params.boroughs) {
        let councilName = boroughId;
        try {
          const adapter = getAdapter(boroughId);
          councilName = adapter.councilName;

          emit({
            type: "progress",
            borough: councilName,
            status: "fetching",
            count: allResults.length,
          });

          const results = await adapter.search(params, (count) => {
            emit({
              type: "progress",
              borough: councilName,
              status: "fetching",
              count: allResults.length + count,
            });
          });

          const missing = results.filter((a) => !a.postcode).length;
          if (missing > 0) {
            emit({
              type: "progress",
              borough: councilName,
              status: "enriching",
              count: allResults.length,
            });
            await enrichPostcodes(results);
          }

          allResults.push(...results);

          emit({
            type: "progress",
            borough: councilName,
            status: "complete",
            count: allResults.length,
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Unknown error";
          failures.push({ borough: councilName, message });
          emit({ type: "borough_error", borough: councilName, message });
        }
      }

      // Only cache when every borough came back, so a transient outage doesn't
      // freeze an incomplete result set for the cache lifetime.
      if (failures.length === 0) {
        setCached(params, allResults);
      }

      emit({
        type: "complete",
        data: allResults,
        total: allResults.length,
        errors: failures,
      });
      controller.close();
    },
  });

  return new Response(stream, { headers: responseHeaders });
}
