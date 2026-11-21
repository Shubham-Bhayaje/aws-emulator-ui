/**
 * BuildASolutionWidget.tsx – Authentic AWS Console "Build a solution" widget.
 * Features:
 * - Direct solution launchers across EC2, S3, DynamoDB, SQS, SNS, and Glacier
 * - Cloudscape enterprise cards with category badges
 * - Strict 32px button height standard
 * - Kebab menu actions (Widget info, Remove widget)
 * - Zero emojis, authentic AWS vector icons.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { ServiceIcon } from "../AwsIcons";

interface BuildASolutionWidgetProps {
  onRemove?: () => void;
}

interface SolutionItem {
  id: string;
  title: string;
  serviceName: string;
  serviceId: string;
  category: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}

const SOLUTIONS: SolutionItem[] = [
  {
    id: "solution-vm",
    title: "Launch a virtual machine",
    serviceName: "Amazon EC2",
    serviceId: "ec2",
    category: "Compute",
    description: "Deploy scalable virtual server instances in minutes with Amazon Elastic Compute Cloud.",
    actionLabel: "Launch in EC2",
    actionHref: "/ec2",
  },
  {
    id: "solution-s3",
    title: "Create an object store",
    serviceName: "Amazon S3",
    serviceId: "s3",
    category: "Storage",
    description: "Store and retrieve any amount of data with high durability and granular access controls.",
    actionLabel: "Create bucket",
    actionHref: "/s3/create",
  },
  {
    id: "solution-dynamodb",
    title: "Set up a NoSQL database",
    serviceName: "Amazon DynamoDB",
    serviceId: "dynamodb",
    category: "Database",
    description: "Fast, flexible NoSQL database service for single-digit millisecond performance at scale.",
    actionLabel: "Create table",
    actionHref: "/dynamodb/tables/create",
  },
  {
    id: "solution-sqs",
    title: "Build a message queue",
    serviceName: "Amazon SQS",
    serviceId: "sqs",
    category: "Application Integration",
    description: "Decouple and scale microservices, distributed systems, and serverless applications.",
    actionLabel: "Create queue",
    actionHref: "/sqs/create",
  },
  {
    id: "solution-sns",
    title: "Publish event notifications",
    serviceName: "Amazon SNS",
    serviceId: "sns",
    category: "Application Integration",
    description: "High-throughput, push-based, many-to-many messaging and mobile notification pub/sub.",
    actionLabel: "Create topic",
    actionHref: "/sns/create-topic",
  },
  {
    id: "solution-glacier",
    title: "Archive long-term cold data",
    serviceName: "Amazon S3 Glacier",
    serviceId: "glacier",
    category: "Storage",
    description: "Secure, low-cost long-term cold data archiving with compliant vault locks and retrieval jobs.",
    actionLabel: "Create vault",
    actionHref: "/glacier/create",
  },
];

export default function BuildASolutionWidget({ onRemove }: BuildASolutionWidgetProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <div className="relative bg-white border border-[#d5dbdb] rounded-sm awsui-shadow flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#eaeded] bg-white">
        <div className="flex items-center gap-2">
          {/* Drag Handle Icon */}
          <div className="text-[#879596] cursor-grab active:cursor-grabbing p-0.5" title="Move widget">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="9" cy="6" r="1.5" fill="currentColor" />
              <circle cx="15" cy="6" r="1.5" fill="currentColor" />
              <circle cx="9" cy="12" r="1.5" fill="currentColor" />
              <circle cx="15" cy="12" r="1.5" fill="currentColor" />
              <circle cx="9" cy="18" r="1.5" fill="currentColor" />
              <circle cx="15" cy="18" r="1.5" fill="currentColor" />
            </svg>
          </div>

          <h2 className="text-[14px] font-bold text-[#16191f]">Build a solution</h2>
          <button
            onClick={() => setShowInfoModal(true)}
            className="text-[12px] text-[#0073bb] hover:text-[#ec7211] hover:underline cursor-pointer"
          >
            Info
          </button>
        </div>

        {/* Kebab Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-[#545b64] hover:text-[#16191f] rounded hover:bg-[#f2f3f3]"
            title="Widget actions"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="12" cy="19" r="1.8" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#d5dbdb] rounded shadow-lg py-1 z-30 text-[13px]">
              <button
                onClick={() => {
                  setShowInfoModal(true);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#f2f8fd] text-[#16191f]"
              >
                Widget info
              </button>
              {onRemove && (
                <button
                  onClick={() => {
                    onRemove();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#fdf3f1] text-[#d13212] border-t border-[#eaeded]"
                >
                  Remove widget
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Widget Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <p className="text-[13px] text-[#545b64] mb-3">
            Quick-start templates and hands-on guidance to launch preconfigured solutions across AWS compute, database, messaging, and storage services.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {SOLUTIONS.map((s) => (
              <div
                key={s.id}
                className="p-3 border border-[#eaeded] rounded bg-white hover:border-[#aab7b8] transition-colors flex flex-col justify-between space-y-2"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <ServiceIcon id={s.serviceId} shortName={s.serviceName} size={16} />
                      <span className="text-[12px] font-bold text-[#16191f] truncate">{s.serviceName}</span>
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#f2f3f3] text-[#545b64] border border-[#eaeded] shrink-0">
                      {s.category}
                    </span>
                  </div>
                  <h3 className="text-[13px] font-bold text-[#16191f] leading-snug">{s.title}</h3>
                  <p className="text-[12px] text-[#545b64] line-clamp-2 leading-relaxed">
                    {s.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#f2f3f3]">
                  <Link
                    href={s.actionHref}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="w-full inline-flex items-center justify-center font-bold text-[12px] px-3 rounded bg-white text-[#16191f] border border-[#545b64] hover:bg-[#f2f3f3] transition-colors"
                  >
                    {s.actionLabel}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-[#eaeded] flex items-center justify-between text-[12px] text-[#545b64]">
          <span>Need custom architectural guidance?</span>
          <Link href="/services" className="text-[#0073bb] hover:underline font-medium">
            Explore all AWS services &rarr;
          </Link>
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[450px] w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[16px] font-bold text-[#16191f]">About Build a Solution</h3>
              <button onClick={() => setShowInfoModal(false)} className="text-[#879596] hover:text-[#16191f]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="text-[13px] text-[#545b64] space-y-2 leading-relaxed">
              <p>
                The <strong>Build a solution</strong> widget helps developers and cloud architects quickly bootstrap
                applications, virtual infrastructure, databases, and event pipelines.
              </p>
              <p>
                Each action directly launches the corresponding creation wizard inside the console emulator.
              </p>
            </div>
            <div className="flex justify-end pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setShowInfoModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
