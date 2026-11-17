/**
 * S3 server actions – handle create/delete buckets, upload/delete objects.
 * All AWS calls happen server-side only.
 */

"use server";

import { s3 } from "@/lib/aws";
import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Create a new S3 bucket
export async function createBucket(formData: FormData) {
  const name = formData.get("bucketName") as string;

  if (!name || name.trim().length === 0) {
    return { error: "Bucket name is required." };
  }

  try {
    await s3.send(new CreateBucketCommand({ Bucket: name.trim() }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath("/s3");
  redirect("/s3");
}

// Delete a bucket (must be empty first)
export async function deleteBucket(bucketName: string) {
  try {
    await s3.send(new DeleteBucketCommand({ Bucket: bucketName }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
  revalidatePath("/s3");
}

// Empty a bucket (delete all objects inside it)
export async function emptyBucket(bucketName: string) {
  try {
    let continuationToken: string | undefined;
    do {
      const list = await s3.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          ContinuationToken: continuationToken,
        })
      );

      if (list.Contents && list.Contents.length > 0) {
        await s3.send(
          new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: {
              Objects: list.Contents.map((obj) => ({ Key: obj.Key! })),
            },
          })
        );
      }

      continuationToken = list.NextContinuationToken;
    } while (continuationToken);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
  revalidatePath(`/s3/${bucketName}`);
  revalidatePath("/s3");
}

// Delete a single object
export async function deleteObject(bucket: string, key: string) {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
  revalidatePath(`/s3/${bucket}`);
}

// Upload a file
export async function uploadObject(formData: FormData) {
  const bucket = formData.get("bucket") as string;
  const prefix = (formData.get("prefix") as string) || "";
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    return { error: "Please select a file to upload." };
  }

  const key = prefix + file.name;
  const bytes = await file.arrayBuffer();

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: Buffer.from(bytes),
        ContentType: file.type || "application/octet-stream",
      })
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath(`/s3/${bucket}`);
  redirect(`/s3/${bucket}${prefix ? `?prefix=${encodeURIComponent(prefix)}` : ""}`);
}

// Create a "folder" (put a zero-byte object with trailing slash)
export async function createFolder(formData: FormData) {
  const bucket = formData.get("bucket") as string;
  const prefix = (formData.get("prefix") as string) || "";
  const folderName = formData.get("folderName") as string;

  if (!folderName || folderName.trim().length === 0) {
    return { error: "Folder name is required." };
  }

  const key = prefix + folderName.trim() + "/";

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: Buffer.alloc(0),
      })
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath(`/s3/${bucket}`);
  redirect(`/s3/${bucket}?prefix=${encodeURIComponent(key)}`);
}
