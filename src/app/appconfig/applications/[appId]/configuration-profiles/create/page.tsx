import { notFound } from "next/navigation";
import {
  getApplicationAction,
  listSsmParametersForAppConfigAction,
  listSecretsForAppConfigAction,
  listBucketsForAppConfigAction,
  listIamRolesForAppConfigAction,
} from "../../../../actions";
import CreateProfileClient from "./CreateProfileClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ appId: string }>;
  searchParams: Promise<{ type?: string }>;
}

export default async function CreateConfigurationProfilePage({ params, searchParams }: Props) {
  const { appId } = await params;
  const { type } = await searchParams;

  const [appRes, ssmRes, smRes, s3Res, iamRes] = await Promise.all([
    getApplicationAction(appId),
    listSsmParametersForAppConfigAction(),
    listSecretsForAppConfigAction(),
    listBucketsForAppConfigAction(),
    listIamRolesForAppConfigAction(),
  ]);

  if (!appRes.success || !appRes.application) {
    notFound();
  }

  return (
    <CreateProfileClient
      application={appRes.application}
      initialType={type === "flags" ? "flags" : "freeform"}
      ssmParameters={ssmRes.parameters || []}
      secrets={smRes.secrets || []}
      buckets={s3Res.buckets || []}
      roles={iamRes.roles || []}
    />
  );
}
