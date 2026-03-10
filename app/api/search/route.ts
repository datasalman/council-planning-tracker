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

      try {
        const allResults: Application[] = [];

        for (const boroughId of params.boroughs) {
          const adapter = getAdapter(boroughId);

          emit({
            type: "progress",
            borough: adapter.councilName,
            status: "fetching",
            count: allResults.length,
          });

          const results = await adapter.search(params, (count) => {
            emit({
              type: "progress",
              borough: adapter.councilName,
              status: "fetching",
              count: allResults.length + count,
            });
          });

          // Enrich missing postcodes via Nominatim (throttled, cached)
          const missing = results.filter((a) => !a.postcode).length;
          if (missing > 0) {
            emit({
              type: "progress",
              borough: adapter.councilName,
              status: "enriching",
              count: allResults.length,
            });
            await enrichPostcodes(results);
          }

          allResults.push(...results);

          emit({
            type: "progress",
            borough: adapter.councilName,
            status: "complete",
            count: allResults.length,
          });
        }

        setCached(params, allResults);

        emit({ type: "complete", data: allResults, total: allResults.length });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        emit({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: responseHeaders });
}
