"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResolverDependenciesData, createResolverQueryLogConfigAction } from "../../resolver-actions";

interface Props {
  dependencies: ResolverDependenciesData;
}

export default function CreateResolverQueryLogConfigClient({ dependencies }: Props) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [destinationType, setDestinationType] = useState<"CW_LOGS" | "S3">("CW_LOGS");

  // Destination selections
  const [selectedLogGroupArn, setSelectedLogGroupArn] = useState(
    dependencies.logGroups.length > 0 ? (dependencies.logGroups[0].arn || `arn:aws:logs:us-east-1:000000000000:log-group:${dependencies.logGroups[0].logGroupName}`) : ""
  );
  const [customLogGroup, setCustomLogGroup] = useState("");

  const [selectedBucketName, setSelectedBucketName] = useState(
    dependencies.s3Buckets.length > 0 ? dependencies.s3Buckets[0].name : ""
  );
  const [customBucketArn, setCustomBucketArn] = useState("");

  // VPC Associations
  const [selectedVpcIds, setSelectedVpcIds] = useState<string[]>([]);

  // Tags
  const [tags, setTags] = useState<Array<{ key: string; value: string }>>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleVpc = (vpcId: string) => {
    if (selectedVpcIds.includes(vpcId)) {
      setSelectedVpcIds(selectedVpcIds.filter((id) => id !== vpcId));
    } else {
      setSelectedVpcIds([...selectedVpcIds, vpcId]);
    }
  };

  const handleAddTag = () => {
    setTags([...tags, { key: "", value: "" }]);
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleTagChange = (index: number, field: "key" | "value", val: string) => {
    const next = [...tags];
    next[index][field] = val;
    setTags(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Configuration name is required.");
      return;
    }

    let destinationArn = "";
    if (destinationType === "CW_LOGS") {
      destinationArn = customLogGroup.trim() || selectedLogGroupArn;
      if (!destinationArn) {
        setError("Please select or enter a CloudWatch Logs log group ARN.");
        return;
      }
    } else if (destinationType === "S3") {
      destinationArn = customBucketArn.trim() || (selectedBucketName ? `arn:aws:s3:::${selectedBucketName}` : "");
      if (!destinationArn) {
        setError("Please select or enter an Amazon S3 bucket ARN.");
        return;
      }
    }

    setLoading(true);

    const res = await createResolverQueryLogConfigAction({
      name: name.trim(),
      destinationArn: destinationArn.trim(),
      vpcIdsToAssociate: selectedVpcIds,
      tags: tags.filter((t) => t.key.trim().length > 0),
    });

    if (res.success && res.configId) {
      router.push(`/route53/resolver/query-logging/${res.configId}`);
      router.refresh();
    } else {
      setError(res.error || "Failed to create query logging configuration");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center text-xs text-gray-500 space-x-2">
        <Link href="/route53/resolver" className="hover:text-blue-600">
          Route 53 Resolver
        </Link>
        <span>&rsaquo;</span>
        <Link href="/route53/resolver/query-logging" className="hover:text-blue-600">
          Query logging configurations
        </Link>
        <span>&rsaquo;</span>
        <span className="text-gray-900 font-medium">Configure query logging</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configure query logging</h1>
        <p className="text-xs text-gray-500 mt-1">
          Specify a name and destination to store DNS query logs for your VPCs.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-xs">
          <p className="font-bold">Error configuring query logging</p>
          <p className="mt-0.5">{error}</p>
        </div>
      )}

      {/* Section 1: Configuration Name */}
      <div className="bg-white border border-gray-200 rounded shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
          Configuration details
        </h2>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-vpc-dns-query-logs"
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#ec7211]"
          />
          <p className="text-[11px] text-gray-500 mt-1">
            The name can contain up to 64 letters, numbers, hyphens, and underscores.
          </p>
        </div>
      </div>

      {/* Section 2: Destination */}
      <div className="bg-white border border-gray-200 rounded shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
          Destination for query logs
        </h2>

        <div className="space-y-4 text-xs">
          {/* CloudWatch Logs Option */}
          <label
            className={`flex items-start p-3.5 border rounded cursor-pointer transition-colors ${
              destinationType === "CW_LOGS"
                ? "border-[#ec7211] bg-orange-50/20"
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="destinationType"
              checked={destinationType === "CW_LOGS"}
              onChange={() => setDestinationType("CW_LOGS")}
              className="mt-0.5 h-3.5 w-3.5 text-[#ec7211] focus:ring-[#ec7211]"
            />
            <div className="ml-2.5 flex-1">
              <span className="font-bold text-gray-900 block">CloudWatch Logs log group</span>
              <span className="text-gray-500 mt-0.5 block">
                Send query logs to an existing or new Amazon CloudWatch Logs log group.
              </span>

              {destinationType === "CW_LOGS" && (
                <div className="mt-3 space-y-3 pt-3 border-t border-gray-200">
                  {dependencies.logGroups.length > 0 ? (
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">
                        Select an existing log group
                      </label>
                      <select
                        value={selectedLogGroupArn}
                        onChange={(e) => setSelectedLogGroupArn(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#ec7211]"
                      >
                        {dependencies.logGroups.map((lg) => {
                          const arn =
                            lg.arn || `arn:aws:logs:us-east-1:000000000000:log-group:${lg.logGroupName}`;
                          return (
                            <option key={lg.logGroupName} value={arn}>
                              {lg.logGroupName}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  ) : null}

                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">
                      Or specify CloudWatch Logs log group ARN
                    </label>
                    <input
                      type="text"
                      value={customLogGroup}
                      onChange={(e) => setCustomLogGroup(e.target.value)}
                      placeholder="arn:aws:logs:us-east-1:123456789012:log-group:/aws/route53/resolver-queries"
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#ec7211]"
                    />
                  </div>
                </div>
              )}
            </div>
          </label>

          {/* S3 Option */}
          <label
            className={`flex items-start p-3.5 border rounded cursor-pointer transition-colors ${
              destinationType === "S3"
                ? "border-[#ec7211] bg-orange-50/20"
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="destinationType"
              checked={destinationType === "S3"}
              onChange={() => setDestinationType("S3")}
              className="mt-0.5 h-3.5 w-3.5 text-[#ec7211] focus:ring-[#ec7211]"
            />
            <div className="ml-2.5 flex-1">
              <span className="font-bold text-gray-900 block">Amazon S3 bucket</span>
              <span className="text-gray-500 mt-0.5 block">
                Send query logs to an Amazon Simple Storage Service (Amazon S3) bucket.
              </span>

              {destinationType === "S3" && (
                <div className="mt-3 space-y-3 pt-3 border-t border-gray-200">
                  {dependencies.s3Buckets.length > 0 ? (
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">
                        Select an existing S3 bucket
                      </label>
                      <select
                        value={selectedBucketName}
                        onChange={(e) => setSelectedBucketName(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#ec7211]"
                      >
                        {dependencies.s3Buckets.map((b) => (
                          <option key={b.name} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">
                      Or specify S3 bucket ARN
                    </label>
                    <input
                      type="text"
                      value={customBucketArn}
                      onChange={(e) => setCustomBucketArn(e.target.value)}
                      placeholder="arn:aws:s3:::my-dns-query-logs-bucket"
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#ec7211]"
                    />
                  </div>
                </div>
              )}
            </div>
          </label>

          {/* Disabled Kinesis Data Firehose Option */}
          <div className="flex items-start p-3.5 border border-gray-200 rounded bg-gray-50 opacity-60 cursor-not-allowed">
            <input
              type="radio"
              disabled
              name="destinationTypeDisabled"
              className="mt-0.5 h-3.5 w-3.5 text-gray-400"
            />
            <div className="ml-2.5">
              <span className="font-bold text-gray-500 block">
                Amazon Data Firehose delivery stream
              </span>
              <span className="text-gray-400 mt-0.5 block">
                Available after Amazon Data Firehose is built
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: VPCs to Associate */}
      <div className="bg-white border border-gray-200 rounded shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">VPCs to associate - optional</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select VPCs whose DNS queries should be recorded by this query logging configuration.
            </p>
          </div>
          <span className="text-xs text-gray-500">{selectedVpcIds.length} VPC(s) selected</span>
        </div>

        {dependencies.vpcs.length === 0 ? (
          <p className="text-xs text-gray-500">No VPCs found in this Region.</p>
        ) : (
          <div className="border border-gray-200 rounded max-h-56 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fafafa] text-gray-600 border-b border-gray-200 font-medium sticky top-0">
                <tr>
                  <th className="py-2 px-3 w-8"></th>
                  <th className="py-2 px-3">VPC ID</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">IPv4 CIDR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dependencies.vpcs.map((vpc) => {
                  const isChecked = selectedVpcIds.includes(vpc.vpcId);
                  return (
                    <tr
                      key={vpc.vpcId}
                      onClick={() => handleToggleVpc(vpc.vpcId)}
                      className={`cursor-pointer ${isChecked ? "bg-orange-50/30" : "hover:bg-gray-50"}`}
                    >
                      <td className="py-2 px-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleVpc(vpc.vpcId)}
                          className="h-3.5 w-3.5 text-[#ec7211] focus:ring-[#ec7211] rounded border-gray-300"
                        />
                      </td>
                      <td className="py-2 px-3 font-mono text-gray-900 font-medium">{vpc.vpcId}</td>
                      <td className="py-2 px-3 text-gray-700">{vpc.name || "-"}</td>
                      <td className="py-2 px-3 font-mono text-gray-600">{vpc.cidrBlock || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 4: Tags */}
      <div className="bg-white border border-gray-200 rounded shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Tags - optional</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              A tag is a label that you assign to an AWS resource.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddTag}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded shadow-sm"
          >
            Add tag
          </button>
        </div>

        {tags.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No tags added.</p>
        ) : (
          <div className="space-y-2">
            {tags.map((t, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-xs">
                <input
                  type="text"
                  placeholder="Key"
                  value={t.key}
                  onChange={(e) => handleTagChange(idx, "key", e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#ec7211]"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={t.value}
                  onChange={(e) => handleTagChange(idx, "value", e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#ec7211]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTag(idx)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-2.5 border border-red-300 text-red-600 hover:bg-red-50 rounded text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        <Link
          href="/route53/resolver/query-logging"
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="inline-flex items-center px-4 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded shadow-sm"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="px-5 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-xs font-semibold rounded shadow-sm disabled:opacity-50"
        >
          {loading ? "Configuring..." : "Configure query logging"}
        </button>
      </div>
    </form>
  );
}
