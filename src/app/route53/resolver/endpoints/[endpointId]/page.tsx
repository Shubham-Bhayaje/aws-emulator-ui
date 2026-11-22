import { notFound } from "next/navigation";
import { getResolverEndpointDetailAction } from "../../resolver-actions";
import ResolverEndpointDetailClient from "./ResolverEndpointDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ endpointId: string }>;
}

export default async function ResolverEndpointDetailPage({ params }: Props) {
  const { endpointId } = await params;
  const decodedId = decodeURIComponent(endpointId);

  const res = await getResolverEndpointDetailAction(decodedId);
  if (!res.success || !res.endpoint) {
    notFound();
  }

  return (
    <ResolverEndpointDetailClient
      endpoint={res.endpoint}
      initialIpAddresses={res.ipAddresses}
    />
  );
}
