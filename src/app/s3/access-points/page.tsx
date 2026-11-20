import ServiceLayout from "@/components/ServiceLayout";
import { s3Nav } from "../s3Nav";
import { fetchBuckets, fetchAccessPoints } from "../actions";
import { AccessPointsClient } from "./AccessPointsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Access Points - Amazon S3",
};

export default async function AccessPointsPage() {
  const [bucketRes, apRes] = await Promise.all([
    fetchBuckets(),
    fetchAccessPoints(),
  ]);

  const bucketNames = (bucketRes.buckets || []).map((b) => b.name);
  const initialAccessPoints = apRes.accessPoints || [];

  return (
    <ServiceLayout serviceName="S3" serviceColor="#3ECF8E" navItems={s3Nav}>
      <AccessPointsClient
        bucketNames={bucketNames}
        initialAccessPoints={initialAccessPoints}
      />
    </ServiceLayout>
  );
}
