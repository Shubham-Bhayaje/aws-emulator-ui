/**
 * S3 Buckets list page – fully functional, matches real AWS Console.
 * Lists all buckets, allows delete. "Create bucket" links to /s3/create.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { s3 } from "@/lib/aws";
import { ListBucketsCommand } from "@aws-sdk/client-s3";
import Link from "next/link";
import { BucketActions } from "./BucketActions";

const s3Nav = [{ label: "Buckets", href: "/s3" }];

export default async function S3Page() {
  let buckets: { name: string; created: string }[] = [];
  let error: string | null = null;

  try {
    const res = await s3.send(new ListBucketsCommand({}));
    buckets = (res.Buckets ?? []).map((b) => ({
      name: b.Name ?? "",
      created: b.CreationDate
        ? b.CreationDate.toLocaleString("en-US", {
            month: "short", day: "numeric", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
          })
        : "—",
    }));
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <ServiceLayout serviceName="S3" serviceColor="#3ECF8E" navItems={s3Nav}>
      <div>
        {/* Page title */}
        <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Buckets</h1>
        <p className="text-[13px] text-[#545b64] mb-4">
          Buckets are containers for data stored in S3.
        </p>

        {error ? (
          <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-4 text-[13px] text-[#d13212]">
            Error: {error}
          </div>
        ) : (
          <BucketActions buckets={buckets} />
        )}
      </div>
    </ServiceLayout>
  );
}
