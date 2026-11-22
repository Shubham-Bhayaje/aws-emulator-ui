import { listIdentitiesAction } from "../actions";
import IdentitiesClient from "./IdentitiesClient";

export const dynamic = "force-dynamic";

export default async function SESIdentitiesPage() {
  const res = await listIdentitiesAction();
  return <IdentitiesClient initialIdentities={res.identities || []} />;
}
