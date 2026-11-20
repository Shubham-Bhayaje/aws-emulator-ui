import Link from "next/link";
import ServiceLayout from "@/components/ServiceLayout";
import { s3Nav } from "@/app/s3/s3Nav";
import { fetchObjectDetails } from "../../actions";
import { ObjectDetailClient } from "./ObjectDetailClient";

export const dynamic = "force-dynamic";

interface ObjectPageProps {
  params: Promise<{ bucket: string }>;
  searchParams: Promise<{ key?: string }>;
}

export default async function S3ObjectPage({ params, searchParams }: ObjectPageProps) {
  const { bucket } = await params;
  const { key } = await searchParams;

  if (!key) {
    return (
      <ServiceLayout serviceName="S3" serviceColor="#3ECF8E" navItems={s3Nav}>
        <div className="p-6 bg-white border border-[#eaeded] rounded shadow-sm">
          <h1 className="text-[18px] font-bold text-[#d13212] mb-2">Object key missing</h1>
          <p className="text-[13px] text-[#545b64] mb-4">
            No object key was specified in the request.
          </p>
          <Link href={`/s3/${bucket}`} className="text-[#0972d3] hover:underline text-[13px]">
            &larr; Return to {bucket}
          </Link>
        </div>
      </ServiceLayout>
    );
  }

  const { object, error } = await fetchObjectDetails(bucket, key);

  if (error || !object) {
    return (
      <ServiceLayout serviceName="S3" serviceColor="#3ECF8E" navItems={s3Nav}>
        <div className="p-6 bg-white border border-[#eaeded] rounded shadow-sm">
          <h1 className="text-[18px] font-bold text-[#d13212] mb-2">Object not found</h1>
          <p className="text-[13px] text-[#545b64] mb-4">
            {error || `The object "${key}" could not be found in bucket "${bucket}".`}
          </p>
          <Link href={`/s3/${bucket}`} className="text-[#0972d3] hover:underline text-[13px]">
            &larr; Return to {bucket}
          </Link>
        </div>
      </ServiceLayout>
    );
  }

  return (
    <ServiceLayout serviceName="S3" serviceColor="#3ECF8E" navItems={s3Nav}>
      <ObjectDetailClient object={object} />
    </ServiceLayout>
  );
}
