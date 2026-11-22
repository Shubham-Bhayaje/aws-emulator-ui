import { notFound } from "next/navigation";
import NamespaceDetailClient from "./NamespaceDetailClient";
import { getNamespaceAction, listServicesAction } from "../../actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ namespaceId: string }>;
}

export default async function NamespaceDetailPage({ params }: Props) {
  const { namespaceId } = await params;

  const [nsRes, srvRes] = await Promise.all([
    getNamespaceAction(namespaceId),
    listServicesAction(),
  ]);

  if (!nsRes.success || !nsRes.namespace) {
    notFound();
  }

  // Filter services belonging to this namespace
  const namespaceServices = (srvRes.services || []).filter(
    (s) => s.NamespaceId === namespaceId
  );

  return (
    <NamespaceDetailClient
      namespace={nsRes.namespace}
      initialServices={namespaceServices}
    />
  );
}
