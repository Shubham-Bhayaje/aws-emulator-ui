import { notFound } from "next/navigation";
import {
  getApplicationAction,
  getEnvironmentAction,
  listDeploymentsAction,
  listConfigurationProfilesAction,
} from "../../../../actions";
import EnvironmentDetailClient from "./EnvironmentDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ appId: string; envId: string }>;
}

export default async function EnvironmentDetailPage({ params }: Props) {
  const { appId, envId } = await params;
  const [appRes, envRes, depRes, profRes] = await Promise.all([
    getApplicationAction(appId),
    getEnvironmentAction(appId, envId),
    listDeploymentsAction(appId, envId),
    listConfigurationProfilesAction(appId),
  ]);

  if (!appRes.success || !appRes.application || !envRes.success || !envRes.environment) {
    notFound();
  }

  return (
    <EnvironmentDetailClient
      application={appRes.application}
      environment={envRes.environment}
      initialDeployments={depRes.items || []}
      profiles={profRes.items || []}
    />
  );
}
