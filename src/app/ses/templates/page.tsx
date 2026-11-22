import { listTemplatesAction } from "../actions";
import TemplatesClient from "./TemplatesClient";

export const dynamic = "force-dynamic";

export default async function SESTemplatesPage() {
  const res = await listTemplatesAction();
  return <TemplatesClient initialTemplates={res.templates || []} />;
}
