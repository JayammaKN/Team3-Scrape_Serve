import ExcelJS from 'exceljs';

// Open an .xlsx file and return the workbook object.
export async function openWorkbook(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return workbook;
}

// Get a sheet by its exact name. Returns undefined if not found.
export function getSheet(workbook, sheetName) {
  return workbook.getWorksheet(sheetName);
}

// Fallback lookup: case-insensitive + trimmed match on the sheet name.
// Helps when a tab has stray spaces or different casing than expected.
export function findSheet(workbook, sheetName) {
  const target = sheetName.toLowerCase().trim();
  return workbook.worksheets.find(
    (ws) => ws.name.toLowerCase().trim() === target
  );
}

// Read all non-empty values from one column, identified by its header text.
// Searches the first several rows for the header (handles title rows above headers).
export function readColumn(sheet, headerName) {
  if (!sheet) return [];

  const target = headerName.toLowerCase().trim();
  let headerRowNum = null;
  let colIndex = null;

  // Search the first 5 rows for a cell matching the header text.
  for (let r = 1; r <= 5 && r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    row.eachCell((cell, colNumber) => {
      const cellText = (cell.value || '').toString().trim().toLowerCase();
      if (cellText === target) {
        headerRowNum = r;
        colIndex = colNumber;
      }
    });
    if (colIndex) break;
  }

  if (!colIndex) {
    console.warn(`Column "${headerName}" not found in sheet "${sheet.name}"`);
    return [];
  }

  // Collect non-empty values from the rows BELOW the header row.
  const values = [];
  for (let row = headerRowNum + 1; row <= sheet.rowCount; row++) {
    const cellValue = sheet.getRow(row).getCell(colIndex).value;
    if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
      values.push(cellValue.toString().trim());
    }
  }

  return values;
}