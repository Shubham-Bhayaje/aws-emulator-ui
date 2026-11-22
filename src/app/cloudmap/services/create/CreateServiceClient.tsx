"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NamespaceItem, createServiceAction } from "../../actions";

interface Props {
  namespaces: NamespaceItem[];
  preselectedNamespaceId?: string;
}

export default function CreateServiceClient({
  namespaces,
  preselectedNamespaceId,
}: Props) {
  const router = useRouter();

  const [selectedNamespaceId, setSelectedNamespaceId] = useState<string>(
    preselectedNamespaceId || (namespaces[0]?.Id ?? "")
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // DNS Config
  const [routingPolicy, setRoutingPolicy] = useState<"MULTIVALUE" | "WEIGHTED">("MULTIVALUE");
  const [dnsRecordType, setDnsRecordType] = useState<"A" | "AAAA" | "SRV" | "CNAME">("A");
  const [ttl, setTtl] = useState<number>(60);

  // Health check
  const [healthCheckType, setHealthCheckType] = useState<"NONE" | "CUSTOM" | "ROUTE53">("NONE");
  const [failureThreshold, setFailureThreshold] = useState<number>(1);

  // Tags
  const [tags, setTags] = useState<{ key: string; value: string }[]>([]);

  // Submission
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedNamespace = namespaces.find((n) => n.Id === selectedNamespaceId);
  const isHttpNamespace = selectedNamespace?.Type === "HTTP";

  const addTag = () => {
    if (tags.length < 50) {
      setTags([...tags, { key: "", value: "" }]);
    }
  };

  const removeTag = (idx: number) => {
    setTags(tags.filter((_, i) => i !== idx));
  };

  const updateTag = (idx: number, field: "key" | "value", val: string) => {
    const updated = [...tags];
    updated[idx][field] = val;
    setTags(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNamespaceId) {
      setError("Please select a namespace.");
      return;
    }
    if (!name.trim()) {
      setError("Service name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    const tagMap: Record<string, string> = {};
    for (const t of tags) {
      if (t.key.trim()) {
        tagMap[t.key.trim()] = t.value.trim();
      }
    }

    try {
      const res = await createServiceAction({
        namespaceId: selectedNamespaceId,
        name: name.trim(),
        description: description.trim() || undefined,
        routingPolicy: !isHttpNamespace ? routingPolicy : undefined,
        dnsRecordType: !isHttpNamespace ? dnsRecordType : undefined,
        ttl: !isHttpNamespace ? ttl : undefined,
        healthCheckType: healthCheckType === "CUSTOM" ? "CUSTOM" : "NONE",
        failureThreshold: healthCheckType === "CUSTOM" ? failureThreshold : undefined,
        tags: Object.keys(tagMap).length > 0 ? tagMap : undefined,
      });

      if (res.success && res.serviceId) {
        router.push(`/cloudmap/services/${res.serviceId}`);
        router.refresh();
      } else if (res.success) {
        router.push("/cloudmap/services");
        router.refresh();
      } else {
        setError(res.error || "Failed to create service.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-[12px] text-[#545b64]">
        <Link href="/cloudmap" className="hover:underline">
          AWS Cloud Map
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <Link href="/cloudmap/services" className="hover:underline">
          Services
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">Create service</span>
      </div>

      {/* Header */}
      <div className="pb-2 border-b border-[#eaeded]">
        <h1 className="text-[24px] font-bold text-[#16191f]">Create service</h1>
        <p className="text-[14px] text-[#545b64] mt-1">
          A service acts as a registry for the instances of your application. You can define DNS routing and health checking settings.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-[13px] text-red-700">
          {error}
        </div>
      )}

      {namespaces.length === 0 ? (
        <div className="p-6 bg-white border border-[#d5dbdb] rounded text-center space-y-4">
          <p className="text-[14px] text-[#545b64]">
            No namespaces found. A service must be associated with a namespace.
          </p>
          <Link
            href="/cloudmap/namespaces/create"
            className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create a namespace first
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Service details */}
          <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-5">
            <h2 className="text-[16px] font-bold text-[#16191f]">Service details</h2>

            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                Namespace <span className="text-red-600">*</span>
              </label>
              <select
                value={selectedNamespaceId}
                onChange={(e) => setSelectedNamespaceId(e.target.value)}
                required
                className="w-full max-w-lg px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded bg-white text-[#16191f] focus:outline-none focus:border-[#ec7211]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              >
                {namespaces.map((ns) => (
                  <option key={ns.Id} value={ns.Id}>
                    {ns.Name} ({ns.Type === "HTTP" ? "HTTP" : ns.Type === "DNS_PRIVATE" ? "Private DNS" : "Public DNS"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                Service name <span className="text-red-600">*</span>
              </label>
              <p className="text-[12px] text-[#545b64] mb-2">
                Specify the name of the service, such as <code className="text-[#16191f] font-mono">myservice</code>.
                {!isHttpNamespace && selectedNamespace?.Name && (
                  <span>
                    {" "}The fully qualified domain name will be{" "}
                    <strong className="font-mono text-[#16191f]">{name ? `${name}.${selectedNamespace.Name}` : `[service].${selectedNamespace.Name}`}</strong>.
                  </span>
                )}
              </p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. backend-api"
                required
                className="w-full max-w-lg px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                Description <span className="text-[11px] font-normal text-[#545b64]">- optional</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Microservice handling backend requests"
                className="w-full max-w-lg px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              />
            </div>
          </div>

          {/* Section 2: DNS & Routing Configuration */}
          <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f]">Routing and DNS configuration</h2>

            {isHttpNamespace ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-[13px] text-blue-800">
                The selected namespace is an <strong>HTTP namespace</strong>. Instances registered in this service are discovered exclusively via the AWS Cloud Map <code className="font-mono text-xs">DiscoverInstances</code> API operation. Route 53 DNS records are not provisioned.
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                    Routing policy
                  </label>
                  <div className="space-y-2 pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="routingPolicy"
                        value="MULTIVALUE"
                        checked={routingPolicy === "MULTIVALUE"}
                        onChange={() => setRoutingPolicy("MULTIVALUE")}
                        className="mt-1 accent-[#ec7211]"
                      />
                      <div>
                        <span className="text-[13px] font-medium text-[#16191f]">Multivalue answer routing</span>
                        <p className="text-[12px] text-[#545b64]">
                          Route 53 returns values for up to eight healthy records selected randomly.
                        </p>
                      </div>
                    </label>
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="routingPolicy"
                        value="WEIGHTED"
                        checked={routingPolicy === "WEIGHTED"}
                        onChange={() => setRoutingPolicy("WEIGHTED")}
                        className="mt-1 accent-[#ec7211]"
                      />
                      <div>
                        <span className="text-[13px] font-medium text-[#16191f]">Weighted routing</span>
                        <p className="text-[12px] text-[#545b64]">
                          Route 53 routes traffic according to proportions that you specify.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                      Record type
                    </label>
                    <select
                      value={dnsRecordType}
                      onChange={(e) => setDnsRecordType(e.target.value as "A" | "AAAA" | "SRV" | "CNAME")}
                      className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded bg-white text-[#16191f] focus:outline-none focus:border-[#ec7211]"
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    >
                      <option value="A">A - Routes traffic to an IPv4 address</option>
                      <option value="AAAA">AAAA - Routes traffic to an IPv6 address</option>
                      <option value="SRV">SRV - Specifies host and port for services</option>
                      <option value="CNAME">CNAME - Canonical name record</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                      TTL (seconds)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={86400}
                      value={ttl}
                      onChange={(e) => setTtl(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Health Checking */}
          <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f]">Health checking options</h2>
            <p className="text-[12px] text-[#545b64]">
              Choose how the health of instances registered with this service is monitored and evaluated.
            </p>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="healthCheckType"
                  value="NONE"
                  checked={healthCheckType === "NONE"}
                  onChange={() => setHealthCheckType("NONE")}
                  className="mt-1 accent-[#ec7211]"
                />
                <div>
                  <span className="text-[13px] font-medium text-[#16191f]">No health check</span>
                  <p className="text-[12px] text-[#545b64]">
                    Instances registered with this service are always assumed healthy.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="healthCheckType"
                  value="CUSTOM"
                  checked={healthCheckType === "CUSTOM"}
                  onChange={() => setHealthCheckType("CUSTOM")}
                  className="mt-1 accent-[#ec7211]"
                />
                <div>
                  <span className="text-[13px] font-medium text-[#16191f]">Custom health check</span>
                  <p className="text-[12px] text-[#545b64]">
                    A custom third-party system or sidecar reports health status directly via the <code className="font-mono text-xs">UpdateInstanceCustomHealthStatus</code> API.
                  </p>
                </div>
              </label>

              {healthCheckType === "CUSTOM" && (
                <div className="ml-6 pl-4 border-l-2 border-[#d5dbdb] space-y-2">
                  <label className="block text-[13px] font-bold text-[#16191f]">
                    Failure threshold
                  </label>
                  <p className="text-[12px] text-[#545b64]">
                    The number of 30-second intervals that you want Route 53 to wait before it changes the health status.
                  </p>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={failureThreshold}
                    onChange={(e) => setFailureThreshold(Number(e.target.value))}
                    className="w-32 px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  />
                </div>
              )}

              {/* Disabled Route 53 health check option with message as per spec */}
              <div className="opacity-60 cursor-not-allowed">
                <label className="flex items-start gap-2.5 cursor-not-allowed">
                  <input
                    type="radio"
                    name="healthCheckType"
                    disabled
                    className="mt-1"
                  />
                  <div>
                    <span className="text-[13px] font-medium text-[#16191f]">
                      Route 53 health check
                    </span>
                    <span className="ml-2 text-[11px] font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      Available after Route 53 Health Checks is built
                    </span>
                    <p className="text-[12px] text-[#545b64] mt-0.5">
                      Route 53 evaluates the health of your endpoints by submitting requests to specified IP addresses or domain names.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 4: Tags */}
          <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-[#16191f]">Tags - optional</h2>
                <p className="text-[12px] text-[#545b64]">
                  Key-value pairs to organize, categorize, or track cost for your Cloud Map service.
                </p>
              </div>
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Add new tag
              </button>
            </div>

            {tags.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-12 gap-2 text-[12px] font-semibold text-[#545b64]">
                  <div className="col-span-5">Key</div>
                  <div className="col-span-6">Value</div>
                  <div className="col-span-1"></div>
                </div>
                {tags.map((tag, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <input
                        type="text"
                        placeholder="Key"
                        value={tag.key}
                        onChange={(e) => updateTag(idx, "key", e.target.value)}
                        className="w-full px-3 py-1 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                        style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                      />
                    </div>
                    <div className="col-span-6">
                      <input
                        type="text"
                        placeholder="Value"
                        value={tag.value}
                        onChange={(e) => updateTag(idx, "value", e.target.value)}
                        className="w-full px-3 py-1 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                        style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeTag(idx)}
                        className="text-[12px] text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/cloudmap/services"
              className="px-4 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] inline-flex items-center justify-center transition-colors"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm disabled:opacity-60"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              {loading ? "Creating..." : "Create service"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
