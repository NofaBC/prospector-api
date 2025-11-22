diff --git a/app/api/jobs/route.ts b/app/api/jobs/route.ts
new file mode 100644
index 0000000000000000000000000000000000000000..6141e362d903b04a792a741fa954f9b4c2e39979
--- /dev/null
+++ b/app/api/jobs/route.ts
@@ -0,0 +1,19 @@
+import { NextResponse } from 'next/server';
+import { getRecentJobs } from '@/lib/jobs';
+import { logError } from '@/lib/logging';
+import { FirestoreConfigError } from '@/lib/firestore';
+
+export const runtime = 'nodejs';
+
+export async function GET() {
+  try {
+    const jobs = await getRecentJobs();
+    return NextResponse.json({ jobs });
+  } catch (error) {
+    logError('Error fetching recent jobs', error);
+    if (error instanceof FirestoreConfigError) {
+      return NextResponse.json({ error: error.message }, { status: 500 });
+    }
+    return NextResponse.json({ error: 'Failed to load jobs' }, { status: 500 });
+  }
+}
