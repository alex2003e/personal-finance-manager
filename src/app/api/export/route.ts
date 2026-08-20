import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { buildReportData } from "@/lib/export-report";
import { buildReportWorkbook } from "@/lib/export-xlsx";
import { buildReportPdf } from "@/lib/export-pdf";

export async function GET(req: NextRequest) {
  const userId = await requireUserId();
  const format = req.nextUrl.searchParams.get("format") === "pdf" ? "pdf" : "xlsx";

  const data = await buildReportData(userId);
  const dateSlug = data.generatedAt.toISOString().slice(0, 10);

  if (format === "pdf") {
    const bytes = new Uint8Array(await buildReportPdf(data));
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="finanzas-reporte-${dateSlug}.pdf"`,
      },
    });
  }

  const bytes = new Uint8Array(await buildReportWorkbook(data));
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="finanzas-reporte-${dateSlug}.xlsx"`,
    },
  });
}
