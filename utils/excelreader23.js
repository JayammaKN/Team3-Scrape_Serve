
import ExcelJS from 'exceljs';

async function openWorkbook(filePath) {
  console.log('Opening Excel file:', filePath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return workbook;
}

async function saveWorkbook(workbook, filePath) {
  console.log('Saving Excel file:', filePath);
  await workbook.xlsx.writeFile(filePath);
}
function getSheet(workbook, sheetName) {
  const sheet = workbook.getWorksheet(sheetName);

  if (!sheet) {
    console.warn(`Sheet not found (exact match): "${sheetName}"`);
    console.log('Available sheets:', workbook.worksheets.map((s) => s.name));
  }

  return sheet;
}
function findSheet(workbook, keyword) {
  return workbook.worksheets.find((sheet) =>
    sheet.name.toLowerCase().includes(keyword.toLowerCase())
  );
}
function findHeaderColumn(sheet, headerName) {
  for (const rowNumber of [1, 2]) {
    const row = sheet.getRow(rowNumber);
    let found = null;

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const text = (cell.value || '').toString().trim().toLowerCase();
      if (text === headerName.toLowerCase()) {
        found = colNumber;
      }
    });

    if (found) {
      return { columnNumber: found, headerRowNumber: rowNumber };
    }
  }
  return null;
}
function readColumn(sheet, headerName) {
  const values = [];
  if (!sheet) return values;

  const header = findHeaderColumn(sheet, headerName);
  if (!header) {
    console.warn(`Column "${headerName}" not found in sheet "${sheet.name}"`);
    return values;
  }

  for (let r = header.headerRowNumber + 1; r <= sheet.rowCount; r++) {
    const cellValue = sheet.getRow(r).getCell(header.columnNumber).value;
    if (cellValue) {
      values.push(cellValue.toString().trim().toLowerCase());
    }
  }

  return values;
}

function columnContainsValue(sheet, columnNumber, value) {
  if (!sheet) return false;

  for (let r = 1; r <= sheet.rowCount; r++) {
    const cellValue = sheet.getRow(r).getCell(columnNumber).value;
    if (cellValue && cellValue.toString().trim() === value.toString().trim()) {
      return true;
    }
  }
  return false;
}
function appendRow(sheet, rowValues) {
  if (!sheet) return;

  const newRowNumber = sheet.rowCount + 1;
  const newRow = sheet.getRow(newRowNumber);

  for (const columnNumber in rowValues) {
    newRow.getCell(Number(columnNumber)).value = rowValues[columnNumber];
  }
}
export {
  openWorkbook,
  saveWorkbook,
  getSheet,
  findSheet,
  findHeaderColumn,
  readColumn,
  columnContainsValue,
  appendRow
};