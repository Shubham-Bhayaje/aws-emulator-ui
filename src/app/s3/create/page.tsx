import ServiceLayout from "@/components/ServiceLayout";
import { s3Nav } from "../s3Nav";
import { createBucket } from "../actions";
import { CreateBucketForm } from "./CreateBucketForm";

export const dynamic = "force-dynamic";

export default function CreateBucketPage() {
  return (
    <ServiceLayout serviceName="S3" serviceColor="#3ECF8E" navItems={s3Nav}>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f] tracking-tight">Create bucket</h1>
          <p className="text-[13px] text-[#545b64] mt-1">
            Buckets are containers for data stored in Amazon S3. Configure bucket settings below.
          </p>
        </div>
        <CreateBucketForm action={createBucket} />
      </div>
    </ServiceLayout>
  );
}
