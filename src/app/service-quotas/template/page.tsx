import {
  fetchTemplateAssociation,
  fetchTemplateQuotas,
  fetchServices,
} from "../actions";
import TemplateClient from "./TemplateClient";

export const dynamic = "force-dynamic";

export default async function TemplatePage() {
  const [assocRes, quotasRes, servicesRes] = await Promise.all([
    fetchTemplateAssociation(),
    fetchTemplateQuotas(),
    fetchServices(),
  ]);

  const associated = assocRes.success ? assocRes.associated : false;
  const templateQuotas = quotasRes.success ? quotasRes.data : [];
  const services = servicesRes.success ? servicesRes.data : [];

  return (
    <TemplateClient
      initialAssociated={associated}
      initialTemplateQuotas={templateQuotas}
      services={services}
    />
  );
}
