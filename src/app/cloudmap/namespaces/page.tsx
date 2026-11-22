import NamespacesClient from "./NamespacesClient";
import { listNamespacesAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function CloudMapNamespacesPage() {
  const res = await listNamespacesAction();
  return <NamespacesClient initialNamespaces={res.namespaces || []} initialError={res.error} />;
}
