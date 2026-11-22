import { notFound } from "next/navigation";
import {
  getApplicationAction,
  listEnvironmentsAction,
  listConfigurationProfilesAction,
  listDeploymentStrategiesAction,
} from "../../../actions";
import StartDeploymentClient from "./StartDeploymentClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ appId: string }>;
  searchParams: Promise<{ environmentId?: string; profileId?: string; version?: string }>;
}

export default async function StartDeploymentPage({ params, searchParams }: Props) {
  const { appId } = await params;
  const { environmentId, profileId, version } = await searchParams;

  const [appRes, envRes, profRes, stratRes] = await Promise.all([
    getApplicationAction(appId),
    listEnvironmentsAction(appId),
    listConfigurationProfilesAction(appId),
    listDeploymentStrategiesAction(),
  ]);

  if (!appRes.success || !appRes.application) {
    notFound();
  }

  return (
    <StartDeploymentClient
      application={appRes.application}
      environments={envRes.items || []}
      profiles={profRes.items || []}
      strategies={stratRes.items || []}
      preselectedEnvId={environmentId}
      preselectedProfileId={profileId}
      preselectedVersion={version}
    />
  );
}
