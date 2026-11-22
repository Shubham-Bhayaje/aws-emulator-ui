import { redirect } from "next/navigation";

export default function AppConfigRootPage() {
  redirect("/appconfig/applications");
}
