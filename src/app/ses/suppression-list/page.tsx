import { listSuppressedDestinationsAction } from "../actions";
import SuppressionListClient from "./SuppressionListClient";

export const dynamic = "force-dynamic";

export default async function SESSuppressionListPage() {
  const res = await listSuppressedDestinationsAction();
  return <SuppressionListClient initialDestinations={res.destinations || []} />;
}
