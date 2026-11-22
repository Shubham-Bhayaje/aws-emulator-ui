import { notFound } from "next/navigation";
import ServiceDetailClient from "./ServiceDetailClient";
import { getServiceAction, listInstancesAction, listNamespacesAction } from "../../actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ serviceId: string }>;
}

export default async function ServiceDetailPage({ params }: Props) {
  const { serviceId } = await params;

  const [srvRes, instRes, nsRes] = await Promise.all([
    getServiceAction(serviceId),
    listInstancesAction(serviceId),
    listNamespacesAction(),
  ]);

  if (!srvRes.success || !srvRes.service) {
    notFound();
  }

  const currentNamespace = (nsRes.namespaces || []).find(
    (n) => n.Id === srvRes.service?.NamespaceId
  );

  return (
    <ServiceDetailClient
      service={srvRes.service}
      namespace={currentNamespace}
      initialInstances={instRes.instances || []}
    />
  );
}
