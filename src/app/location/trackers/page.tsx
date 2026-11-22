import TrackersClient from "./TrackersClient";
import { listTrackersAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function TrackersPage() {
  const res = await listTrackersAction();
  return <TrackersClient initialTrackers={res.trackers || []} />;
}
