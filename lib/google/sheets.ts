import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

/**
 * Get Google Auth client
 * This runs at runtime to avoid build-time environment variable issues
 */
function getGoogleAuth(): JWT {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

  if (!privateKey || !clientEmail) {
    throw new Error(
      'Missing Google credentials: ' +
      `GOOGLE_CLIENT_EMAIL=${!!clientEmail}, ` +
      `GOOGLE_PRIVATE_KEY=${!!privateKey}`
    );
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey.replace(/\\n/g, '\n'),
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file'
    ]
  });
}

/**
 * Get Google Sheets API client
 */
export async function getSheets() {
  const auth = getGoogleAuth();
  return google.sheets({ version: 'v4', auth });
}

/**
 * Get Google Drive API client
 */
export async function getDrive() {
  const auth = getGoogleAuth();
  return google.drive({ version: 'v3', auth });
}

/**
 * Create a new spreadsheet
 */
export async function createSpreadsheet(title: string) {
  const sheets = await getSheets();
  
  const response = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title
      }
    }
  });

  return response.data;
}

/**
 * Append rows to a spreadsheet
 */
export async function appendRows(
  spreadsheetId: string,
  range: string,
  values: any[][]
) {
  const sheets = await getSheets();
  
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: {
      values
    }
  });

  return response.data;
}

/**
 * Make spreadsheet publicly readable
 */
export async function shareSpreadsheet(spreadsheetId: string) {
  const drive = await getDrive();
  
  await drive.permissions.create({
    fileId: spreadsheetId,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  });
}

/**
 * Get spreadsheet URL
 */
export function getSpreadsheetUrl(spreadsheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}
