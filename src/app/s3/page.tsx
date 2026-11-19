import ServiceLayout from "@/components/ServiceLayout";
import { s3Nav } from "./s3Nav";
import { fetchBuckets } from "./actions";
import { BucketActions } from "./BucketActions";

export const dynamic = "force-dynamic";

export default async function S3Page() {
  const result = await fetchBuckets();

  return (
    <ServiceLayout serviceName="S3" serviceColor="#3ECF8E" navItems={s3Nav}>
      <div className="space-y-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f] tracking-tight">
            General purpose buckets ({result.buckets.length})
          </h1>
          <p className="text-[13px] text-[#545b64] mt-1 max-w-4xl">
            Buckets are containers for data stored in Amazon S3. You can store any number of objects
            in a bucket and can have up to 100 buckets in your account.
          </p>
        </div>

        {result.error ? (
          <div className="bg-[#fbeeed] border-l-4 border-[#d13212] p-4 text-[13px] text-[#d13212]">
            {result.error}
          </div>
        ) : (
          <BucketActions buckets={result.buckets} />
        )}
      </div>
    </ServiceLayout>
  );
}
