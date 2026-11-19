import ServiceLayout from "@/components/ServiceLayout";
import { s3Nav } from "@/app/s3/s3Nav";
import { UploadForm } from "./UploadForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface UploadPageProps {
  params: Promise<{ bucket: string }>;
  searchParams: Promise<{ prefix?: string }>;
}

export default async function UploadPage({ params, searchParams }: UploadPageProps) {
  const { bucket: bucketName } = await params;
  const decodedBucketName = decodeURIComponent(bucketName);
  const { prefix: rawPrefix } = await searchParams;
  const prefix = rawPrefix || "";

  return (
    <ServiceLayout serviceName="S3" serviceColor="#3ECF8E" navItems={s3Nav}>
      <div className="max-w-4xl space-y-6">
        <div>
          <div className="text-[12px] text-[#545b64] mb-1 flex items-center gap-1.5 font-medium">
            <Link href="/s3" className="hover:underline text-[#0972d3]">
              Buckets
            </Link>
            <span>/</span>
            <Link href={`/s3/${decodedBucketName}`} className="hover:underline text-[#0972d3]">
              {decodedBucketName}
            </Link>
            <span>/</span>
            <span>Upload</span>
          </div>
          <h1 className="text-[22px] font-bold text-[#16191f] tracking-tight">Upload</h1>
          <p className="text-[13px] text-[#545b64] mt-1 font-mono">
            Destination: s3://{decodedBucketName}/{prefix}
          </p>
        </div>
        <UploadForm bucket={decodedBucketName} prefix={prefix} />
      </div>
    </ServiceLayout>
  );
}
