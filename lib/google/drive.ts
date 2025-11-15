import { google } from 'googleapis';

async function getJwt() {
  const svcJson = JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64!, 'base64').toString()
  );
  const jwt = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    undefined,
    svcJson.private_key,
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
    data: { role: 'reader', type: 'anyone' } // ✅ correct location for payload
  });
}
