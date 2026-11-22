import MapsClient from "./MapsClient";
import { listMapsAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function MapsPage() {
  const res = await listMapsAction();
  return <MapsClient initialMaps={res.maps || []} />;
}
