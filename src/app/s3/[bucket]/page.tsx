import ServiceLayout from "@/components/ServiceLayout";
import { s3Nav } from "../s3Nav";
import { fetchBucketDetails, fetchObjects } from "../actions";
import { BucketDetailClient } from "./BucketDetailClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface BucketPageProps {
  params: Promise<{ bucket: string }>;
  searchParams: Promise<{ prefix?: string }>;
}

export default async function BucketPage({ params, searchParams }: BucketPageProps) {
  const { bucket: bucketName } = await params;
  const decodedBucketName = decodeURIComponent(bucketName);
  const { prefix: rawPrefix } = await searchParams;
  const prefix = rawPrefix || "";

  const [detailsRes, objectsRes] = await Promise.all([
    fetchBucketDetails(decodedBucketName),
    fetchObjects(decodedBucketName, prefix),
  ]);

  if (!detailsRes.success || !detailsRes.bucket) {
    return (
      <ServiceLayout serviceName="S3" serviceColor="#3ECF8E" navItems={s3Nav}>
        <div className="space-y-4">
          <div className="text-[12px] text-[#545b64] mb-1 flex items-center gap-1.5 font-medium">
            <Link href="/s3" className="hover:underline text-[#0972d3]">
              Buckets
            </Link>
            <span>/</span>
            <span className="font-semibold text-[#16191f]">{decodedBucketName}</span>
          </div>

          <div className="bg-white border border-[#eaeded] rounded p-8 text-center space-y-4 max-w-xl mx-auto mt-8">
            <h2 className="text-[18px] font-bold text-[#16191f]">Bucket Not Found</h2>
            <p className="text-[13px] text-[#545b64]">
              {detailsRes.error || `The bucket "${decodedBucketName}" does not exist in this account.`}
            </p>
            <div>
              <Link
                href="/s3"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
              >
                Back to Buckets
              </Link>
            </div>
          </div>
        </div>
      </ServiceLayout>
    );
  }

  return (
    <ServiceLayout serviceName="S3" serviceColor="#3ECF8E" navItems={s3Nav}>
      <BucketDetailClient
        bucket={detailsRes.bucket}
        folders={objectsRes.folders}
        objects={objectsRes.objects}
        currentPrefix={prefix}
      />
    </ServiceLayout>
  );
}
