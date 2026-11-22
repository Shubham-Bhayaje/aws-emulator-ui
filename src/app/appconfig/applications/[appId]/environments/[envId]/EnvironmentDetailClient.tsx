"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteEnvironmentAction,
  stopDeploymentAction,
  testRetrieveConfigurationAction,
} from "../../../../actions";

interface DeploymentItem {
  deploymentNumber: number;
  configurationName: string;
  configurationVersion: string;
  deploymentDurationInMinutes: number;
  growthType: string;
  growthFactor: number;
  finalBakeTimeInMinutes: number;
  state: string;
  percentageComplete: number;
  startedAt: string;
  completedAt?: string;
}

interface ProfileItem {
  id: string;
  name: string;
  type: string;
  locationUri: string;
}

interface Props {
  application: {
    id: string;
    name: string;
  };
  environment: {
    id: string;
    applicationId: string;
    name: string;
    description: string;
    state: string;
    monitors: Array<{ alarmArn: string; alarmRoleArn?: string }>;
  };
  initialDeployments: DeploymentItem[];
  profiles: ProfileItem[];
}

export default function EnvironmentDetailClient({
  application,
  environment,
  initialDeployments,
  profiles,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"deployments" | "client">("deployments");
  const [deployments, setDeployments] = useState<DeploymentItem[]>(initialDeployments);
  const [stoppingNum, setStoppingNum] = useState<number | null>(null);

  // Client Test Playground State
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    profiles.length > 0 ? profiles[0].id : ""
  );
  const [retrieving, setRetrieving] = useState(false);
  const [retrieveResult, setRetrieveResult] = useState<{
    success: boolean;
    contentType?: string;
    nextToken?: string;
    configuration?: string;
    error?: string;
  } | null>(null);

  // Delete environment modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteConfirmText.toLowerCase() !== "delete") return;
    setDeleteLoading(true);
    setDeleteError(null);
    const res = await deleteEnvironmentAction(application.id, environment.id);
    setDeleteLoading(false);
    if (res.success) {
      router.push(`/appconfig/applications/${application.id}`);
    } else {
      setDeleteError(res.error || "Failed to delete environment.");
    }
  };

  const handleStopDeployment = async (depNum: number) => {
    setStoppingNum(depNum);
    const res = await stopDeploymentAction(application.id, environment.id, depNum);
    setStoppingNum(null);
    if (res.success) {
      setDeployments((prev) =>
        prev.map((d) =>
          d.deploymentNumber === depNum ? { ...d, state: "ROLLED_BACK" } : d
        )
      );
      router.refresh();
    }
  };

  const handleTestRetrieve = async () => {
    if (!selectedProfileId) return;
    setRetrieving(true);
    setRetrieveResult(null);
    const res = await testRetrieveConfigurationAction(
      application.id,
      environment.id,
      selectedProfileId
    );
    setRetrieving(false);
    setRetrieveResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="text-[12px] text-[#545b64] flex items-center gap-1.5">
        <Link href="/appconfig/applications" className="hover:text-[#0073bb]">
          Applications
        </Link>
        <span>&rsaquo;</span>
        <Link href={`/appconfig/applications/${application.id}`} className="hover:text-[#0073bb]">
          {application.name}
        </Link>
        <span>&rsaquo;</span>
        <span className="text-[#545b64]">Environments</span>
        <span>&rsaquo;</span>
        <span className="text-[#16191f]">{environment.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#eaeded]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-bold text-[#16191f]">{environment.name}</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#f2f3f3] text-[#545b64] border border-[#eaeded]">
              {environment.id}
            </span>
          </div>
          <p className="text-[13px] text-[#545b64] mt-1">
            {environment.description || "No description provided."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setDeleteError(null);
              setIsDeleteOpen(true);
            }}
            className="px-3 text-[13px] font-medium text-[#d13212] bg-white border border-[#d13212] rounded hover:bg-[#fdf2f2]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete
          </button>
          <Link
            href={`/appconfig/applications/${application.id}/deploy?environmentId=${environment.id}`}
            className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded flex items-center justify-center transition-colors shadow-xs"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Start deployment
          </Link>
        </div>
      </div>

      {/* Summary Box */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white border border-[#eaeded] rounded p-4 text-[13px]">
        <div>
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            State
          </div>
          <div className="mt-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e6f4ea] text-[#137333]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
              {environment.state || "ReadyForDeployment"}
            </span>
          </div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Environment ID
          </div>
          <div className="font-mono text-[#16191f] mt-1">{environment.id}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Deployments
          </div>
          <div className="text-[#16191f] font-semibold mt-1">{deployments.length}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            Alarm Monitors
          </div>
          <div className="text-[#16191f] mt-1">{environment.monitors.length} configured</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#eaeded] flex items-center gap-8">
        <button
          onClick={() => setActiveTab("deployments")}
          className={`pb-3 text-[14px] font-bold transition-colors border-b-2 ${
            activeTab === "deployments"
              ? "border-[#0073bb] text-[#0073bb]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Deployments ({deployments.length})
        </button>
        <button
          onClick={() => setActiveTab("client")}
          className={`pb-3 text-[14px] font-bold transition-colors border-b-2 ${
            activeTab === "client"
              ? "border-[#0073bb] text-[#0073bb]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Client test playground (AppConfigData)
        </button>
      </div>

      {/* TAB 1: Deployments */}
      {activeTab === "deployments" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Deployments</h2>
              <p className="text-[12px] text-[#545b64]">
                A deployment is a process of distributing a configuration version to an environment using a deployment strategy.
              </p>
            </div>
            <Link
              href={`/appconfig/applications/${application.id}/deploy?environmentId=${environment.id}`}
              className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded flex items-center justify-center transition-colors"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Start deployment
            </Link>
          </div>

          <div className="bg-white border border-[#eaeded] rounded shadow-xs overflow-hidden">
            {deployments.length === 0 ? (
              <div className="p-8 text-center text-[#545b64]">
                <p className="text-[13px] font-semibold text-[#16191f]">No deployments</p>
                <p className="text-[12px] mt-1 mb-4">
                  Deploy a configuration profile version to this environment to start serving configurations to your applications.
                </p>
                <Link
                  href={`/appconfig/applications/${application.id}/deploy?environmentId=${environment.id}`}
                  className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Start deployment
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
                      <th className="py-2.5 px-4">Deployment #</th>
                      <th className="py-2.5 px-4">Configuration</th>
                      <th className="py-2.5 px-4">Version</th>
                      <th className="py-2.5 px-4">State</th>
                      <th className="py-2.5 px-4">Progress</th>
                      <th className="py-2.5 px-4">Started at</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeded]">
                    {deployments.map((d) => {
                      const isComplete = d.state === "COMPLETE";
                      const isDeploying = d.state === "DEPLOYING";
                      const isRolledBack = d.state === "ROLLED_BACK";
                      return (
                        <tr key={d.deploymentNumber} className="hover:bg-[#fafafa]">
                          <td className="py-2.5 px-4 font-bold text-[#16191f]">
                            #{d.deploymentNumber}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-[#0073bb]">
                            {d.configurationName}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[12px] text-[#545b64]">
                            v{d.configurationVersion}
                          </td>
                          <td className="py-2.5 px-4">
                            {isComplete && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e6f4ea] text-[#137333]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
                                Complete
                              </span>
                            )}
                            {isDeploying && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e8f0fe] text-[#1a73e8]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#1a73e8] animate-ping" />
                                Deploying
                              </span>
                            )}
                            {isRolledBack && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fdf2f2] text-[#d13212]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#d13212]" />
                                Rolled back
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-[#eaeded] rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full ${isRolledBack ? "bg-[#d13212]" : "bg-[#1d8102]"}`}
                                  style={{ width: `${d.percentageComplete}%` }}
                                />
                              </div>
                              <span className="text-[12px] text-[#545b64]">
                                {d.percentageComplete}%
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-[#545b64] text-[12px]">
                            {new Date(d.startedAt).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {isDeploying && (
                              <button
                                onClick={() => handleStopDeployment(d.deploymentNumber)}
                                disabled={stoppingNum === d.deploymentNumber}
                                className="px-2.5 py-1 text-[12px] font-medium text-[#d13212] bg-white border border-[#d13212] rounded hover:bg-[#fdf2f2]"
                              >
                                {stoppingNum === d.deploymentNumber ? "Stopping..." : "Stop deployment"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AppConfigData Client Test Playground */}
      {activeTab === "client" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">
                Retrieve configuration using AppConfigData client
              </h2>
              <p className="text-[12px] text-[#545b64] mt-1">
                Applications use the <code className="bg-[#f2f3f3] px-1 py-0.5 rounded font-mono text-[#16191f]">@aws-sdk/client-appconfigdata</code> to
                retrieve configuration payloads by starting a session and polling for latest configuration.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <div>
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                  Target configuration profile
                </label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded bg-white"
                >
                  {profiles.length === 0 ? (
                    <option value="">No profiles available</option>
                  ) : (
                    profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.type.includes("FeatureFlags") ? "Feature Flags" : "Freeform"})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleTestRetrieve}
                disabled={retrieving || !selectedProfileId}
                className="px-4 text-[13px] font-semibold text-white bg-[#0073bb] hover:bg-[#005f9e] rounded disabled:opacity-40 flex items-center justify-center transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {retrieving ? "Retrieving data..." : "Retrieve latest configuration"}
              </button>
            </div>

            {/* Result display */}
            {retrieveResult && (
              <div className="mt-4 pt-4 border-t border-[#eaeded] space-y-3">
                {retrieveResult.success ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e6f4ea] text-[#137333]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
                        200 OK
                      </span>
                      <span className="text-[12px] text-[#545b64]">
                        Content-Type: <strong>{retrieveResult.contentType}</strong>
                      </span>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider mb-1">
                        Configuration payload received by client:
                      </div>
                      <pre className="p-4 bg-[#16191f] text-[#34d399] font-mono text-[12px] rounded overflow-x-auto max-h-96">
                        {retrieveResult.configuration || "(empty payload)"}
                      </pre>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider mb-1">
                        NextPollConfigurationToken
                      </div>
                      <div className="p-2 bg-[#fafafa] border border-[#eaeded] rounded font-mono text-[11px] text-[#545b64] truncate">
                        {retrieveResult.nextToken}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-[#fdf2f2] border border-[#d13212] rounded text-[13px] text-[#d13212]">
                    <strong>Error retrieving configuration:</strong> {retrieveResult.error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AWS CLI Reference snippet */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-3">
            <h3 className="text-[14px] font-bold text-[#16191f]">AWS CLI equivalent commands</h3>
            <pre className="p-4 bg-[#f2f3f3] text-[#16191f] font-mono text-[12px] rounded overflow-x-auto">
{`# 1. Start configuration session:
TOKEN=$(aws appconfigdata start-configuration-session \\
  --application-identifier ${application.id} \\
  --environment-identifier ${environment.id} \\
  --configuration-profile-identifier <profile-id> \\
  --query "InitialConfigurationToken" --output text)

# 2. Get latest configuration:
aws appconfigdata get-latest-configuration \\
  --configuration-token "$TOKEN" \\
  /tmp/latest-config.json`}
            </pre>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#eaeded] shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#eaeded]">
              <h3 className="text-[16px] font-bold text-[#16191f]">Delete environment</h3>
              <button onClick={() => setIsDeleteOpen(false)} className="text-[#545b64] hover:text-[#16191f]">
                ✕
              </button>
            </div>
            <p className="text-[13px] text-[#16191f]">
              Are you sure you want to delete environment <strong>{environment.name}</strong> ({environment.id})?
            </p>
            {deleteError && (
              <div className="p-3 bg-[#fdf2f2] border border-[#d13212] rounded text-[13px] text-[#d13212]">
                {deleteError}
              </div>
            )}
            <div>
              <label className="block text-[12px] font-medium text-[#545b64] mb-1">
                To confirm deletion, type <code className="text-[#d13212] font-mono">delete</code>:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading || deleteConfirmText.toLowerCase() !== "delete"}
                className="px-4 text-[13px] font-semibold text-white bg-[#d13212] hover:bg-[#b02a0f] rounded disabled:opacity-40"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
