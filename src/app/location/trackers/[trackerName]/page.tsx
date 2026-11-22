import { notFound } from "next/navigation";
import TrackerDetailClient from "./TrackerDetailClient";
import {
  describeTrackerAction,
  listTrackerDevicesAction,
  listTrackerConsumersAction,
  listGeofenceCollectionsAction,
} from "../../actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ trackerName: string }>;
}

export default async function TrackerDetailPage({ params }: Props) {
  const { trackerName } = await params;
  const [descRes, devicesRes, consumersRes, collectionsRes] = await Promise.all([
    describeTrackerAction(trackerName),
    listTrackerDevicesAction(trackerName),
    listTrackerConsumersAction(trackerName),
    listGeofenceCollectionsAction(),
  ]);

  if (!descRes.success || !descRes.tracker) {
    notFound();
  }

  return (
    <TrackerDetailClient
      tracker={descRes.tracker}
      initialDevices={devicesRes.devices || []}
      initialConsumers={consumersRes.consumerArns || []}
      availableCollections={collectionsRes.collections || []}
    />
  );
}
