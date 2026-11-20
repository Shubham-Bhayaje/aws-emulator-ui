import { fetchResourceShares } from "./actions";
import ResourceSharesClient from "./ResourceSharesClient";

export const dynamic = "force-dynamic";

export default async function ResourceSharesPage() {
  const res = await fetchResourceShares("SELF");
  const initialShares = res.success ? res.data : [];

  return <ResourceSharesClient initialShares={initialShares} />;
}
