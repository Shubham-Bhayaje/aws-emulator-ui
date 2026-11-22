import { notFound } from "next/navigation";
import { getApplicationAction } from "../../../../actions";
import CreateEnvironmentClient from "./CreateEnvironmentClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ appId: string }>;
}

export default async function CreateEnvironmentPage({ params }: Props) {
  const { appId } = await params;
  const res = await getApplicationAction(appId);
  if (!res.success || !res.application) {
    notFound();
  }

  return <CreateEnvironmentClient application={res.application} />;
}
