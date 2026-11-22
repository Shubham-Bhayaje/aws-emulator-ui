import { notFound } from "next/navigation";
import { getTransitGatewayAttachmentDetailAction } from "../../transit-gateway-actions";
import TransitGatewayAttachmentDetailClient from "./TransitGatewayAttachmentDetailClient";

export const dynamic = "force-dynamic";

export default async function TransitGatewayAttachmentDetailPage({
  params,
}: {
  params: Promise<{ attachmentId: string }>;
}) {
  const { attachmentId } = await params;
  const res = await getTransitGatewayAttachmentDetailAction(attachmentId);

  if (!res.success || !res.attachment) {
    notFound();
  }

  return (
    <TransitGatewayAttachmentDetailClient
      attachment={res.attachment}
      vpc={res.vpc}
      subnets={res.subnets || []}
    />
  );
}
