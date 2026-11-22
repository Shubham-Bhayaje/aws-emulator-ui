import { listTransitGatewayAttachmentsAction } from "../transit-gateway-actions";
import TransitGatewayAttachmentsClient from "./TransitGatewayAttachmentsClient";

export const dynamic = "force-dynamic";

export default async function TransitGatewayAttachmentsPage() {
  const res = await listTransitGatewayAttachmentsAction();

  return (
    <TransitGatewayAttachmentsClient
      initialAttachments={res.attachments || []}
    />
  );
}
