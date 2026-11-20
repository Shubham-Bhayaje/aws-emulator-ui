import ServiceLayout from "@/components/ServiceLayout";
import { s3Nav } from "../s3Nav";
import { fetchBatchJobs } from "../actions";
import { BatchOperationsClient } from "./BatchOperationsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Batch Operations - Amazon S3",
};

export default async function BatchOperationsPage() {
  const { jobs } = await fetchBatchJobs();

  return (
    <ServiceLayout serviceName="S3" serviceColor="#3ECF8E" navItems={s3Nav}>
      <BatchOperationsClient initialJobs={jobs || []} />
    </ServiceLayout>
  );
}
