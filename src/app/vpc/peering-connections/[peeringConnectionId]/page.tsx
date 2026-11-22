import { notFound } from "next/navigation";
import { getPeeringConnectionDetailAction } from "../../actions";
import PeeringConnectionDetailClient from "./PeeringConnectionDetailClient";

export const dynamic = "force-dynamic";

export default async function PeeringConnectionDetailPage({
  params,
}: {
  params: Promise<{ peeringConnectionId: string }>;
}) {
  const { peeringConnectionId } = await params;
  const res = await getPeeringConnectionDetailAction(peeringConnectionId);

  if (!res.success || !res.peeringConnection) {
    notFound();
  }

  return (
    <PeeringConnectionDetailClient
      peeringConnection={res.peeringConnection}
      requesterVpc={res.requesterVpc}
      accepterVpc={res.accepterVpc}
    />
  );
}
