import ServicesClient from "./ServicesClient";
import { listServicesAction, listNamespacesAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function CloudMapServicesPage() {
  const [srvRes, nsRes] = await Promise.all([
    listServicesAction(),
    listNamespacesAction(),
  ]);

  return (
    <ServicesClient
      initialServices={srvRes.services || []}
      namespaces={nsRes.namespaces || []}
      initialError={srvRes.error}
    />
  );
}
