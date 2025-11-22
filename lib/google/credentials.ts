diff --git a/lib/google/credentials.ts b/lib/google/credentials.ts
new file mode 100644
index 0000000000000000000000000000000000000000..c7277e11a672aec19a87c341af0700a23eb82620
--- /dev/null
+++ b/lib/google/credentials.ts
@@ -0,0 +1,78 @@
+export class GoogleCredentialsError extends Error {
+  constructor(message?: string) {
+    super(
+      message ||
+        'Google service account credentials are missing. Provide GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY (or *_BASE64) or a GOOGLE_SERVICE_ACCOUNT_KEY JSON so Sheets and Drive can connect.'
+    );
+    this.name = 'GoogleCredentialsError';
+  }
+}
+
+export type GoogleServiceAccount = {
+  clientEmail: string;
+  privateKey: string;
+};
+
+function normalizePrivateKey(privateKey: string) {
+  return privateKey.replace(/\\n/g, '\n');
+}
+
+function decodeBase64(value?: string) {
+  if (!value) return undefined;
+  try {
+    return Buffer.from(value, 'base64').toString('utf8');
+  } catch {
+    throw new GoogleCredentialsError('Failed to decode base64 Google credential.');
+  }
+}
+
+function parseServiceAccount(json: string): GoogleServiceAccount {
+  try {
+    const parsed = JSON.parse(json);
+    const clientEmail = parsed.client_email as string | undefined;
+    const privateKey = parsed.private_key as string | undefined;
+
+    if (!clientEmail || !privateKey) {
+      throw new GoogleCredentialsError(
+        'Invalid Google service account JSON. Expected client_email and private_key fields.'
+      );
+    }
+
+    return {
+      clientEmail,
+      privateKey: normalizePrivateKey(privateKey)
+    } satisfies GoogleServiceAccount;
+  } catch (error) {
+    if (error instanceof GoogleCredentialsError) {
+      throw error;
+    }
+    throw new GoogleCredentialsError('Unable to parse Google service account JSON.');
+  }
+}
+
+export function resolveGoogleServiceAccount(): GoogleServiceAccount {
+  const serviceAccountJson =
+    process.env.GOOGLE_SERVICE_ACCOUNT_KEY ??
+    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ??
+    decodeBase64(
+      process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 ??
+        process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
+    );
+
+  if (serviceAccountJson) {
+    return parseServiceAccount(serviceAccountJson);
+  }
+
+  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? process.env.GOOGLE_CLIENT_EMAIL;
+  const privateKey =
+    process.env.GOOGLE_PRIVATE_KEY ?? decodeBase64(process.env.GOOGLE_PRIVATE_KEY_BASE64);
+
+  if (!clientEmail || !privateKey) {
+    throw new GoogleCredentialsError();
+  }
+
+  return {
+    clientEmail,
+    privateKey: normalizePrivateKey(privateKey)
+  } satisfies GoogleServiceAccount;
+}
