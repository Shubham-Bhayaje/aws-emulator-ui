/**
 * GET /api/s3/download?bucket=...&key=...
 * Downloads an object from S3 and streams it to the browser.
 */

import { s3 } from "@/lib/aws";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const bucket = request.nextUrl.searchParams.get("bucket");
  const key = request.nextUrl.searchParams.get("key");

  if (!bucket || !key) {
    return NextResponse.json({ error: "Missing bucket or key" }, { status: 400 });
  }

  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const body = res.Body;

    if (!body) {
      return NextResponse.json({ error: "Empty response" }, { status: 404 });
    }

    // Convert the stream to a buffer
    const bytes = await body.transformToByteArray();
    const fileName = key.split("/").pop() || "download";

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": res.ContentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(res.ContentLength ?? bytes.length),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
