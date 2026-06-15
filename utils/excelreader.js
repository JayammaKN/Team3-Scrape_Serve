
import ExcelJS from 'exceljs';

export async function openWorkbook(filePath) {
  console.log('Opening Excel file:', filePath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return workbook;
}

 export async function saveWorkbook(workbook, filePath) {
  console.log('Saving Excel file:', filePath);
  await workbook.xlsx.writeFile(filePath);
}

export function readColumn(sheet, headerName) {
  if (!sheet) {
    console.warn(`  Warning: sheet not found when reading column "${headerName}"`);
    return [];
  }

  let columnNumber = null;

  // Check for row 1 first, then row 2 
  for (const rowNum of [1, 2]) {
    const row = sheet.getRow(rowNum);
    row.eachCell((cell, colNum) => {
      const cellText = (cell.value || '').toString().trim();
      if (cellText.toLowerCase() === headerName.toLowerCase()) {
        columnNumber = colNum;
      }
    });
    if (columnNumber) break;
  }

  if (!columnNumber) {
    console.warn(`  Warning: column "${headerName}" not found in sheet "${sheet.name}"`);
    return [];
  }

  // Collect all non-empty values below the header row
  const values = [];
  sheet.eachRow((row, rowNum) => {
    if (rowNum <= 2) return; // skip header rows
    const cell = row.getCell(columnNumber);
    const val = (cell.value || '').toString().trim();
    if (val) values.push(val.toLowerCase()); // store lowercase for easy matching
  });

  console.log(`  Read ${values.length} items from column "${headerName}"`);
  return values;
}
export function appendRow(sheet, data) {
  if (!sheet) return;
  const row = sheet.addRow(Object.values(data));
  row.commit();
}
export function clearSheet(sheet) {
  if (!sheet) return;
  sheet.spliceRows(1, sheet.rowCount);
}

