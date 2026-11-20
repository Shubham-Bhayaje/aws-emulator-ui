import ServiceLayout from "@/components/ServiceLayout";
import { s3Nav } from "../s3Nav";
import { fetchBuckets, fetchMultiRegionAccessPoints } from "../actions";
import { MultiRegionAccessPointsClient } from "./MultiRegionAccessPointsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Multi-Region Access Points - Amazon S3",
};

export default async function MultiRegionAccessPointsPage() {
  const [bucketsRes, mrapRes] = await Promise.all([
    fetchBuckets(),
    fetchMultiRegionAccessPoints(),
  ]);

  const bucketNames = (bucketsRes.buckets || []).map((b) => b.name);
  const initialPoints = mrapRes.points || [];

  return (
    <ServiceLayout serviceName="S3" serviceColor="#3ECF8E" navItems={s3Nav}>
      <MultiRegionAccessPointsClient
        bucketNames={bucketNames}
        initialPoints={initialPoints}
      />
    </ServiceLayout>
  );
}
