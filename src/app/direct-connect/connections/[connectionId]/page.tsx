import { notFound } from "next/navigation";
import { getConnectionDetailAction } from "../../dx-actions";
import ConnectionDetailClient from "./ConnectionDetailClient";

export const dynamic = "force-dynamic";

export default async function ConnectionDetailPage({
  params,
}: {
  params: Promise<{ connectionId: string }>;
}) {
  const { connectionId } = await params;
  const res = await getConnectionDetailAction(connectionId);

  if (!res.success || !res.connection) {
    notFound();
  }

  return (
    <ConnectionDetailClient
      connection={res.connection}
      initialVirtualInterfaces={res.virtualInterfaces}
    />
  );
}
