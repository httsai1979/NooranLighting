/**
 * Nooran Lighting - Google Apps Script Backend
 * 
 * This script serves as the backend for the Nooran Lighting web application.
 * It fetches product data from Google Sheets, processes it, and returns it as a JSON API.
 * 
 * Deployment Instructions:
 * 1. Open Google Sheets (ID: 1CP0xxEZGIOr7Se-aGzkgrDli774U1FkXNhs7GeYiqx0).
 * 2. Go to Extensions > Apps Script.
 * 3. Paste this code into the editor.
 * 4. Click 'Deploy' > 'New Deployment'.
 * 5. Select 'Web App', set 'Execute as' to 'Me', and 'Who has access' to 'Anyone'.
 * 6. Copy the Web App URL for use in the frontend.
 */

const CONFIG = {
  spreadsheetId: '1CP0xxEZGIOr7Se-aGzkgrDli774U1FkXNhs7GeYiqx0',
  sheets: [
    { name: 'S10_Magnetic_lamp', type: 'lamp' },
    { name: 'S10_Track&accessory', type: 'accessory' }
  ],
  imageResizing: 's1000' // Quality/Size of the thumbnail
};

/**
 * Handle GET requests to the Web App URL
 */
function doGet(e) {
  try {
    const data = fetchAllProducts();
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: data
    }))
    .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Main logic to fetch and process sheet data
 */
function fetchAllProducts() {
  const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const result = {};

  CONFIG.sheets.forEach(sheetInfo => {
    const sheet = ss.getSheetByName(sheetInfo.name);
    if (!sheet) {
      console.warn(`Sheet "${sheetInfo.name}" not found.`);
      return;
    }

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
        const headerSafe = header || '';
        const headerName = headerSafe.toString().trim();
        
        if (!headerName) return;

        // 1. Process Power(W) Column (F is index 5)
        if (headerName.toLowerCase().includes('power') || colIndex === 5) {
          const valStr = (value || '0').toString();
          item.power = parseFloat(valStr.replace(/[^\d.]/g, '')) || 0;
        }

        // 2. Dynamic Specification Data Packaging
        if (headerName.toLowerCase().includes('specification')) {
          // Extract specific key from "Specification: Beam Angle" or just use header
          let key = headerName;
          if (headerName.includes(':')) {
            key = headerName.split(':')[1].trim();
          } else if (headerName.toLowerCase() === 'specification') {
            key = 'Details';
          } else {
            key = headerName.replace(/specification/gi, '').trim();
          }
          item.specsData[key] = value;
        }

        // 3. Image URL Conversion (Google Drive to Thumbnail API)
        if (headerName.toLowerCase().includes('photo') || headerName.toLowerCase().includes('image')) {
          item.photo = convertGoogleDriveUrl(value);
        }

        // 4. Standard Mapping
        if (headerName.toLowerCase() === 'model' || headerName.toLowerCase() === 'item no.') {
          item.model = value;
        }
        if (headerName.toLowerCase() === 'price') {
          const valStr = (value || '0').toString();
          item.price = typeof value === 'number' ? value : parseFloat(valStr.replace(/[^\d.]/g, '')) || 0;
        }
        if (headerName.toLowerCase() === 'category') {
          item.category = value;
        }

        // Keep original field for reference
        item[headerName] = value;
      });

      return item;
    }).filter(item => item.model); // Filter out empty rows
  });

  return result;
}

/**
 * Converts a Google Drive share link into a direct-loadable thumbnail/image URL
 * @param {string} url The original Drive URL
 * @return {string} The formatted API URL as per TRD specification
 */
function convertGoogleDriveUrl(url) {
  if (!url || typeof url !== 'string') return url;
  
  // Extract file ID using regex
  const idPattern = /[-\w]{25,}/;
  const match = url.match(idPattern);
  
  if (match) {
    const fileId = match[0];
    // Exact format from TRD Section 1: https://drive.google.com/thumbnail?id=[ID]&sz=w1000
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }
  
  return url;
}

/**
 * Test function to run in the script editor
 */
function testBackend() {
  const data = fetchAllProducts();
  console.log(JSON.stringify(data, null, 2));
}
