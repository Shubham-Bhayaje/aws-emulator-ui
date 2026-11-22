"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createEnvironmentAction } from "../../../../actions";

interface Props {
  application: {
    id: string;
    name: string;
  };
}

export default function CreateEnvironmentClient({ application }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [monitors, setMonitors] = useState<Array<{ alarmArn: string; alarmRoleArn?: string }>>([]);
  const [alarmArnInput, setAlarmArnInput] = useState("");
  const [alarmRoleArnInput, setAlarmRoleArnInput] = useState("");
  const [tags, setTags] = useState<{ key: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddMonitor = () => {
    if (!alarmArnInput.trim()) return;
    setMonitors([
      ...monitors,
      {
        alarmArn: alarmArnInput.trim(),
        alarmRoleArn: alarmRoleArnInput.trim() || undefined,
      },
    ]);
    setAlarmArnInput("");
    setAlarmRoleArnInput("");
  };

  const handleRemoveMonitor = (index: number) => {
    setMonitors(monitors.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    setTags([...tags, { key: "", value: "" }]);
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleTagChange = (index: number, field: "key" | "value", val: string) => {
    const updated = [...tags];
    updated[index][field] = val;
    setTags(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Environment name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    const tagRecord: Record<string, string> = {};
    for (const t of tags) {
      if (t.key.trim()) {
        tagRecord[t.key.trim()] = t.value.trim();
      }
    }

    const res = await createEnvironmentAction(
      application.id,
      name.trim(),
      description.trim() || undefined,
      monitors.length > 0 ? monitors : undefined,
      Object.keys(tagRecord).length > 0 ? tagRecord : undefined
    );

    setLoading(false);

    if (res.success && res.environment) {
      router.push(`/appconfig/applications/${application.id}/environments/${res.environment.id}`);
    } else {
      setError(res.error || "Failed to create environment.");
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
        <span className="text-[#16191f]">Create environment</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create environment</h1>
        <p className="text-[13px] text-[#545b64] mt-1">
          For each AWS AppConfig application, you define one or more environments. An environment is a logical deployment
          group of AWS AppConfig targets, such as applications in a Beta, Test, or Production environment.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#fdf2f2] border border-[#d13212] rounded text-[13px] text-[#d13212]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Environment details card */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">Environment details</h2>

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Name <span className="text-[#d13212]">*</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-1.5">
              Specify a name for the environment (e.g. production, beta, staging).
            </p>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. production"
              className="w-full max-w-md px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb] bg-white text-[#16191f]"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Description <span className="text-[12px] font-normal text-[#545b64]">- optional</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Live production customer environment"
              className="w-full max-w-lg px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb] bg-white text-[#16191f]"
            />
          </div>
        </div>

        {/* Monitors (CloudWatch Alarms) */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Monitors - optional</h2>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Amazon CloudWatch alarms monitor your application. If an alarm triggers during a deployment or bake time,
              AWS AppConfig can automatically roll back the deployment.
            </p>
          </div>

          {monitors.length > 0 && (
            <div className="border border-[#eaeded] rounded overflow-hidden">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase">
                  <tr>
                    <th className="py-2 px-3">Alarm ARN</th>
                    <th className="py-2 px-3">Alarm Role ARN</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {monitors.map((m, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-mono text-[12px] text-[#16191f]">{m.alarmArn}</td>
                      <td className="py-2 px-3 font-mono text-[12px] text-[#545b64]">{m.alarmRoleArn || "-"}</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveMonitor(idx)}
                          className="text-[#d13212] hover:underline text-[12px] font-medium"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[12px] font-medium text-[#16191f] mb-1">
                CloudWatch Alarm ARN
              </label>
              <input
                type="text"
                placeholder="arn:aws:cloudwatch:us-east-1:000000000000:alarm:HighErrorRate"
                value={alarmArnInput}
                onChange={(e) => setAlarmArnInput(e.target.value)}
                className="w-full px-3 py-1.5 text-[12px] font-mono border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#16191f] mb-1">
                Alarm Role ARN (optional)
              </label>
              <input
                type="text"
                placeholder="arn:aws:iam::000000000000:role/AppConfigCloudWatchRole"
                value={alarmRoleArnInput}
                onChange={(e) => setAlarmRoleArnInput(e.target.value)}
                className="w-full px-3 py-1.5 text-[12px] font-mono border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb]"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddMonitor}
            disabled={!alarmArnInput.trim()}
            className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa] disabled:opacity-40"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Add alarm monitor
          </button>
        </div>

        {/* Tags */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#16191f]">Tags - optional</h2>
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Add new tag
            </button>
          </div>

          {tags.length === 0 ? (
            <p className="text-[13px] text-[#545b64] italic">No tags added.</p>
          ) : (
            <div className="space-y-3">
              {tags.map((tag, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Key"
                    value={tag.key}
                    onChange={(e) => handleTagChange(idx, "key", e.target.value)}
                    className="w-48 px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb]"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={tag.value}
                    onChange={(e) => handleTagChange(idx, "value", e.target.value)}
                    className="w-48 px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="px-2.5 text-[13px] font-medium text-[#d13212] bg-white border border-[#aab7b8] rounded hover:bg-[#fdf2f2]"
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
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
            disabled={loading || !name.trim()}
            className="px-5 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded disabled:opacity-40 flex items-center justify-center transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Creating..." : "Create environment"}
          </button>
        </div>
      </form>
    </div>
  );
}
