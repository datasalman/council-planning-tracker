import ExcelJS from "exceljs";
import { Application } from "../types";
import { SearchParams } from "../adapters/types";

function formatDate(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function toYYYYMMDD(isoDate: string): string {
  return isoDate.replace(/-/g, "");
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function buildFilename(params: SearchParams): string {
  const boroughs = params.boroughs.map(capitalise).join("_");
  const from = toYYYYMMDD(params.dateFrom);
  const to = toYYYYMMDD(params.dateTo);
  return `Planning_Applications_${boroughs}_${from}-${to}.xlsx`;
}

export async function buildExcelWorkbook(
  applications: Application[],
  params: SearchParams
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Council Planning Tracker";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Planning Applications", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  // Define columns
  sheet.columns = [
    { key: "reference_number", header: "Reference Number", width: 20 },
    { key: "registration_date", header: "Registration Date", width: 16 },
    { key: "application_type", header: "Application Type", width: 25 },
    { key: "proposal_description", header: "Proposal Description", width: 55 },
    { key: "proposal_category", header: "Proposal Category", width: 28 },
    { key: "address_line_1", header: "Address Line 1", width: 32 },
    { key: "address_line_2", header: "Address Line 2", width: 28 },
    { key: "address_line_3", header: "Address Line 3", width: 28 },
    { key: "town", header: "Town", width: 20 },
    { key: "postcode", header: "Postcode", width: 12 },
    { key: "borough", header: "Borough", width: 20 },
    { key: "url", header: "Portal Link", width: 55 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: false };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFFFFFFF" } },
    };
  });
  headerRow.height = 22;

  // Auto-filter on all columns
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 12 },
  };

  // Add data rows
  applications.forEach((app, index) => {
    const rowData = {
      reference_number: app.reference_number,
      registration_date: formatDate(new Date(app.registration_date)),
      application_type: app.application_type,
      proposal_description: app.proposal_description,
      proposal_category: app.proposal_category.join(", "),
      address_line_1: app.address_line_1,
      address_line_2: app.address_line_2 ?? "",
      address_line_3: app.address_line_3 ?? "",
      town: app.town,
      postcode: app.postcode,
      borough: app.borough,
      url: "", // populated below as a hyperlink when present
    };

    const row = sheet.addRow(rowData);

    // Set portal link as a clickable hyperlink
    if (app.url) {
      const urlCell = row.getCell("url");
      urlCell.value = { text: app.url, hyperlink: app.url };
      urlCell.font = {
        color: { argb: "FF0563C1" },
        underline: true,
        size: 10,
      };
    }

    // Alternating row colours
    const fillColor = index % 2 === 0 ? "FFF2F2F2" : "FFFFFFFF";
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: fillColor },
      };
      cell.alignment = { vertical: "top", wrapText: false };
    });

    row.height = 18;
  });

  return workbook;
}
