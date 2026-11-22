"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClientVpnDependencyData,
  createClientVpnEndpointAction,
} from "../../client-vpn-actions";

interface Props {
  dependencies: ClientVpnDependencyData;
}

export default function CreateClientVpnEndpointClient({ dependencies }: Props) {
  const router = useRouter();

  // Basic Details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientCidrBlock, setClientCidrBlock] = useState("10.200.0.0/22");

  // Server Auth
  const [serverCertificateArn, setServerCertificateArn] = useState(
    dependencies.certificates.length > 0 ? dependencies.certificates[0].CertificateArn : ""
  );

  // Auth Options
  const [useMutualAuth, setUseMutualAuth] = useState(true);
  const [clientCertificateArn, setClientCertificateArn] = useState(
    dependencies.certificates.length > 0 ? dependencies.certificates[0].CertificateArn : ""
  );

  const [useActiveDirectory, setUseActiveDirectory] = useState(false);
  const [directoryId, setDirectoryId] = useState(
    dependencies.directories.length > 0 ? dependencies.directories[0].DirectoryId : ""
  );

  // Connection Logging
  const [enableLogging, setEnableLogging] = useState(false);
  const [logGroup, setLogGroup] = useState(
    dependencies.logGroups.length > 0 ? dependencies.logGroups[0].logGroupName : ""
  );
  const [logStream, setLogStream] = useState("");

  // Optional Parameters
  const [dnsServers, setDnsServers] = useState("");
  const [transportProtocol, setTransportProtocol] = useState<"udp" | "tcp">("udp");
  const [vpnPort, setVpnPort] = useState<number>(443);
  const [splitTunnel, setSplitTunnel] = useState(false);
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState<number>(24);

  // VPC and Security Groups
  const [vpcId, setVpcId] = useState(
    dependencies.vpcs.length > 0 ? dependencies.vpcs[0].VpcId : ""
  );
  const [selectedSecurityGroupIds, setSelectedSecurityGroupIds] = useState<string[]>([]);

  // Tags
  const [tags, setTags] = useState<{ key: string; value: string }[]>([
    { key: "", value: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredSecurityGroups = dependencies.securityGroups.filter(
    (sg) => !vpcId || !sg.VpcId || sg.VpcId === vpcId
  );

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

  const toggleSecurityGroup = (sgId: string) => {
    if (selectedSecurityGroupIds.includes(sgId)) {
      setSelectedSecurityGroupIds(selectedSecurityGroupIds.filter((id) => id !== sgId));
    } else {
      setSelectedSecurityGroupIds([...selectedSecurityGroupIds, sgId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientCidrBlock.trim()) {
      setError("Please specify a valid Client IPv4 CIDR block.");
      return;
    }

    if (!serverCertificateArn) {
      setError("Server certificate ARN is required. Please provision or select a certificate in ACM.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parsedDns = dnsServers
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await createClientVpnEndpointAction({
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        clientCidrBlock: clientCidrBlock.trim(),
        serverCertificateArn,
        useMutualAuth,
        clientCertificateArn: useMutualAuth ? clientCertificateArn : undefined,
        useActiveDirectory,
        directoryId: useActiveDirectory ? directoryId : undefined,
        enableLogging,
        logGroup: enableLogging ? logGroup : undefined,
        logStream: enableLogging ? logStream : undefined,
        dnsServers: parsedDns.length > 0 ? parsedDns : undefined,
        transportProtocol,
        vpnPort,
        splitTunnel,
        sessionTimeoutHours,
        vpcId: vpcId || undefined,
        securityGroupIds: selectedSecurityGroupIds.length > 0 ? selectedSecurityGroupIds : undefined,
        tags: tags.filter((t) => t.key.trim()),
      });

      if (res.success && res.clientVpnEndpointId) {
        router.push(`/vpc/client-vpn-endpoints/${res.clientVpnEndpointId}`);
      } else {
        setError(res.error || "Failed to create client VPN endpoint");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[12px] text-[#545b64]">
        <Link href="/vpc/vpcs" className="hover:text-[#0073bb]">
          Virtual Private Cloud
        </Link>
        <span>&gt;</span>
        <Link href="/vpc/client-vpn-endpoints" className="hover:text-[#0073bb]">
          Client VPN endpoints
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-medium">Create client VPN endpoint</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create client VPN endpoint</h1>
        <p className="text-[13px] text-[#545b64] mt-0.5">
          Specify network settings, TLS certificates, and authentication rules to provision an OpenVPN-compatible AWS Client VPN endpoint.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#fdf2f2] border border-[#d13212] rounded text-[13px] text-[#d13212] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-gray-400 hover:text-gray-600 font-bold ml-4">
            x
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Endpoint Settings */}
        <div className="bg-white border border-[#eaeded] rounded-xl shadow-sm p-6 space-y-5">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">
            Client VPN endpoint settings
          </h2>

          {/* Name tag */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              Name tag <span className="text-[12px] text-gray-500 font-normal">- optional</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-2">
              Creates a tag with a key of &apos;Name&apos; and a value that you specify.
            </p>
            <input
              type="text"
              placeholder="my-client-vpn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px" }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              Description <span className="text-[12px] text-gray-500 font-normal">- optional</span>
            </label>
            <input
              type="text"
              placeholder="Corporate Client VPN for remote engineers"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px" }}
            />
          </div>

          {/* Client IPv4 CIDR */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              Client IPv4 CIDR <span className="text-red-500">*</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-2">
              The IPv4 address range from which client IP addresses are assigned. Must be between /12 and /22 CIDR block and cannot overlap with VPC CIDRs.
            </p>
            <input
              type="text"
              required
              placeholder="10.200.0.0/22"
              value={clientCidrBlock}
              onChange={(e) => setClientCidrBlock(e.target.value)}
              className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] font-mono"
              style={{ height: "32px" }}
            />
          </div>
        </div>

        {/* Section 2: Server Authentication */}
        <div className="bg-white border border-[#eaeded] rounded-xl shadow-sm p-6 space-y-5">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">
            Server authentication
          </h2>
          <p className="text-[12px] text-[#545b64]">
            Specify the TLS certificate used by the Client VPN endpoint to authenticate with connecting clients.
          </p>

          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              Server certificate ARN <span className="text-red-500">*</span>
            </label>
            {dependencies.certificates.length === 0 ? (
              <div className="p-3 border border-dashed border-gray-300 rounded bg-gray-50 text-[13px] text-gray-600 max-w-lg">
                No issued certificates found in AWS Certificate Manager.{" "}
                <Link href="/acm" className="text-[#0073bb] hover:underline font-medium">
                  Request or import a certificate in ACM
                </Link>{" "}
                first.
              </div>
            ) : (
              <select
                value={serverCertificateArn}
                onChange={(e) => setServerCertificateArn(e.target.value)}
                required
                className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] bg-white font-mono"
                style={{ height: "32px" }}
              >
                {dependencies.certificates.map((c) => (
                  <option key={c.CertificateArn} value={c.CertificateArn}>
                    {c.DomainName} ({c.CertificateArn.split("/").pop()})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Section 3: Authentication Options */}
        <div className="bg-white border border-[#eaeded] rounded-xl shadow-sm p-6 space-y-5">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">
            Authentication options
          </h2>
          <p className="text-[12px] text-[#545b64]">
            Choose client authentication methods. You can combine mutual certificate authentication with user-based authentication.
          </p>

          {/* Mutual Auth */}
          <div className="space-y-3 border-b pb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useMutualAuth}
                onChange={(e) => setUseMutualAuth(e.target.checked)}
                className="text-[#ec7211] focus:ring-[#ec7211]"
              />
              <span className="text-[13px] font-semibold text-[#16191f]">
                Use mutual authentication (Certificate-based)
              </span>
            </label>

            {useMutualAuth && (
              <div className="pl-6 space-y-2">
                <label className="block text-[12px] font-medium text-[#16191f]">
                  Client certificate ARN
                </label>
                <select
                  value={clientCertificateArn}
                  onChange={(e) => setClientCertificateArn(e.target.value)}
                  className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] bg-white font-mono"
                  style={{ height: "32px" }}
                >
                  {dependencies.certificates.map((c) => (
                    <option key={c.CertificateArn} value={c.CertificateArn}>
                      {c.DomainName} ({c.CertificateArn.split("/").pop()})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Active Directory Auth */}
          <div className="space-y-3 border-b pb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useActiveDirectory}
                onChange={(e) => setUseActiveDirectory(e.target.checked)}
                className="text-[#ec7211] focus:ring-[#ec7211]"
              />
              <span className="text-[13px] font-semibold text-[#16191f]">
                Use Active Directory authentication
              </span>
            </label>

            {useActiveDirectory && (
              <div className="pl-6 space-y-2">
                <label className="block text-[12px] font-medium text-[#16191f]">
                  Active Directory ID
                </label>
                {dependencies.directories.length === 0 ? (
                  <div className="p-3 border border-dashed border-gray-300 rounded bg-gray-50 text-[13px] text-gray-600 max-w-lg">
                    No directories found.{" "}
                    <Link href="/directory-service" className="text-[#0073bb] hover:underline font-medium">
                      Create an Active Directory in Directory Service
                    </Link>{" "}
                    first.
                  </div>
                ) : (
                  <select
                    value={directoryId}
                    onChange={(e) => setDirectoryId(e.target.value)}
                    className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] bg-white"
                    style={{ height: "32px" }}
                  >
                    {dependencies.directories.map((d) => (
                      <option key={d.DirectoryId} value={d.DirectoryId}>
                        {d.Name} ({d.DirectoryId})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* SAML SSO Auth */}
          <div className="opacity-60">
            <label className="flex items-center gap-2 cursor-not-allowed">
              <input type="checkbox" disabled />
              <span className="text-[13px] text-gray-700">
                Use single sign-on (SAML 2.0) authentication{" "}
                <span className="text-[11px] text-gray-500">(Available after IAM SAML provider is configured)</span>
              </span>
            </label>
          </div>
        </div>

        {/* Section 4: Connection Logging */}
        <div className="bg-white border border-[#eaeded] rounded-xl shadow-sm p-6 space-y-5">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">
            Connection logging
          </h2>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="logging"
                checked={!enableLogging}
                onChange={() => setEnableLogging(false)}
                className="text-[#ec7211] focus:ring-[#ec7211]"
              />
              <span className="text-[13px] text-[#16191f]">Do not log connection details</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="logging"
                checked={enableLogging}
                onChange={() => setEnableLogging(true)}
                className="text-[#ec7211] focus:ring-[#ec7211]"
              />
              <span className="text-[13px] text-[#16191f]">Log connection details to CloudWatch Logs</span>
            </label>

            {enableLogging && (
              <div className="pl-6 space-y-4 pt-2">
                <div>
                  <label className="block text-[12px] font-medium text-[#16191f] mb-1">
                    CloudWatch log group
                  </label>
                  {dependencies.logGroups.length === 0 ? (
                    <div className="p-3 border border-dashed border-gray-300 rounded bg-gray-50 text-[13px] text-gray-600 max-w-lg">
                      No log groups found.{" "}
                      <Link href="/cloudwatch-logs" className="text-[#0073bb] hover:underline font-medium">
                        Create a log group in CloudWatch Logs
                      </Link>{" "}
                      first.
                    </div>
                  ) : (
                    <select
                      value={logGroup}
                      onChange={(e) => setLogGroup(e.target.value)}
                      className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] bg-white font-mono"
                      style={{ height: "32px" }}
                    >
                      {dependencies.logGroups.map((lg) => (
                        <option key={lg.logGroupName} value={lg.logGroupName}>
                          {lg.logGroupName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#16191f] mb-1">
                    CloudWatch log stream <span className="text-[11px] text-gray-500">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="client-vpn-sessions"
                    value={logStream}
                    onChange={(e) => setLogStream(e.target.value)}
                    className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
                    style={{ height: "32px" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 5: Other Optional Parameters */}
        <div className="bg-white border border-[#eaeded] rounded-xl shadow-sm p-6 space-y-5">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">
            Other optional parameters
          </h2>

          {/* DNS Servers */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              DNS servers IPv4 <span className="text-[12px] text-gray-500 font-normal">- optional</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-2">
              Comma-separated list of up to 2 DNS server IP addresses.
            </p>
            <input
              type="text"
              placeholder="10.0.0.2, 8.8.8.8"
              value={dnsServers}
              onChange={(e) => setDnsServers(e.target.value)}
              className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] font-mono"
              style={{ height: "32px" }}
            />
          </div>

          {/* Transport Protocol */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-2">
              Transport protocol
            </label>
            <div className="flex items-center gap-6 text-[13px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="proto"
                  checked={transportProtocol === "udp"}
                  onChange={() => setTransportProtocol("udp")}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span>UDP (Recommended for higher throughput)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="proto"
                  checked={transportProtocol === "tcp"}
                  onChange={() => setTransportProtocol("tcp")}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span>TCP</span>
              </label>
            </div>
          </div>

          {/* VPN Port */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-2">
              VPN port
            </label>
            <div className="flex items-center gap-6 text-[13px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="port"
                  checked={vpnPort === 443}
                  onChange={() => setVpnPort(443)}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span>443 (Default)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="port"
                  checked={vpnPort === 1194}
                  onChange={() => setVpnPort(1194)}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span>1194</span>
              </label>
            </div>
          </div>

          {/* Split-tunnel */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={splitTunnel}
                onChange={(e) => setSplitTunnel(e.target.checked)}
                className="text-[#ec7211] focus:ring-[#ec7211]"
              />
              <span className="text-[13px] font-semibold text-[#16191f]">
                Enable split-tunnel
              </span>
            </label>
            <p className="text-[12px] text-[#545b64] pl-6 mt-0.5">
              When split-tunnel is enabled, only traffic destined for the Client VPN route table is sent over the VPN tunnel.
            </p>
          </div>

          {/* Session Timeout */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              Session timeout hours
            </label>
            <select
              value={sessionTimeoutHours}
              onChange={(e) => setSessionTimeoutHours(Number(e.target.value))}
              className="w-full max-w-xs border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] bg-white"
              style={{ height: "32px" }}
            >
              <option value={8}>8 hours</option>
              <option value={10}>10 hours</option>
              <option value={12}>12 hours</option>
              <option value={24}>24 hours</option>
            </select>
          </div>

          {/* VPC Association Target */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              VPC ID <span className="text-[12px] text-gray-500 font-normal">- optional</span>
            </label>
            <select
              value={vpcId}
              onChange={(e) => setVpcId(e.target.value)}
              className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] bg-white font-mono"
              style={{ height: "32px" }}
            >
              <option value="">No VPC associated</option>
              {dependencies.vpcs.map((v) => (
                <option key={v.VpcId} value={v.VpcId}>
                  {v.VpcId} {v.Name ? `(${v.Name})` : ""} [{v.CidrBlock}]
                </option>
              ))}
            </select>
          </div>

          {/* Security Groups */}
          {vpcId && (
            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-2">
                Security groups
              </label>
              {filteredSecurityGroups.length === 0 ? (
                <p className="text-[12px] text-gray-500">No security groups found for this VPC.</p>
              ) : (
                <div className="space-y-2 border border-gray-200 rounded p-3 max-h-48 overflow-y-auto bg-gray-50/50">
                  {filteredSecurityGroups.map((sg) => (
                    <label key={sg.GroupId} className="flex items-center gap-2 text-[13px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSecurityGroupIds.includes(sg.GroupId)}
                        onChange={() => toggleSecurityGroup(sg.GroupId)}
                        className="text-[#ec7211] focus:ring-[#ec7211]"
                      />
                      <span className="font-mono text-[12px] text-[#16191f]">{sg.GroupId}</span>
                      <span className="text-gray-600">({sg.GroupName || "default"})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 6: Tags */}
        <div className="bg-white border border-[#eaeded] rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">Tags</h2>
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 text-xs font-semibold text-[#0073bb] bg-white border border-[#0073bb] rounded hover:bg-blue-50 transition-colors shadow-sm"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Add tag
            </button>
          </div>
          <p className="text-[12px] text-[#545b64]">
            A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value.
          </p>

          <div className="space-y-3">
            {tags.map((t, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Key"
                  value={t.key}
                  onChange={(e) => handleTagChange(idx, "key", e.target.value)}
                  className="w-1/3 border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px" }}
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={t.value}
                  onChange={(e) => handleTagChange(idx, "value", e.target.value)}
                  className="w-1/3 border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px" }}
                />
                {tags.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="text-xs text-red-600 hover:underline font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/vpc/client-vpn-endpoints"
            className="px-4 text-xs font-semibold text-[#16191f] bg-white border border-[#d5dbdb] rounded hover:bg-gray-50 transition-colors flex items-center justify-center shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 text-xs font-semibold text-white rounded transition-colors shadow-sm ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#ec7211] hover:bg-[#eb5f07]"
            }`}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Creating..." : "Create client VPN endpoint"}
          </button>
        </div>
      </form>
    </div>
  );
}
