import { notFound } from "next/navigation";
import GeofenceDetailClient from "./GeofenceDetailClient";
import { describeGeofenceCollectionAction, listGeofencesAction } from "../../actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ collectionName: string }>;
}

export default async function GeofenceDetailPage({ params }: Props) {
  const { collectionName } = await params;
  const [descRes, geofencesRes] = await Promise.all([
    describeGeofenceCollectionAction(collectionName),
    listGeofencesAction(collectionName),
  ]);

  if (!descRes.success || !descRes.collection) {
    notFound();
  }

  return (
    <GeofenceDetailClient
      collection={descRes.collection}
      initialGeofences={geofencesRes.geofences || []}
    />
  );
}
