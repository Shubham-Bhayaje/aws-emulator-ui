import { fetchKmsKeys } from "../../network-firewall-actions";
import CreateRuleGroupClient from "./CreateRuleGroupClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Create rule group | VPC | AWS Management Console",
};

export default async function CreateRuleGroupPage() {
  const kmsKeys = await fetchKmsKeys();

  return <CreateRuleGroupClient kmsKeys={kmsKeys} />;
}
