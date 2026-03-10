import { NextRequest } from "next/server";
import { buildExcelWorkbook, buildFilename } from "@/lib/excel/generator";
import { Application } from "@/lib/types";
import { SearchParams } from "@/lib/adapters/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const applications: Application[] = body.applications;
    const params: SearchParams = body.params;

    if (!applications || !Array.isArray(applications)) {
      return new Response(JSON.stringify({ error: "Invalid applications data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const workbook = await buildExcelWorkbook(applications, params);
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = buildFilename(params);

    return new Response(buffer as ArrayBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String((buffer as ArrayBuffer).byteLength),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Export failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
