import { fetchAllSharedResources } from "../actions";
import ResourcesClient from "./ResourcesClient";

export const dynamic = "force-dynamic";

export default async function SharedResourcesPage() {
  const res = await fetchAllSharedResources("SELF");
  const initialResources = res.success ? res.data : [];

  return <ResourcesClient initialResources={initialResources} />;
}
