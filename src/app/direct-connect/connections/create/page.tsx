import { listLocationsAction } from "../../dx-actions";
import CreateConnectionClient from "./CreateConnectionClient";

export const dynamic = "force-dynamic";

export default async function CreateConnectionPage() {
  const res = await listLocationsAction();
  const locations = res.success ? res.locations : [];

  return <CreateConnectionClient locations={locations} />;
}
