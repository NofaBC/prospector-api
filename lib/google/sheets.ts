import { google } from 'googleapis';

type SheetCell = string | number | null;
export type SheetRow = {
  Name: SheetCell;
  'Email(s)': SheetCell;
  Phone: SheetCell;
  Address: SheetCell;
  Website: SheetCell;
  Domain: SheetCell;
  Rating: SheetCell;
  Reviews: SheetCell;
  'Place ID': SheetCell;
  Lat: SheetCell;
  Lng: SheetCell;
  Keyword: SheetCell;
  'Seed URL': SheetCell;
  'Collected At': SheetCell;
};

export async function getGoogleJwt() {
  const svcJson = JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64!, 'base64').toString()
  );
  const jwt = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    undefined,
    svcJson.private_key,
    ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets']
  );
  await jwt.authorize();
  return jwt;
}

export async function createSheet(
  title: string,
  parentFolderId?: string
): Promise<{ sheetId: string; sheetUrl: string }> {
  const jwt = await getGoogleJwt();

  // Create the file (Google Sheet) in Drive
  const drive = google.drive({ version: 'v3', auth: jwt });
  const fileMeta: any = { name: title, mimeType: 'application/vnd.google-apps.spreadsheet' };
  if (parentFolderId) fileMeta.parents = [parentFolderId];

  const file = await drive.files.create({
    requestBody: fileMeta,
    fields: 'id, webViewLink'
  });

  const sheetId = file.data.id!;
  const sheetUrl = file.data.webViewLink!;

  // Optionally make readable by anyone (comment out if not desired)
  // await shareSheetWithAnyone(sheetId); // see helper below

  // Write header row
  await appendRowsToSheet(sheetId, [
    [
      'Name',
      'Email(s)',
      'Phone',
      'Address',
      'Website',
      'Domain',
      'Rating',
      'Reviews',
      'Place ID',
      'Lat',
      'Lng',
      'Keyword',
      'Seed URL',
      'Collected At'
    ]
  ]);

  return { sheetId, sheetUrl };
}

export async function appendRowsToSheet(sheetId: string, values: (string | number | null)[][]) {
  const jwt = await getGoogleJwt();

  await jwt.request({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/Sheet1!A1:append`,
    method: 'POST',
    params: { valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS' },
    data: { values } // ✅ Correctly put the payload under `data`
  });
}

/**
 * Make the sheet readable by anyone with the link (optional).
 * Keep if your UX expects public links; otherwise remove.
 */
export async function shareSheetWithAnyone(sheetId: string) {
  const jwt = await getGoogleJwt();

  await jwt.request({
    url: `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(sheetId)}/permissions`,
    method: 'POST',
    data: {
      role: 'reader',
      type: 'anyone'
    } // ✅ payload goes under `data`
  });
}
