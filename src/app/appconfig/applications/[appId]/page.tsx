import { notFound } from "next/navigation";
import {
  getApplicationAction,
  listEnvironmentsAction,
  listConfigurationProfilesAction,
} from "../../actions";
import ApplicationDetailClient from "./ApplicationDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ appId: string }>;
}

export default async function ApplicationDetailPage({ params }: Props) {
  const { appId } = await params;
  const [appRes, envRes, profRes] = await Promise.all([
    getApplicationAction(appId),
    listEnvironmentsAction(appId),
    listConfigurationProfilesAction(appId),
  ]);

  if (!appRes.success || !appRes.application) {
    notFound();
  }

  return (
    <ApplicationDetailClient
      application={appRes.application}
      initialEnvironments={envRes.items || []}
      initialProfiles={profRes.items || []}
    />
  );
}
