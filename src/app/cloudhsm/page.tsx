import { describeClustersAction } from "./actions";
import { ClustersClient } from "./ClustersClient";

export const dynamic = "force-dynamic";

export default async function CloudHsmPage() {
  const res = await describeClustersAction();
  return <ClustersClient initialClusters={res.clusters || []} />;
}
