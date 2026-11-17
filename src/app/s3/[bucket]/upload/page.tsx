/**
 * Upload page – file picker with drag-and-drop.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { UploadForm } from "./UploadForm";

const s3Nav = [{ label: "Buckets", href: "/s3" }];

type Props = {
  params: Promise<{ bucket: string }>;
  searchParams: Promise<{ prefix?: string }>;
};

export default async function UploadPage(props: Props) {
  const { bucket } = await props.params;
  const { prefix: rawPrefix } = await props.searchParams;
  const prefix = rawPrefix || "";

  return (
    <ServiceLayout serviceName="S3" serviceColor="#3ECF8E" navItems={s3Nav}>
      <div className="max-w-[800px]">
        <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Upload</h1>
        <p className="text-[13px] text-[#545b64] mb-6">
          Destination: <span className="font-mono">s3://{bucket}/{prefix}</span>
        </p>
        <UploadForm bucket={bucket} prefix={prefix} />
      </div>
    </ServiceLayout>
  );
}
