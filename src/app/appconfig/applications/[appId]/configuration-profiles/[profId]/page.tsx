import { notFound } from "next/navigation";
import {
  getApplicationAction,
  getConfigurationProfileAction,
  listHostedConfigurationVersionsAction,
  getHostedConfigurationVersionAction,
  listEnvironmentsAction,
} from "../../../../actions";
import ProfileDetailClient from "./ProfileDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ appId: string; profId: string }>;
}

export default async function ConfigurationProfileDetailPage({ params }: Props) {
  const { appId, profId } = await params;
  const [appRes, profRes, versionsRes, envRes] = await Promise.all([
    getApplicationAction(appId),
    getConfigurationProfileAction(appId, profId),
    listHostedConfigurationVersionsAction(appId, profId),
    listEnvironmentsAction(appId),
  ]);

  if (!appRes.success || !appRes.application || !profRes.success || !profRes.profile) {
    notFound();
  }

  const versions = versionsRes.items || [];
  let latestContent = "";
  let latestContentType = "application/json";

  if (versions.length > 0) {
    const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
    const latestNum = sorted[0].versionNumber;
    const latestRes = await getHostedConfigurationVersionAction(appId, profId, latestNum);
    if (latestRes.success && latestRes.version) {
      latestContent = latestRes.version.content || "";
      latestContentType = latestRes.version.contentType || "application/json";
    }
  }

  return (
    <ProfileDetailClient
      application={appRes.application}
      profile={profRes.profile}
      initialVersions={versions}
      latestContent={latestContent}
      latestContentType={latestContentType}
      environments={envRes.items || []}
    />
  );
}
