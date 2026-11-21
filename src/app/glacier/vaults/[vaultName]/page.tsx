import { notFound } from "next/navigation";
import { describeVaultAction, listJobsAction, getJobOutputAction } from "../../actions";
import VaultDetailClient from "./VaultDetailClient";
import { GlacierArchive } from "../../types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ vaultName: string }>;
};

export default async function VaultDetailPage(props: Props) {
  const { vaultName } = await props.params;
  const decodedVaultName = decodeURIComponent(vaultName);

  const vaultRes = await describeVaultAction(decodedVaultName);
  if (!vaultRes.success || !vaultRes.vault) {
    notFound();
  }

  const jobsRes = await listJobsAction(decodedVaultName);
  const jobs = jobsRes.jobs || [];

  // Check if there is a completed inventory retrieval job to populate initial archives
  let initialArchives: GlacierArchive[] = [];
  const completedInventoryJob = jobs.find(
    (j) => j.Action === "InventoryRetrieval" && j.StatusCode === "Succeeded"
  );
  if (completedInventoryJob) {
    const outputRes = await getJobOutputAction(decodedVaultName, completedInventoryJob.JobId);
    if (outputRes.archives) {
      initialArchives = outputRes.archives;
    }
  }

  return (
    <VaultDetailClient
      vault={vaultRes.vault}
      initialJobs={jobs}
      initialArchives={initialArchives}
    />
  );
}
