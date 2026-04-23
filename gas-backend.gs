/**
 * Nooran Lighting - Google Apps Script Backend (Reinforced V3)
 * 
 * Target: Data Parsing, Type Safety, and Image Integrity
 */

const CONFIG = {
  spreadsheetId: '1CP0xxEZGIOr7Se-aGzkgrDli774U1FkXNhs7GeYiqx0',
  sheets: [
    { name: 'S10_Magnetic_lamp', type: 'lamp' },
    { name: 'S10_Track&accessory', type: 'accessory' }
  ],
  thumbnailSize: 's1000'
};

function doGet(e) {
  try {
    const data = fetchAllProducts();
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: data,
      system: 'ACOfusion S10 Configurator Engine'
    }))
    .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

function fetchAllProducts() {
  const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const result = {};

  CONFIG.sheets.forEach(sheetInfo => {
    const sheet = ss.getSheetByName(sheetInfo.name);
    if (!sheet) return;

    const values = sheet.getDataRange().getValues();
    if (values.length < 2) {
      result[sheetInfo.name] = [];
      return;
    }

    const headers = values[0];
    const dataRows = values.slice(1);

    result[sheetInfo.name] = dataRows.map((row, rowIndex) => {
      const item = {
        id: `${sheetInfo.name}_${rowIndex}`,
        specsData: {}
      };

      headers.forEach((header, colIndex) => {
        let value = row[colIndex];
        if (value === null || value === undefined) value = '';
        
        const key = (header || '').toString().trim();
        const keyLower = key.toLowerCase();
        
        if (!key) return;

        // 1. Force Numeric Power
        if (keyLower.includes('power')) {
          item.power = parseFloat(value.toString().replace(/[^\d.]/g, '')) || 0;
          return;
        }

        // 2. Force Numeric Price
        if (keyLower === 'price') {
          item.price = parseFloat(value.toString().replace(/[^\d.]/g, '')) || 0;
          return;
        }

        // 3. Image Hardening
        if (keyLower.includes('photo') || keyLower.includes('image')) {
          item.photo = reinforceDriveUrl(value);
          return;
        }

        // 4. Standard Mapping
        if (keyLower === 'model' || keyLower === 'item no.') {
          item.model = value.toString();
          return;
        }
        if (keyLower === 'category') {
          item.category = value.toString();
          return;
        }

        // 5. Exhaustive Specification Capture (All other fields go to specsData)
        // This captures Size, LED, CRI, CCT, etc. automatically
        item.specsData[key] = value;
      });

      return item;
    }).filter(item => item.model);
  });

  return result;
}

/**
 * Robust Google Drive ID Extraction & Thumbnail Conversion
 */
function reinforceDriveUrl(url) {
  if (!url || typeof url !== 'string') return url;
  
  // Pattern to catch various Drive URL structures (d/ID, id=ID, etc)
  const idPattern = /[-\w]{25,}/;
  const match = url.match(idPattern);
  
  if (match) {
    const fileId = match[0];
    // sz=w1000 provides a high-quality preview suitable for PDF/UI
    return "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1000";
  }
  
  return url;
}
