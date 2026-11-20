"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ServiceInfo } from "./types";

interface ServicesClientProps {
  initialServices: ServiceInfo[];
}

export default function ServicesClient({ initialServices }: ServicesClientProps) {
  const router = useRouter();
  const [services] = useState<ServiceInfo[]>(initialServices);
  const [search, setSearch] = useState("");

  const filtered = services.filter(
    (s) =>
      s.serviceName.toLowerCase().includes(search.toLowerCase()) ||
      s.serviceCode.toLowerCase().includes(search.toLowerCase())
  );

  const popularServices = [
    { code: "ec2", name: "EC2" },
    { code: "vpc", name: "VPC" },
    { code: "s3", name: "S3" },
    { code: "iam", name: "IAM" },
    { code: "lambda", name: "Lambda" },
    { code: "dynamodb", name: "DynamoDB" },
    { code: "kms", name: "KMS" },
    { code: "sqs", name: "SQS" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#16191f]">AWS services</h1>
          <p className="text-sm text-[#545b64] mt-1">
            View and manage quotas for AWS services. Select a service to view its applied quotas and request quota increases.
          </p>
        </div>
        <button
          onClick={() => router.refresh()}
          className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-3 rounded-[2px] transition-colors flex items-center justify-center self-start sm:self-auto"
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          title="Refresh"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
      </div>

      {/* Popular services quick jump */}
      <div className="bg-[#fafafa] border border-[#eaeded] rounded p-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-[#545b64]">Popular services:</span>
        {popularServices.map((pop) => (
          <Link
            key={pop.code}
            href={`/service-quotas/services/${pop.code}`}
            className="bg-white border border-[#d5dbdb] hover:border-[#0073bb] hover:text-[#0073bb] px-2.5 py-1 rounded text-[#16191f] font-medium transition-colors"
          >
            {pop.name}
          </Link>
        ))}
      </div>

      {/* Search and Table Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search services by name or code"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-[13px] px-3 py-1.5 pl-8 border border-[#aab7b8] rounded-[2px] focus:outline-none focus:border-[#0073bb]"
            />
            <svg
              className="absolute left-2.5 top-2.5 text-[#545b64]"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <div className="text-xs text-[#545b64]">
            Displaying {filtered.length} of {services.length} services
          </div>
        </div>

        {/* Services Table */}
        <div className="border border-[#eaeded] rounded overflow-x-auto">
          <table className="w-full text-left text-[13px] text-[#16191f]">
            <thead className="bg-[#fafafa] text-[#545b64] text-[11px] font-bold uppercase border-b border-[#eaeded]">
              <tr>
                <th className="p-3">Service Name</th>
                <th className="p-3">Service Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-8 text-center text-[#545b64]">
                    <p className="font-semibold text-sm text-[#16191f]">No services found</p>
                    <p className="text-xs mt-1">No AWS services matched your filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((service) => (
                  <tr key={service.serviceCode} className="hover:bg-[#f9f9f9] transition-colors">
                    <td className="p-3 font-medium">
                      <Link
                        href={`/service-quotas/services/${encodeURIComponent(service.serviceCode)}`}
                        className="text-[#0073bb] hover:underline"
                      >
                        {service.serviceName}
                      </Link>
                    </td>
                    <td className="p-3 font-mono text-xs text-[#545b64]">
                      {service.serviceCode}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
