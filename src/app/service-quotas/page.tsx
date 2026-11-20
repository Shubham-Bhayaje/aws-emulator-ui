import { fetchServices } from "./actions";
import ServicesClient from "./ServicesClient";

export const dynamic = "force-dynamic";

export default async function ServiceQuotasPage() {
  const res = await fetchServices();
  const services = res.success ? res.data : [];

  return <ServicesClient initialServices={services} />;
}
