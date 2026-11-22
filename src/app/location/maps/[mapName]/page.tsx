import { notFound } from "next/navigation";
import MapDetailClient from "./MapDetailClient";
import { describeMapAction } from "../../actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ mapName: string }>;
}

export default async function MapDetailPage({ params }: Props) {
  const { mapName } = await params;
  const res = await describeMapAction(mapName);

  if (!res.success || !res.map) {
    notFound();
  }

  return <MapDetailClient map={res.map} />;
}
