"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startDeploymentAction,
  listHostedConfigurationVersionsAction,
} from "../../../actions";

interface EnvironmentItem {
  id: string;
  name: string;
}

interface ProfileItem {
  id: string;
  name: string;
  type: string;
  locationUri: string;
}

interface StrategyItem {
  id: string;
  name: string;
  deploymentDurationInMinutes: number;
  growthFactor: number;
  growthType: string;
  finalBakeTimeInMinutes: number;
}

interface Props {
  application: {
    id: string;
    name: string;
  };
  environments: EnvironmentItem[];
  profiles: ProfileItem[];
  strategies: StrategyItem[];
  preselectedEnvId?: string;
  preselectedProfileId?: string;
  preselectedVersion?: string;
}

export default function StartDeploymentClient({
  application,
  environments,
  profiles,
  strategies,
  preselectedEnvId,
  preselectedProfileId,
  preselectedVersion,
}: Props) {
  const router = useRouter();

  const [environmentId, setEnvironmentId] = useState(
    preselectedEnvId || (environments.length > 0 ? environments[0].id : "")
  );
  const [profileId, setProfileId] = useState(
    preselectedProfileId || (profiles.length > 0 ? profiles[0].id : "")
  );
  const [strategyId, setStrategyId] = useState(
    strategies.find((s) => s.id === "AppConfig.AllAtOnce")?.id ||
      (strategies.length > 0 ? strategies[0].id : "")
  );

  const [availableVersions, setAvailableVersions] = useState<number[]>([]);
  const [versionNumber, setVersionNumber] = useState(preselectedVersion || "1");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch versions when profile changes
  useEffect(() => {
    if (!profileId) return;
    let isMounted = true;
    listHostedConfigurationVersionsAction(application.id, profileId).then((res) => {
      if (isMounted && res.success && res.items) {
        const nums = res.items.map((i) => i.versionNumber).sort((a, b) => b - a);
        setAvailableVersions(nums);
        if (nums.length > 0 && !preselectedVersion) {
          setVersionNumber(nums[0].toString());
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [application.id, profileId, preselectedVersion]);

  const selectedStrategy = strategies.find((s) => s.id === strategyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!environmentId || !profileId || !strategyId || !versionNumber) {
      setError("Please complete all required deployment fields.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await startDeploymentAction(
      application.id,
      environmentId,
      strategyId,
      profileId,
      versionNumber,
      description.trim() || undefined
    );

    setLoading(false);

    if (res.success) {
      router.push(`/appconfig/applications/${application.id}/environments/${environmentId}`);
    } else {
      setError(res.error || "Failed to start deployment.");
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
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
        <span className="text-[#16191f]">Start deployment</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Start deployment</h1>
        <p className="text-[13px] text-[#545b64] mt-1">
          Deploy a configuration version to an environment using a deployment strategy that defines duration and bake time.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#fdf2f2] border border-[#d13212] rounded text-[13px] text-[#d13212]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Environment */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">1. Select environment</h2>
          {environments.length === 0 ? (
            <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded text-[13px] text-[#545b64]">
              No environments exist for this application.{" "}
              <Link
                href={`/appconfig/applications/${application.id}/environments/create`}
                className="text-[#0073bb] underline font-medium"
              >
                Create an environment first
              </Link>
              .
            </div>
          ) : (
            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                Environment <span className="text-[#d13212]">*</span>
              </label>
              <select
                value={environmentId}
                onChange={(e) => setEnvironmentId(e.target.value)}
                className="w-full max-w-md px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded bg-white"
              >
                {environments.map((env) => (
                  <option key={env.id} value={env.id}>
                    {env.name} ({env.id})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Step 2: Configuration profile and version */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">2. Select configuration profile & version</h2>
          {profiles.length === 0 ? (
            <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded text-[13px] text-[#545b64]">
              No configuration profiles exist.{" "}
              <Link
                href={`/appconfig/applications/${application.id}/configuration-profiles/create`}
                className="text-[#0073bb] underline font-medium"
              >
                Create a configuration profile first
              </Link>
              .
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                  Configuration profile <span className="text-[#d13212]">*</span>
                </label>
                <select
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                  className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded bg-white"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.type.includes("FeatureFlags") ? "Feature Flags" : "Freeform"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                  Configuration version <span className="text-[#d13212]">*</span>
                </label>
                {availableVersions.length > 0 ? (
                  <select
                    value={versionNumber}
                    onChange={(e) => setVersionNumber(e.target.value)}
                    className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded bg-white font-mono"
                  >
                    {availableVersions.map((v) => (
                      <option key={v} value={v.toString()}>
                        Version {v}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={versionNumber}
                    onChange={(e) => setVersionNumber(e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded font-mono"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Deployment strategy */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#16191f]">3. Deployment strategy</h2>
            <Link
              href="/appconfig/deployment-strategies/create"
              className="text-[12px] text-[#0073bb] hover:underline"
            >
              Create custom strategy
            </Link>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Strategy <span className="text-[#d13212]">*</span>
            </label>
            <select
              value={strategyId}
              onChange={(e) => setStrategyId(e.target.value)}
              className="w-full max-w-md px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded bg-white"
            >
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.growthType} {s.growthFactor}%, Duration: {s.deploymentDurationInMinutes}m, Bake: {s.finalBakeTimeInMinutes}m)
                </option>
              ))}
            </select>
          </div>

          {selectedStrategy && (
            <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
              <div>
                <span className="text-[#545b64] block">Duration</span>
                <span className="font-semibold text-[#16191f]">{selectedStrategy.deploymentDurationInMinutes} minutes</span>
              </div>
              <div>
                <span className="text-[#545b64] block">Growth type</span>
                <span className="font-semibold text-[#16191f]">{selectedStrategy.growthType}</span>
              </div>
              <div>
                <span className="text-[#545b64] block">Growth factor</span>
                <span className="font-semibold text-[#16191f]">{selectedStrategy.growthFactor}%</span>
              </div>
              <div>
                <span className="text-[#545b64] block">Bake time</span>
                <span className="font-semibold text-[#16191f]">{selectedStrategy.finalBakeTimeInMinutes} minutes</span>
              </div>
            </div>
          )}
        </div>

        {/* Step 4: Description */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">4. Deployment details - optional</h2>
          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Roll out 2026 checkout flags to production"
              className="w-full max-w-lg px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/appconfig/applications/${application.id}`}
            className="px-4 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa] flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !environmentId || !profileId || !strategyId}
            className="px-5 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded disabled:opacity-40 flex items-center justify-center transition-colors shadow-xs"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Starting deployment..." : "Start deployment"}
          </button>
        </div>
      </form>
    </div>
  );
}
