"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TopicSummary,
  SqsQueueOption,
  LambdaFunctionOption,
} from "../../types";
import { createSubscriptionAction } from "../../actions";

interface CreateSubscriptionClientProps {
  topics: TopicSummary[];
  sqsQueues: SqsQueueOption[];
  lambdaFunctions: LambdaFunctionOption[];
}

export default function CreateSubscriptionClient({
  topics,
  sqsQueues,
  lambdaFunctions,
}: CreateSubscriptionClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTopicArn = searchParams.get("topicArn") || "";

  const [topicArn, setTopicArn] = useState(preselectedTopicArn || (topics[0]?.arn || ""));
  const [protocol, setProtocol] = useState<string>("sqs");
  const [endpoint, setEndpoint] = useState<string>("");
  const [rawMessageDelivery, setRawMessageDelivery] = useState(false);

  // Filter Policy
  const [enableFilterPolicy, setEnableFilterPolicy] = useState(false);
  const [filterPolicyScope, setFilterPolicyScope] = useState<"MessageAttributes" | "MessageBody">("MessageAttributes");
  const [filterPolicyJson, setFilterPolicyJson] = useState("");

  // Redrive Policy (DLQ)
  const [enableDlq, setEnableDlq] = useState(false);
  const [deadLetterTargetArn, setDeadLetterTargetArn] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleProtocolChange(newProtocol: string) {
    setProtocol(newProtocol);
    setEndpoint("");
    if (newProtocol === "sqs" && sqsQueues.length > 0) {
      setEndpoint(sqsQueues[0].arn);
    } else if (newProtocol === "lambda" && lambdaFunctions.length > 0) {
      setEndpoint(lambdaFunctions[0].functionArn);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!topicArn.trim()) {
      setError("Topic ARN is required.");
      return;
    }

    if (!endpoint.trim()) {
      setError("Endpoint is required.");
      return;
    }

    let filterPolicyStr: string | undefined = undefined;
    if (enableFilterPolicy && filterPolicyJson.trim()) {
      try {
        JSON.parse(filterPolicyJson);
        filterPolicyStr = filterPolicyJson.trim();
      } catch {
        setError("Invalid JSON format in Subscription filter policy.");
        return;
      }
    }

    setIsSubmitting(true);
    const res = await createSubscriptionAction({
      topicArn: topicArn.trim(),
      protocol,
      endpoint: endpoint.trim(),
      rawMessageDelivery: protocol === "sqs" || protocol === "http" || protocol === "https" ? rawMessageDelivery : undefined,
      filterPolicy: filterPolicyStr,
      filterPolicyScope: enableFilterPolicy ? filterPolicyScope : undefined,
      deadLetterTargetArn: enableDlq && deadLetterTargetArn.trim() ? deadLetterTargetArn.trim() : undefined,
    });
    setIsSubmitting(false);

    if (res.success) {
      router.push("/sns/subscriptions");
    } else {
      setError(res.error || "Failed to create subscription");
    }
  }

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-6">
      {/* Breadcrumbs */}
      <div className="text-[13px] text-[#545b64] flex items-center gap-2">
        <Link href="/sns" className="text-[#0073bb] hover:underline">
          Amazon SNS
        </Link>
        <span>/</span>
        <Link href="/sns/subscriptions" className="text-[#0073bb] hover:underline">
          Subscriptions
        </Link>
        <span>/</span>
        <span className="text-[#16191f] font-medium">Create subscription</span>
      </div>

      <div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create subscription</h1>
        <p className="text-[13px] text-[#545b64] mt-1">
          Specify the topic, communication protocol, and target endpoint to receive notifications.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded bg-[#fdf3f1] border border-[#d13212] text-[13px] text-[#d13212] flex items-start gap-2">
          <span className="font-bold">Error:</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Details */}
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-5 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Details
          </h2>

          {/* Topic ARN */}
          <div className="space-y-1">
            <label className="block text-[13px] font-bold text-[#16191f]">
              Topic ARN <span className="text-[#d13212]">*</span>
            </label>
            {topics.length > 0 ? (
              <select
                value={topicArn}
                onChange={(e) => setTopicArn(e.target.value)}
                className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
              >
                {topics.map((t) => (
                  <option key={t.arn} value={t.arn}>
                    {t.name} ({t.type}) - {t.arn}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="arn:aws:sns:us-east-1:000000000000:my-topic"
                value={topicArn}
                onChange={(e) => setTopicArn(e.target.value)}
                className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
              />
            )}
          </div>

          {/* Protocol */}
          <div className="space-y-1">
            <label className="block text-[13px] font-bold text-[#16191f]">
              Protocol <span className="text-[#d13212]">*</span>
            </label>
            <select
              value={protocol}
              onChange={(e) => handleProtocolChange(e.target.value)}
              className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
            >
              <option value="sqs">Amazon SQS</option>
              <option value="lambda">AWS Lambda</option>
              <option value="email">Email</option>
              <option value="email-json">Email-JSON</option>
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
              <option value="sms">SMS</option>
              <option value="firehose" disabled>
                Amazon Data Firehose (Available after Amazon Data Firehose is built)
              </option>
            </select>
          </div>

          {/* Endpoint */}
          <div className="space-y-1">
            <label className="block text-[13px] font-bold text-[#16191f]">
              Endpoint <span className="text-[#d13212]">*</span>
            </label>

            {protocol === "sqs" ? (
              sqsQueues.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                  >
                    <option value="">-- Select an SQS Queue --</option>
                    {sqsQueues.map((q) => (
                      <option key={q.url} value={q.arn}>
                        {q.name} ({q.isFifo ? "FIFO" : "Standard"}) - {q.arn}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[#545b64]">
                    Loaded live from Amazon SQS.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder="arn:aws:sqs:us-east-1:000000000000:my-queue"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                  />
                  <p className="text-[11px] text-[#545b64]">
                    No SQS queues found. Create one at{" "}
                    <Link href="/sqs/create" className="text-[#0073bb] underline">
                      SQS console
                    </Link>.
                  </p>
                </div>
              )
            ) : protocol === "lambda" ? (
              lambdaFunctions.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                  >
                    <option value="">-- Select a Lambda Function --</option>
                    {lambdaFunctions.map((f) => (
                      <option key={f.functionArn} value={f.functionArn}>
                        {f.functionName} ({f.runtime || "Custom"})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[#545b64]">
                    Loaded live from AWS Lambda.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder="arn:aws:lambda:us-east-1:000000000000:function:my-function"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                  />
                </div>
              )
            ) : (
              <input
                type={
                  protocol === "email" || protocol === "email-json"
                    ? "email"
                    : protocol === "http" || protocol === "https"
                    ? "url"
                    : "text"
                }
                placeholder={
                  protocol === "email" || protocol === "email-json"
                    ? "alerts@company.com"
                    : protocol === "http"
                    ? "http://api.company.com/events"
                    : protocol === "https"
                    ? "https://api.company.com/events"
                    : "+15551234567"
                }
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
              />
            )}
          </div>

          {/* Raw Message Delivery */}
          {(protocol === "sqs" || protocol === "http" || protocol === "https") && (
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#16191f]">
                <input
                  type="checkbox"
                  checked={rawMessageDelivery}
                  onChange={(e) => setRawMessageDelivery(e.target.checked)}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span className="font-bold">Enable raw message delivery</span>
              </label>
              <p className="text-[12px] text-[#545b64] ml-5 mt-0.5">
                Sends message bodies directly without SNS JSON metadata envelope.
              </p>
            </div>
          )}
        </div>

        {/* Section 2: Subscription filter policy */}
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">Subscription filter policy</h2>
            <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#16191f]">
              <input
                type="checkbox"
                checked={enableFilterPolicy}
                onChange={(e) => setEnableFilterPolicy(e.target.checked)}
                className="text-[#ec7211] focus:ring-[#ec7211]"
              />
              <span className="font-medium">Enable subscription filter policy</span>
            </label>
          </div>

          {enableFilterPolicy && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="block text-[13px] font-bold text-[#16191f]">
                  Filter policy scope
                </label>
                <div className="flex items-center gap-6 text-[13px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      value="MessageAttributes"
                      checked={filterPolicyScope === "MessageAttributes"}
                      onChange={() => setFilterPolicyScope("MessageAttributes")}
                      className="text-[#ec7211] focus:ring-[#ec7211]"
                    />
                    <span>Message attributes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      value="MessageBody"
                      checked={filterPolicyScope === "MessageBody"}
                      onChange={() => setFilterPolicyScope("MessageBody")}
                      className="text-[#ec7211] focus:ring-[#ec7211]"
                    />
                    <span>Message body</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[13px] font-bold text-[#16191f]">
                  JSON filter policy
                </label>
                <textarea
                  rows={6}
                  value={filterPolicyJson}
                  onChange={(e) => setFilterPolicyJson(e.target.value)}
                  placeholder='{"event_type": ["order_created", "order_paid"]}'
                  className="w-full font-mono text-[12px] p-3 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Redrive policy (Dead-letter queue) */}
        <div className="bg-white border border-[#eaeded] rounded p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">
              Redrive policy (dead-letter queue)
            </h2>
            <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#16191f]">
              <input
                type="checkbox"
                checked={enableDlq}
                onChange={(e) => setEnableDlq(e.target.checked)}
                className="text-[#ec7211] focus:ring-[#ec7211]"
              />
              <span className="font-medium">Enable dead-letter queue</span>
            </label>
          </div>

          {enableDlq && (
            <div className="space-y-2 pt-2">
              <label className="block text-[13px] font-bold text-[#16191f]">
                Dead-letter queue
              </label>
              {sqsQueues.length > 0 ? (
                <select
                  value={deadLetterTargetArn}
                  onChange={(e) => setDeadLetterTargetArn(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                >
                  <option value="">-- Select an SQS DLQ --</option>
                  {sqsQueues.map((q) => (
                    <option key={q.url} value={q.arn}>
                      {q.name} - {q.arn}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="arn:aws:sqs:us-east-1:000000000000:my-dlq"
                  value={deadLetterTargetArn}
                  onChange={(e) => setDeadLetterTargetArn(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                />
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/sns/subscriptions"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center px-4 border border-[#d5dbdb] rounded text-[13px] font-medium text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !topicArn.trim() || !endpoint.trim()}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center px-5 bg-[#ec7211] text-white rounded text-[13px] font-bold hover:bg-[#eb5f07] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Creating subscription..." : "Create subscription"}
          </button>
        </div>
      </form>
    </div>
  );
}
