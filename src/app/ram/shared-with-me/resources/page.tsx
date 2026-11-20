import { fetchAllSharedResources } from "../../actions";
import ResourcesClient from "../../resources/ResourcesClient";

export const dynamic = "force-dynamic";

export default async function SharedWithMeResourcesPage() {
  const res = await fetchAllSharedResources("OTHER-ACCOUNTS");
  const initialResources = res.success ? res.data : [];

  return <ResourcesClient initialResources={initialResources} />;
}
