import CreateServiceClient from "./CreateServiceClient";
import { listNamespacesAction } from "../../actions";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ namespaceId?: string }>;
}

export default async function CreateServicePage({ searchParams }: Props) {
  const { namespaceId } = await searchParams;
  const nsRes = await listNamespacesAction();

  return (
    <CreateServiceClient
      namespaces={nsRes.namespaces || []}
      preselectedNamespaceId={namespaceId}
    />
  );
}
