import { getSmtpSettingsAction } from "../actions";
import SmtpClient from "./SmtpClient";

export const dynamic = "force-dynamic";

export default async function SESSmtpPage() {
  const settings = await getSmtpSettingsAction();
  return <SmtpClient settings={settings} />;
}
