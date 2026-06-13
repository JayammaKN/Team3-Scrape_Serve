/**
 * utils/excelreader.js
 * -----------------------------------------------------------------
 * A small "toolbox" of simple functions for working with Excel (.xlsx)
 * files using the ExcelJS library.
 *
 * Every function here does ONE small job and has a simple name.
 */

import ExcelJS from 'exceljs';

// -------------------------------------------------------------------
// 1. Open an excel file from disk and return the "workbook" object.
//    A workbook = the whole .xlsx file (can contain many tabs/sheets).
// -------------------------------------------------------------------
async function openWorkbook(filePath) {
  console.log('Opening Excel file:', filePath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return workbook;
}

// -------------------------------------------------------------------
// 2. Save a workbook back to disk (overwrites the file).
// -------------------------------------------------------------------
async function saveWorkbook(workbook, filePath) {
  console.log('Saving Excel file:', filePath);
  await workbook.xlsx.writeFile(filePath);
}

// -------------------------------------------------------------------
// 3. Get one tab/sheet from a workbook by its EXACT name.
//    Returns undefined (and prints a warning) if no exact match exists.
// -------------------------------------------------------------------
function getSheet(workbook, sheetName) {
  const sheet = workbook.getWorksheet(sheetName);

  if (!sheet) {
    console.warn(`Sheet not found (exact match): "${sheetName}"`);
    console.log('Available sheets:', workbook.worksheets.map((s) => s.name));
  }

  return sheet;
}

// -------------------------------------------------------------------
// 3b. Find a sheet whose name CONTAINS a keyword (case-insensitive).
//     Useful when sheet names have extra spaces or slightly different
//     spelling, e.g. "TABLE_LCHF ELEMINATION " vs "TABLE_LCHF ELEMINATION".
// -------------------------------------------------------------------
function findSheet(workbook, keyword) {
  return workbook.worksheets.find((sheet) =>
    sheet.name.toLowerCase().includes(keyword.toLowerCase())
  );
}

// -------------------------------------------------------------------
// 4. Find which column number has a given header text.
//    Looks in row 1 and row 2 (covers sheets where the title is on
//    row 1 and the real headers are on row 2).
//    Returns { columnNumber, headerRowNumber } or null if not found.
// -------------------------------------------------------------------
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

// -------------------------------------------------------------------
// 5. Read every value below a given header into a plain array.
//    Example: readColumn(sheet, 'Eliminate') -> ['ham', 'sausage', ...]
//    All values are lower-cased so they are easy to compare later.
// -------------------------------------------------------------------
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

// -------------------------------------------------------------------
// 6. Check if a value already exists somewhere in a given column.
//    Used to avoid adding duplicate Recipe_IDs.
// -------------------------------------------------------------------
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

// -------------------------------------------------------------------
// 7. Add a new row of values to the bottom of a sheet.
//    rowValues is a simple object like:
//      { 1: 'R0001', 2: 'Paneer Masala' }
//    meaning column A = 'R0001', column B = 'Paneer Masala'
// -------------------------------------------------------------------
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