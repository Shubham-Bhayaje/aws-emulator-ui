import { listTopicsAction } from "@/app/sns/actions";
import CreateVaultWizardClient from "./CreateVaultWizardClient";

export const dynamic = "force-dynamic";

export default async function CreateVaultPage() {
  const res = await listTopicsAction();
  return <CreateVaultWizardClient snsTopics={res.topics || []} />;
}
