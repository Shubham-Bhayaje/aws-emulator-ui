import ServiceLayout from "@/components/ServiceLayout";
import { s3Nav } from "../s3Nav";
import { fetchBuckets } from "../actions";
import { StorageLensClient } from "./StorageLensClient";

export const dynamic = "force-dynamic";

export default async function StorageLensPage() {
  const result = await fetchBuckets();

  return (
    <ServiceLayout serviceName="S3" serviceColor="#3ECF8E" navItems={s3Nav}>
      <StorageLensClient buckets={result.buckets || []} />
    </ServiceLayout>
  );
}
