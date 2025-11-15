import { JWT } from 'google-auth-library';
import { getEnvVar } from '../env';
import { logging } from '../logging';

const GOOGLE_PRIVATE_KEY = getEnvVar('GOOGLE_PRIVATE_KEY').replace(/\n/g, '\n');
const GOOGLE_CLIENT_EMAIL = getEnvVar('GOOGLE_CLIENT_EMAIL');
const GOOGLE_PROJECT_ID = getEnvVar('GOOGLE_PROJECT_ID');

const SCOPES = [
'https://www.googleapis.com/auth/spreadsheets ',
'https://www.googleapis.com/auth/drive '
];

interface SheetRow {
Name: string;
Phone: string;
Address: string;
Website: string;
Domain: string;
Email: string;
Lat: number;
Lng: number;
Rating: number | null;
Reviews: number | null;
'Place ID': string;
Types: string;
Source: string;
'Created At': string;
}

export const createSheet = async (title: string): Promise<{ sheetId: string, sheetUrl: string }> => {
const jwtClient = new JWT({
email: GOOGLE_CLIENT_EMAIL,
key: GOOGLE_PRIVATE_KEY,
scopes: SCOPES
});

// Create the spreadsheet
const createResponse = await jwtClient.request({
url: 'https://sheets.googleapis.com/v4/spreadsheets ',
method: 'POST',
{
properties: {
title: title
}
}
});

const sheetId = createResponse.data.spreadsheetId;

// Add header row
const headerRow: SheetRow = {
Name: 'Name',
Phone: 'Phone',
Address: 'Address',
Website: 'Website',
Domain: 'Domain',
Email: 'Email(s)',
Lat: 'Lat',
Lng: 'Lng',
Rating: 'Rating',
Reviews: 'Reviews',
'Place ID': 'Place ID',
Types: 'Types',
Source: 'Source',
'Created At': 'Created At'
};

await appendRowsToSheet(jwtClient, sheetId, [headerRow]);

// Get the sheet URL
const sheetUrl = https://docs.google.com/spreadsheets/d/${sheetId};

return { sheetId, sheetUrl };
};

export const appendRowsToSheet = async (jwtClient: JWT, sheetId: string, rows: SheetRow[]): Promise<void> => {
const range = 'A1:Z1000'; // Use a range that accommodates the data

const values = rows.map(row => [
row.Name,
row.Phone,
row.Address,
row.Website,
row.Domain,
row.Email,
row.Lat.toString(),
row.Lng.toString(),
row.Rating?.toString() || '',
row.Reviews?.toString() || '',
row['Place ID'],
row.Types,
row.Source,
row['Created At']
]);

let retries = 3;
let delay = 1000;

while (retries >= 0) {
try {
await jwtClient.request({
url: https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append,
method: 'POST',
params: {
valueInputOption: 'RAW',
insertDataOption: 'INSERT_ROWS'
},
{
values
}
});
return;
} catch (error: any) {
if (retries === 0) {
logging.error('Failed to append rows to sheet after retries:', error);
throw error;
}

logging.warn(`Failed to append rows to sheet, retrying in ${delay}ms...`, error);
await sleep(delay);
delay *= 2; // Exponential backoff
retries--;
}
}
};

export const shareSheetWithPublic = async (sheetId: string): Promise<void> => {
const jwtClient = new JWT({
email: GOOGLE_CLIENT_EMAIL,
key: GOOGLE_PRIVATE_KEY,
scopes: SCOPES
});

// Add public read permission
await jwtClient.request({
url: https://www.googleapis.com/drive/v3/files/${sheetId}/permissions,
method: 'POST',
{
role: 'reader',
type: 'anyone'
}
});
};

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
