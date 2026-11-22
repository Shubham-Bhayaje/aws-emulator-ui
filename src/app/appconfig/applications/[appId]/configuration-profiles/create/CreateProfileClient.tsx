"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createConfigurationProfileAction,
  createHostedConfigurationVersionAction,
} from "../../../../actions";

interface Props {
  application: {
    id: string;
    name: string;
  };
  initialType: "flags" | "freeform";
  ssmParameters: Array<{ name: string; type: string; arn: string }>;
  secrets: Array<{ name: string; arn: string }>;
  buckets: Array<{ name: string }>;
  roles: Array<{ roleName: string; arn: string }>;
}

export default function CreateProfileClient({
  application,
  initialType,
  ssmParameters,
  secrets,
  buckets,
  roles,
}: Props) {
  const router = useRouter();
  const [profileType, setProfileType] = useState<"flags" | "freeform">(initialType);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Freeform source options
  const [sourceType, setSourceType] = useState<"hosted" | "ssm" | "secretsmanager" | "s3">("hosted");
  const [selectedSsm, setSelectedSsm] = useState(ssmParameters.length > 0 ? ssmParameters[0].name : "");
  const [selectedSecret, setSelectedSecret] = useState(secrets.length > 0 ? secrets[0].arn : "");
  const [selectedBucket, setSelectedBucket] = useState(buckets.length > 0 ? buckets[0].name : "");
  const [s3Key, setS3Key] = useState("config.json");
  const [retrievalRoleArn, setRetrievalRoleArn] = useState(roles.length > 0 ? roles[0].arn : "");

  // Content for hosted profiles
  const [contentType, setContentType] = useState("application/json");
  const [initialContent, setInitialContent] = useState(
    initialType === "flags"
      ? JSON.stringify(
          {
            version: "1",
            flags: {
              newCheckoutFlow: {
                name: "New Checkout Flow",
                description: "Enables new 2026 1-click checkout experience",
                attributes: {},
              },
            },
            values: {
              newCheckoutFlow: {
                enabled: true,
              },
            },
          },
          null,
          2
        )
      : JSON.stringify({ appName: application.name, maxConnections: 50, debug: false }, null, 2)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTypeChange = (newType: "flags" | "freeform") => {
    setProfileType(newType);
    if (newType === "flags") {
      setSourceType("hosted");
      setContentType("application/json");
      setInitialContent(
        JSON.stringify(
          {
            version: "1",
            flags: {
              newCheckoutFlow: {
                name: "New Checkout Flow",
                description: "Enables new 2026 1-click checkout experience",
                attributes: {},
              },
            },
            values: {
              newCheckoutFlow: {
                enabled: true,
              },
            },
          },
          null,
          2
        )
      );
    } else {
      setInitialContent(
        JSON.stringify({ appName: application.name, maxConnections: 50, debug: false }, null, 2)
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Configuration profile name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    let locationUri = "hosted";
    let roleArn = undefined;

    if (profileType === "flags") {
      locationUri = "hosted";
    } else {
      if (sourceType === "hosted") {
        locationUri = "hosted";
      } else if (sourceType === "ssm") {
        locationUri = `ssm-parameter://${selectedSsm.replace(/^\//, "")}`;
        roleArn = retrievalRoleArn || undefined;
      } else if (sourceType === "secretsmanager") {
        locationUri = `secretsmanager://${selectedSecret}`;
        roleArn = retrievalRoleArn || undefined;
      } else if (sourceType === "s3") {
        locationUri = `s3://${selectedBucket}/${s3Key.replace(/^\//, "")}`;
        roleArn = retrievalRoleArn || undefined;
      }
    }

    const typeStr = profileType === "flags" ? "AWS.AppConfig.FeatureFlags" : "AWS.Freeform";

    const res = await createConfigurationProfileAction(
      application.id,
      name.trim(),
      locationUri,
      typeStr,
      description.trim() || undefined,
      roleArn
    );

    if (!res.success || !res.profile) {
      setLoading(false);
      setError(res.error || "Failed to create configuration profile.");
      return;
    }

    const profileId = res.profile.id;

    // If hosted, create initial hosted configuration version 1
    if (locationUri === "hosted" && initialContent.trim()) {
      const verRes = await createHostedConfigurationVersionAction(
        application.id,
        profileId,
        initialContent.trim(),
        contentType,
        "Initial version created with profile"
      );
      if (!verRes.success) {
        setLoading(false);
        setError(
          `Profile created, but failed to create initial hosted version: ${verRes.error}`
        );
        return;
      }
    }

    setLoading(false);
    router.push(`/appconfig/applications/${application.id}/configuration-profiles/${profileId}`);
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
        <span className="text-[#545b64]">Configuration profiles</span>
        <span>&rsaquo;</span>
        <span className="text-[#16191f]">Create</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f]">
          Create configuration profile
        </h1>
        <p className="text-[13px] text-[#545b64] mt-1">
          A configuration profile can be a feature flag configuration or a freeform configuration stored in AWS AppConfig, Systems Manager, Secrets Manager, or Amazon S3.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#fdf2f2] border border-[#d13212] rounded text-[13px] text-[#d13212]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile type card */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">Profile type</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`p-4 border rounded cursor-pointer transition-colors ${
                profileType === "flags"
                  ? "border-[#0073bb] bg-[#f2f8fd]"
                  : "border-[#eaeded] hover:bg-[#fafafa]"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="profile-type"
                  checked={profileType === "flags"}
                  onChange={() => handleTypeChange("flags")}
                  className="mt-0.5 text-[#0073bb]"
                />
                <div>
                  <div className="text-[14px] font-bold text-[#16191f]">Feature flag</div>
                  <p className="text-[12px] text-[#545b64] mt-1">
                    Manage dynamic flags with boolean or structured values to safely roll out features without deploying new code.
                  </p>
                </div>
              </div>
            </label>

            <label
              className={`p-4 border rounded cursor-pointer transition-colors ${
                profileType === "freeform"
                  ? "border-[#0073bb] bg-[#f2f8fd]"
                  : "border-[#eaeded] hover:bg-[#fafafa]"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="profile-type"
                  checked={profileType === "freeform"}
                  onChange={() => handleTypeChange("freeform")}
                  className="mt-0.5 text-[#0073bb]"
                />
                <div>
                  <div className="text-[14px] font-bold text-[#16191f]">Freeform configuration</div>
                  <p className="text-[12px] text-[#545b64] mt-1">
                    Store and deploy raw JSON, YAML, or plain text configuration profiles from AppConfig, SSM, Secrets Manager, or S3.
                  </p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Basic Details */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">Profile details</h2>

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Name <span className="text-[#d13212]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={profileType === "flags" ? "e.g. checkout-feature-flags" : "e.g. app-settings"}
              className="w-full max-w-md px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb] bg-white text-[#16191f]"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Description <span className="text-[12px] font-normal text-[#545b64]">- optional</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Configuration profile description"
              className="w-full max-w-lg px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb] bg-white text-[#16191f]"
            />
          </div>
        </div>

        {/* Configuration Source (for Freeform) */}
        {profileType === "freeform" && (
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f]">Configuration source</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                <input
                  type="radio"
                  name="source-type"
                  checked={sourceType === "hosted"}
                  onChange={() => setSourceType("hosted")}
                  className="text-[#0073bb]"
                />
                <span className="font-medium text-[#16191f]">AppConfig hosted configuration</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                <input
                  type="radio"
                  name="source-type"
                  checked={sourceType === "ssm"}
                  onChange={() => setSourceType("ssm")}
                  className="text-[#0073bb]"
                />
                <span className="font-medium text-[#16191f]">Systems Manager Parameter Store</span>
              </label>

              {sourceType === "ssm" && (
                <div className="pl-6 pt-1">
                  <label className="block text-[12px] font-medium text-[#545b64] mb-1">
                    Select Parameter:
                  </label>
                  {ssmParameters.length === 0 ? (
                    <div className="text-[12px] text-[#545b64] italic">
                      No parameters found in Parameter Store.{" "}
                      <Link href="/systems-manager/parameter-store" className="text-[#0073bb] underline">
                        Create parameter
                      </Link>
                    </div>
                  ) : (
                    <select
                      value={selectedSsm}
                      onChange={(e) => setSelectedSsm(e.target.value)}
                      className="px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded bg-white w-80"
                    >
                      {ssmParameters.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name} ({p.type})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                <input
                  type="radio"
                  name="source-type"
                  checked={sourceType === "secretsmanager"}
                  onChange={() => setSourceType("secretsmanager")}
                  className="text-[#0073bb]"
                />
                <span className="font-medium text-[#16191f]">AWS Secrets Manager secret</span>
              </label>

              {sourceType === "secretsmanager" && (
                <div className="pl-6 pt-1">
                  <label className="block text-[12px] font-medium text-[#545b64] mb-1">
                    Select Secret:
                  </label>
                  {secrets.length === 0 ? (
                    <div className="text-[12px] text-[#545b64] italic">
                      No secrets found in Secrets Manager.{" "}
                      <Link href="/secretsmanager/new" className="text-[#0073bb] underline">
                        Create secret
                      </Link>
                    </div>
                  ) : (
                    <select
                      value={selectedSecret}
                      onChange={(e) => setSelectedSecret(e.target.value)}
                      className="px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded bg-white w-80 font-mono text-[12px]"
                    >
                      {secrets.map((s) => (
                        <option key={s.arn} value={s.arn}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                <input
                  type="radio"
                  name="source-type"
                  checked={sourceType === "s3"}
                  onChange={() => setSourceType("s3")}
                  className="text-[#0073bb]"
                />
                <span className="font-medium text-[#16191f]">Amazon S3 object</span>
              </label>

              {sourceType === "s3" && (
                <div className="pl-6 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                  <div>
                    <label className="block text-[12px] font-medium text-[#545b64] mb-1">
                      S3 Bucket:
                    </label>
                    {buckets.length === 0 ? (
                      <div className="text-[12px] text-[#545b64] italic">
                        No buckets.{" "}
                        <Link href="/s3" className="text-[#0073bb] underline">
                          Create bucket
                        </Link>
                      </div>
                    ) : (
                      <select
                        value={selectedBucket}
                        onChange={(e) => setSelectedBucket(e.target.value)}
                        className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded bg-white"
                      >
                        {buckets.map((b) => (
                          <option key={b.name} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#545b64] mb-1">
                      S3 Object Key:
                    </label>
                    <input
                      type="text"
                      value={s3Key}
                      onChange={(e) => setS3Key(e.target.value)}
                      placeholder="config.json"
                      className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded"
                    />
                  </div>
                </div>
              )}
            </div>

            {sourceType !== "hosted" && (
              <div className="pt-2 border-t border-[#eaeded]">
                <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                  Retrieval IAM Role ARN (optional)
                </label>
                <input
                  type="text"
                  value={retrievalRoleArn}
                  onChange={(e) => setRetrievalRoleArn(e.target.value)}
                  placeholder="arn:aws:iam::000000000000:role/AppConfigServiceRole"
                  className="w-full max-w-lg px-3 py-1.5 text-[12px] font-mono border border-[#aab7b8] rounded"
                />
              </div>
            )}
          </div>
        )}

        {/* Initial Hosted Configuration Version Content */}
        {(profileType === "flags" || sourceType === "hosted") && (
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-[#16191f]">
                  Initial configuration version (v1)
                </h2>
                <p className="text-[12px] text-[#545b64] mt-0.5">
                  AppConfig hosted profiles store versions directly. Provide the initial payload to create version 1.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[12px] text-[#545b64]">Content type:</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  disabled={profileType === "flags"}
                  className="px-2 py-1 text-[12px] border border-[#aab7b8] rounded bg-white disabled:opacity-50"
                >
                  <option value="application/json">application/json</option>
                  <option value="application/x-yaml">application/x-yaml</option>
                  <option value="text/plain">text/plain</option>
                </select>
              </div>
            </div>

            <textarea
              rows={12}
              value={initialContent}
              onChange={(e) => setInitialContent(e.target.value)}
              className="w-full p-3 font-mono text-[12px] bg-[#fafafa] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb] text-[#16191f]"
            />
          </div>
        )}

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
            disabled={loading || !name.trim()}
            className="px-5 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded disabled:opacity-40 flex items-center justify-center transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Creating..." : "Create configuration profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
