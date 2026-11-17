/**
 * Bucket detail page – lists objects inside a bucket.
 * Supports folder navigation via ?prefix= search param.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { s3 } from "@/lib/aws";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import Link from "next/link";
import { ObjectActions } from "./ObjectActions";

const s3Nav = [{ label: "Buckets", href: "/s3" }];

type Props = {
  params: Promise<{ bucket: string }>;
  searchParams: Promise<{ prefix?: string }>;
};

export default async function BucketPage(props: Props) {
  const { bucket } = await props.params;
  const { prefix: rawPrefix } = await props.searchParams;
  const prefix = rawPrefix || "";

  let folders: string[] = [];
  let objects: { key: string; name: string; size: number; lastModified: string }[] = [];
  let error: string | null = null;

  try {
    const res = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, Delimiter: "/" })
    );
    folders = (res.CommonPrefixes ?? []).map((p) => p.Prefix!);
    objects = (res.Contents ?? [])
      .filter((obj) => obj.Key !== prefix)
      .map((obj) => ({
        key: obj.Key!,
        name: obj.Key!.slice(prefix.length),
        size: obj.Size ?? 0,
        lastModified: obj.LastModified
          ? obj.LastModified.toLocaleString("en-US", {
              month: "short", day: "numeric", year: "numeric",
              hour: "2-digit", minute: "2-digit", second: "2-digit",
            })
          : "—",
      }));
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : String(err);
  }

  const prefixParts = prefix.split("/").filter(Boolean).map((part, i, arr) => ({
    name: part,
    prefix: arr.slice(0, i + 1).join("/") + "/",
  }));

  return (
    <ServiceLayout serviceName="S3" serviceColor="#3ECF8E" navItems={s3Nav}>
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f] mb-1">{bucket}</h1>
        <div className="flex items-center gap-1 text-[13px] mb-4">
          <Link href={"/s3/" + bucket} className="text-[#0073bb] hover:text-[#ec7211] hover:underline">Objects</Link>
          {prefixParts.map((part) => (
            <span key={part.prefix} className="flex items-center gap-1">
              <span className="text-[#aab7b8]">/</span>
              <Link href={"/s3/" + bucket + "?prefix=" + encodeURIComponent(part.prefix)} className="text-[#0073bb] hover:text-[#ec7211] hover:underline">{part.name}</Link>
            </span>
          ))}
        </div>

        {error ? (
          <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-4 text-[13px] text-[#d13212]">Error: {error}</div>
        ) : (
          <ObjectActions bucket={bucket} prefix={prefix} folders={folders} objects={objects} />
        )}
      </div>
    </ServiceLayout>
  );
}
