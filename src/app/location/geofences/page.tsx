import GeofencesClient from "./GeofencesClient";
import { listGeofenceCollectionsAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function GeofencesPage() {
  const res = await listGeofenceCollectionsAction();
  return <GeofencesClient initialCollections={res.collections || []} />;
}
