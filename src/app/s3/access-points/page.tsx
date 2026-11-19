import ServiceLayout from "@/components/ServiceLayout";
import { s3Nav } from "../s3Nav";
import { fetchBuckets } from "../actions";
import { AccessPointsClient } from "./AccessPointsClient";

export const dynamic = "force-dynamic";

export default async function AccessPointsPage() {
  const result = await fetchBuckets();
  const bucketNames = (result.buckets || []).map((b) => b.name);

  return (
    <ServiceLayout serviceName="S3" serviceColor="#3ECF8E" navItems={s3Nav}>
      <AccessPointsClient bucketNames={bucketNames} />
    </ServiceLayout>
  );
}
