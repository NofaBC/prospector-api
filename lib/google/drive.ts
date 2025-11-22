// lib/google/drive.ts
import { google } from 'googleapis';
import { resolveGoogleServiceAccount } from './credentials';

async function getJwt() {
  const { clientEmail, privateKey } = resolveGoogleServiceAccount();

  const jwt = new google.auth.JWT(
    clientEmail,
    undefined,
    privateKey,
    ['https://www.googleapis.com/auth/drive']
  );

  await jwt.authorize();
  return jwt;
}

export async function shareFileAnyoneReader(fileId: string) {
  const jwt = await getJwt();

  await jwt.request({
    url: `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions`,
    method: 'POST',
    data: { role: 'reader', type: 'anyone' } // correct payload location
  });
}
