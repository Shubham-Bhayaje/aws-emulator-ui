"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogGroupSummary,
  LogStreamSummary,
  MetricFilterSummary,
  SubscriptionFilterSummary,
  FilteredLogEventItem,
  KmsKeyOption,
  IamRoleOption,
  KinesisStreamOption,
  LambdaFunctionOption,
} from "../../types";
import {
  deleteLogGroupAction,
  putRetentionPolicyAction,
  deleteRetentionPolicyAction,
  listLogStreamsAction,
  createLogStreamAction,
  deleteLogStreamAction,
  filterLogEventsAction,
  putMetricFilterAction,
  deleteMetricFilterAction,
  putSubscriptionFilterAction,
  deleteSubscriptionFilterAction,
  tagResourceAction,
  untagResourceAction,
} from "../../actions";
import { formatBytes, formatRetention, formatLogDate } from "../../dateUtils";

interface LogGroupDetailClientProps {
  logGroup: LogGroupSummary;
  initialStreams: LogStreamSummary[];
  metricFilters: MetricFilterSummary[];
  subscriptionFilters: SubscriptionFilterSummary[];
  initialTags: Record<string, string>;
  kmsKeys: KmsKeyOption[];
  iamRoles: IamRoleOption[];
  kinesisStreams: KinesisStreamOption[];
  lambdaFunctions: LambdaFunctionOption[];
  initialError?: string;
}

const RETENTION_OPTIONS = [
  { value: 0, label: "Never expire" },
  { value: 1, label: "1 day (24 hours)" },
  { value: 3, label: "3 days" },
  { value: 5, label: "5 days" },
  { value: 7, label: "1 week (7 days)" },
  { value: 14, label: "2 weeks (14 days)" },
  { value: 30, label: "1 month (30 days)" },
  { value: 60, label: "2 months (60 days)" },
  { value: 90, label: "3 months (90 days)" },
  { value: 120, label: "4 months (120 days)" },
  { value: 150, label: "5 months (150 days)" },
  { value: 180, label: "6 months (180 days)" },
  { value: 365, label: "1 year (365 days)" },
  { value: 400, label: "13 months (400 days)" },
  { value: 545, label: "18 months (545 days)" },
  { value: 730, label: "2 years (730 days)" },
  { value: 1096, label: "3 years (1096 days)" },
  { value: 1827, label: "5 years (1827 days)" },
  { value: 2192, label: "6 years (2192 days)" },
  { value: 2557, label: "7 years (2557 days)" },
  { value: 2922, label: "8 years (2922 days)" },
  { value: 3288, label: "9 years (3288 days)" },
  { value: 3653, label: "10 years (3653 days)" },
];

export default function LogGroupDetailClient({
  logGroup,
  initialStreams,
  metricFilters: initialMetricFilters,
  subscriptionFilters: initialSubscriptionFilters,
  initialTags,
  kmsKeys,
  iamRoles,
  kinesisStreams,
  lambdaFunctions,
  initialError,
}: LogGroupDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "streams" | "search" | "metrics" | "subscriptions" | "tags"
  >("streams");

  const [streams, setStreams] = useState<LogStreamSummary[]>(initialStreams);
  const [selectedStreamNames, setSelectedStreamNames] = useState<string[]>([]);
  const [streamSearchQuery, setStreamSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(initialError || null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Header Dropdown & Modals
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [deleteGroupInput, setDeleteGroupInput] = useState("");
  const [isDeletingGroup, startDeleteGroupTransition] = useTransition();

  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [retentionDays, setRetentionDays] = useState(logGroup.retentionInDays || 0);
  const [isUpdatingRetention, startUpdateRetentionTransition] = useTransition();

  // Create Stream Modal
  const [showCreateStreamModal, setShowCreateStreamModal] = useState(false);
  const [newStreamName, setNewStreamName] = useState("");
  const [isCreatingStream, startCreateStreamTransition] = useTransition();

  // Delete Stream Modal
  const [showDeleteStreamModal, setShowDeleteStreamModal] = useState(false);
  const [isDeletingStream, startDeleteStreamTransition] = useTransition();

  // Search Log Group Tab State
  const [filterPattern, setFilterPattern] = useState("");
  const [filterTimeRange, setFilterTimeRange] = useState<"1h" | "3h" | "12h" | "1d" | "3d" | "1w" | "all">("1h");
  const [filterStreamName, setFilterStreamName] = useState<string>("ALL");
  const [filteredEvents, setFilteredEvents] = useState<FilteredLogEventItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [isFiltering, startFilterTransition] = useTransition();

  // Metric Filter Modal State
  const [showCreateMetricModal, setShowCreateMetricModal] = useState(false);
  const [mfFilterName, setMfFilterName] = useState("");
  const [mfPattern, setMfPattern] = useState("");
  const [mfMetricNamespace, setMfMetricNamespace] = useState("CustomApp/Logs");
  const [mfMetricName, setMfMetricName] = useState("ErrorCount");
  const [mfMetricValue, setMfMetricValue] = useState("1");
  const [mfDefaultValue, setMfDefaultValue] = useState<string>("");
  const [isCreatingMetricFilter, startCreateMetricTransition] = useTransition();

  // Subscription Filter Modal State
  const [showCreateSubModal, setShowCreateSubModal] = useState(false);
  const [subDestinationType, setSubDestinationType] = useState<"kinesis" | "lambda">("kinesis");
  const [subFilterName, setSubFilterName] = useState("");
  const [subPattern, setSubPattern] = useState("");
  const [subKinesisArn, setSubKinesisArn] = useState(kinesisStreams[0]?.streamArn || "");
  const [subLambdaArn, setSubLambdaArn] = useState(lambdaFunctions[0]?.functionArn || "");
  const [subRoleArn, setSubRoleArn] = useState(iamRoles[0]?.arn || "");
  const [isCreatingSubFilter, startCreateSubTransition] = useTransition();

  // Tags State
  const [tags, setTags] = useState<Record<string, string>>(initialTags);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [editableTags, setEditableTags] = useState<Array<{ key: string; value: string }>>([]);
  const [isUpdatingTags, startUpdateTagsTransition] = useTransition();

  // Filtered streams list
  const filteredStreams = streams.filter((s) =>
    s.logStreamName.toLowerCase().includes(streamSearchQuery.toLowerCase())
  );

  // Group Handlers
  function handleDeleteGroup() {
    if (deleteGroupInput.trim().toLowerCase() !== "delete") return;
    setError(null);
    startDeleteGroupTransition(async () => {
      const res = await deleteLogGroupAction(logGroup.logGroupName);
      if (res.success) {
        router.push("/cloudwatch/logs");
      } else {
        setError(res.error || "Failed to delete log group.");
        setShowDeleteGroupModal(false);
      }
    });
  }

  function handleSaveRetention() {
    setError(null);
    startUpdateRetentionTransition(async () => {
      const res =
        retentionDays === 0
          ? await deleteRetentionPolicyAction(logGroup.logGroupName)
          : await putRetentionPolicyAction(logGroup.logGroupName, retentionDays);

      if (res.success) {
        setShowRetentionModal(false);
        setSuccessBanner("Retention setting updated successfully.");
        router.refresh();
      } else {
        setError(res.error || "Failed to update retention setting.");
      }
    });
  }

  // Stream Handlers
  function handleCreateStream(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newStreamName.trim();
    if (!trimmed) return;
    setError(null);

    startCreateStreamTransition(async () => {
      const res = await createLogStreamAction(logGroup.logGroupName, trimmed);
      if (res.success) {
        setShowCreateStreamModal(false);
        setNewStreamName("");
        setSuccessBanner(`Created log stream '${trimmed}'.`);
        // Refresh streams
        const listRes = await listLogStreamsAction(logGroup.logGroupName);
        if (listRes.logStreams) setStreams(listRes.logStreams);
      } else {
        setError(res.error || "Failed to create log stream.");
      }
    });
  }

  function handleDeleteStreams() {
    if (selectedStreamNames.length === 0) return;
    setError(null);
    startDeleteStreamTransition(async () => {
      let failed = 0;
      let lastErr = "";

      for (const name of selectedStreamNames) {
        const res = await deleteLogStreamAction(logGroup.logGroupName, name);
        if (!res.success) {
          failed++;
          lastErr = res.error || "Failed to delete log stream.";
        }
      }

      if (failed === 0) {
        setSuccessBanner(`Deleted ${selectedStreamNames.length} log stream(s).`);
        setSelectedStreamNames([]);
        setShowDeleteStreamModal(false);
        const listRes = await listLogStreamsAction(logGroup.logGroupName);
        if (listRes.logStreams) setStreams(listRes.logStreams);
      } else {
        setError(`Failed to delete ${failed} log stream(s): ${lastErr}`);
        setShowDeleteStreamModal(false);
      }
    });
  }

  // Search Events Handler
  function handleSearchEvents(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);
    startFilterTransition(async () => {
      let startTime: number | undefined;
      const now = Date.now();
      if (filterTimeRange === "1h") startTime = now - 3600 * 1000;
      else if (filterTimeRange === "3h") startTime = now - 3 * 3600 * 1000;
      else if (filterTimeRange === "12h") startTime = now - 12 * 3600 * 1000;
      else if (filterTimeRange === "1d") startTime = now - 24 * 3600 * 1000;
      else if (filterTimeRange === "3d") startTime = now - 3 * 24 * 3600 * 1000;
      else if (filterTimeRange === "1w") startTime = now - 7 * 24 * 3600 * 1000;

      const res = await filterLogEventsAction(logGroup.logGroupName, {
        filterPattern: filterPattern.trim() || undefined,
        logStreamNames: filterStreamName !== "ALL" ? [filterStreamName] : undefined,
        startTime,
        limit: 100,
      });

      setHasSearched(true);
      if (res.error) {
        setError(res.error);
      } else {
        setFilteredEvents(res.events);
      }
    });
  }

  // Metric Filter Handlers
  function handleCreateMetricFilter(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startCreateMetricTransition(async () => {
      const res = await putMetricFilterAction({
        logGroupName: logGroup.logGroupName,
        filterName: mfFilterName.trim(),
        filterPattern: mfPattern.trim(),
        metricNamespace: mfMetricNamespace.trim(),
        metricName: mfMetricName.trim(),
        metricValue: mfMetricValue.trim() || "1",
        defaultValue: mfDefaultValue ? Number(mfDefaultValue) : undefined,
      });

      if (res.success) {
        setShowCreateMetricModal(false);
        setMfFilterName("");
        setMfPattern("");
        setSuccessBanner(`Metric filter '${mfFilterName.trim()}' created successfully.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to create metric filter.");
      }
    });
  }

  function handleDeleteMetricFilter(filterName: string) {
    setError(null);
    startCreateMetricTransition(async () => {
      const res = await deleteMetricFilterAction(logGroup.logGroupName, filterName);
      if (res.success) {
        setSuccessBanner(`Metric filter '${filterName}' deleted.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to delete metric filter.");
      }
    });
  }

  // Subscription Filter Handlers
  function handleCreateSubFilter(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const destArn = subDestinationType === "kinesis" ? subKinesisArn : subLambdaArn;
    if (!destArn) {
      setError("Please select a valid destination ARN.");
      return;
    }

    startCreateSubTransition(async () => {
      const res = await putSubscriptionFilterAction({
        logGroupName: logGroup.logGroupName,
        filterName: subFilterName.trim(),
        filterPattern: subPattern.trim(),
        destinationArn: destArn,
        roleArn: subDestinationType === "kinesis" && subRoleArn ? subRoleArn : undefined,
        distribution: "ByLogStream",
      });

      if (res.success) {
        setShowCreateSubModal(false);
        setSubFilterName("");
        setSubPattern("");
        setSuccessBanner(`Subscription filter '${subFilterName.trim()}' created.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to create subscription filter.");
      }
    });
  }

  function handleDeleteSubFilter(filterName: string) {
    setError(null);
    startCreateSubTransition(async () => {
      const res = await deleteSubscriptionFilterAction(logGroup.logGroupName, filterName);
      if (res.success) {
        setSuccessBanner(`Subscription filter '${filterName}' deleted.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to delete subscription filter.");
      }
    });
  }

  // Tags Handlers
  function openTagsModal() {
    const list = Object.entries(tags).map(([key, value]) => ({ key, value }));
    setEditableTags(list);
    setShowTagsModal(true);
  }

  function handleSaveTags() {
    setError(null);
    startUpdateTagsTransition(async () => {
      const arn = logGroup.logGroupArn || "";
      const existingKeys = Object.keys(tags);
      const newMap: Record<string, string> = {};

      for (const t of editableTags) {
        if (t.key.trim()) {
          newMap[t.key.trim()] = t.value.trim();
        }
      }

      const keysToRemove = existingKeys.filter((k) => !(k in newMap));

      if (keysToRemove.length > 0) {
        await untagResourceAction(arn, keysToRemove);
      }

      if (Object.keys(newMap).length > 0) {
        await tagResourceAction(arn, newMap);
      }

      setTags(newMap);
      setShowTagsModal(false);
      setSuccessBanner("Tags updated successfully.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {error && (
        <div className="bg-[#fdf2f2] border border-[#d13212] rounded p-3 text-[13px] text-[#d13212] flex items-start justify-between shadow-sm">
          <div>
            <span className="font-bold">Error: </span>
            {error}
          </div>
          <button
            onClick={() => setError(null)}
            className="text-[12px] font-bold text-[#545b64] hover:text-[#16191f] ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {successBanner && (
        <div className="bg-[#f2f8f4] border border-[#037f0c] rounded p-3 text-[13px] text-[#037f0c] flex items-start justify-between shadow-sm">
          <div>
            <span className="font-bold">Success: </span>
            {successBanner}
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-[12px] font-bold text-[#545b64] hover:text-[#16191f] ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Breadcrumbs & Header */}
      <div>
        <nav className="text-[12px] text-[#545b64] mb-2 flex items-center gap-1.5">
          <Link href="/cloudwatch" className="hover:underline text-[#0972d3]">
            CloudWatch
          </Link>
          <span>/</span>
          <Link href="/cloudwatch/logs" className="hover:underline text-[#0972d3]">
            Log groups
          </Link>
          <span>/</span>
          <span className="text-[#16191f] font-medium">{logGroup.logGroupName}</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold text-[#16191f] font-mono break-all">
              {logGroup.logGroupName}
            </h1>
            <div className="flex items-center gap-3 text-[12px] text-[#545b64] mt-1 font-mono">
              <span>{logGroup.logGroupArn}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-3 border border-[#545b64] rounded text-[13px] font-medium bg-white text-[#16191f] hover:bg-[#fafafa] inline-flex items-center gap-1.5 transition-colors"
              >
                Actions
                <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor">
                  <path d="M0 0.5L5 5.5L10 0.5H0Z" />
                </svg>
              </button>

              {showActionsDropdown && (
                <div
                  className="absolute right-0 mt-1 w-56 bg-white border border-[#eaeded] rounded shadow-lg z-20 py-1 text-[13px]"
                  onMouseLeave={() => setShowActionsDropdown(false)}
                >
                  <button
                    onClick={() => {
                      setShowActionsDropdown(false);
                      setShowRetentionModal(true);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#f2f3f3] text-[#16191f]"
                  >
                    Edit retention setting
                  </button>
                  <button
                    onClick={() => {
                      setShowActionsDropdown(false);
                      setActiveTab("search");
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#f2f3f3] text-[#16191f]"
                  >
                    Search log group
                  </button>
                  <div className="border-t border-[#eaeded] my-1" />
                  <button
                    onClick={() => {
                      setShowActionsDropdown(false);
                      setDeleteGroupInput("");
                      setShowDeleteGroupModal(true);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#fdf2f2] text-[#d13212]"
                  >
                    Delete log group
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowCreateStreamModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] rounded shadow-sm transition-colors inline-flex items-center justify-center"
            >
              Create log stream
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="bg-white border border-[#eaeded] rounded-lg p-5 shadow-sm">
        <h2 className="text-[14px] font-bold text-[#16191f] mb-3 border-b border-[#eaeded] pb-2">
          Log group details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-[13px]">
          <div>
            <div className="text-[#545b64] text-[12px]">Log class</div>
            <div className="font-semibold text-[#16191f] mt-1">
              {logGroup.logGroupClass === "INFREQUENT_ACCESS" ? "Infrequent Access" : "Standard"}
            </div>
          </div>

          <div>
            <div className="text-[#545b64] text-[12px]">Retention setting</div>
            <div className="font-semibold text-[#16191f] mt-1 flex items-center gap-2">
              <span>{formatRetention(logGroup.retentionInDays)}</span>
              <button
                onClick={() => setShowRetentionModal(true)}
                className="text-[12px] text-[#0972d3] hover:underline"
              >
                Edit
              </button>
            </div>
          </div>

          <div>
            <div className="text-[#545b64] text-[12px]">Stored bytes</div>
            <div className="font-semibold text-[#16191f] mt-1">
              {formatBytes(logGroup.storedBytes)}
            </div>
          </div>

          <div>
            <div className="text-[#545b64] text-[12px]">KMS key ID</div>
            <div className="font-semibold text-[#16191f] mt-1 font-mono text-[12px] truncate">
              {logGroup.kmsKeyId || "Default (AWS managed key)"}
            </div>
          </div>

          <div>
            <div className="text-[#545b64] text-[12px]">Creation time</div>
            <div className="font-semibold text-[#16191f] mt-1" suppressHydrationWarning>
              {logGroup.creationTime
                ? isMounted
                  ? new Date(logGroup.creationTime).toLocaleString()
                  : formatLogDate(logGroup.creationTime)
                : "-"}
            </div>
          </div>

          <div>
            <div className="text-[#545b64] text-[12px]">Metric filters</div>
            <div className="font-semibold text-[#16191f] mt-1">
              {initialMetricFilters.length}
            </div>
          </div>

          <div>
            <div className="text-[#545b64] text-[12px]">Subscription filters</div>
            <div className="font-semibold text-[#16191f] mt-1">
              {initialSubscriptionFilters.length}
            </div>
          </div>

          <div>
            <div className="text-[#545b64] text-[12px]">Data protection</div>
            <div className="font-semibold text-[#16191f] mt-1">
              {logGroup.dataProtectionStatus || "Disabled"}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-[#eaeded] flex gap-6 text-[13px] font-medium select-none">
        <button
          onClick={() => setActiveTab("streams")}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === "streams"
              ? "border-[#ec7211] text-[#ec7211] font-bold"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Log streams ({streams.length})
        </button>

        <button
          onClick={() => {
            setActiveTab("search");
            if (!hasSearched) handleSearchEvents();
          }}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === "search"
              ? "border-[#ec7211] text-[#ec7211] font-bold"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Search log group
        </button>

        <button
          onClick={() => setActiveTab("metrics")}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === "metrics"
              ? "border-[#ec7211] text-[#ec7211] font-bold"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Metric filters ({initialMetricFilters.length})
        </button>

        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === "subscriptions"
              ? "border-[#ec7211] text-[#ec7211] font-bold"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Subscription filters ({initialSubscriptionFilters.length})
        </button>

        <button
          onClick={() => setActiveTab("tags")}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === "tags"
              ? "border-[#ec7211] text-[#ec7211] font-bold"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Tags ({Object.keys(tags).length})
        </button>
      </div>

      {/* Tab 1: Log Streams */}
      {activeTab === "streams" && (
        <div className="bg-white border border-[#eaeded] rounded-lg shadow-sm">
          <div className="p-4 border-b border-[#eaeded] flex items-center justify-between gap-4">
            <div className="max-w-md w-full relative">
              <input
                type="text"
                placeholder="Search log streams by prefix"
                value={streamSearchQuery}
                onChange={(e) => setStreamSearchQuery(e.target.value)}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] placeholder-[#879596] focus:outline-none focus:border-[#ec7211]"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteStreamModal(true)}
                disabled={selectedStreamNames.length === 0}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`px-3 border rounded text-[13px] font-medium transition-colors ${
                  selectedStreamNames.length === 0
                    ? "bg-[#f2f3f3] text-[#aab7b8] border-[#eaeded] cursor-not-allowed"
                    : "bg-white text-[#d13212] border-[#d13212] hover:bg-[#fdf2f2]"
                }`}
              >
                Delete log stream(s)
              </button>

              <button
                onClick={() => setShowCreateStreamModal(true)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] rounded shadow-sm transition-colors"
              >
                Create log stream
              </button>
            </div>
          </div>

          {filteredStreams.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="text-[16px] font-bold text-[#16191f]">No log streams found</div>
              <p className="text-[13px] text-[#545b64] max-w-md mx-auto">
                {streamSearchQuery
                  ? `No log streams match "${streamSearchQuery}".`
                  : "Log streams are sequences of log events from the same source. Create a log stream to begin ingesting events."}
              </p>
              {!streamSearchQuery && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowCreateStreamModal(true)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] rounded shadow-sm"
                  >
                    Create log stream
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] text-[#16191f]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[12px] font-bold text-[#545b64]">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={
                          filteredStreams.length > 0 &&
                          selectedStreamNames.length === filteredStreams.length
                        }
                        onChange={() => {
                          if (selectedStreamNames.length === filteredStreams.length) {
                            setSelectedStreamNames([]);
                          } else {
                            setSelectedStreamNames(filteredStreams.map((s) => s.logStreamName));
                          }
                        }}
                        className="rounded border-[#aab7b8] text-[#ec7211] focus:ring-0"
                      />
                    </th>
                    <th className="px-4 py-3">Log stream name</th>
                    <th className="px-4 py-3">Last event time</th>
                    <th className="px-4 py-3">Creation time</th>
                    <th className="px-4 py-3">Stored bytes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {filteredStreams.map((st) => {
                    const isChecked = selectedStreamNames.includes(st.logStreamName);
                    return (
                      <tr
                        key={st.logStreamName}
                        className={`hover:bg-[#f2f8fd] transition-colors ${
                          isChecked ? "bg-[#f2f8fd]" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (selectedStreamNames.includes(st.logStreamName)) {
                                setSelectedStreamNames(
                                  selectedStreamNames.filter((n) => n !== st.logStreamName)
                                );
                              } else {
                                setSelectedStreamNames([...selectedStreamNames, st.logStreamName]);
                              }
                            }}
                            className="rounded border-[#aab7b8] text-[#ec7211] focus:ring-0"
                          />
                        </td>
                        <td className="px-4 py-3 font-semibold font-mono">
                          <Link
                            href={`/cloudwatch/logs/stream?group=${encodeURIComponent(
                              logGroup.logGroupName
                            )}&stream=${encodeURIComponent(st.logStreamName)}`}
                            className="text-[#0972d3] hover:underline"
                          >
                            {st.logStreamName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-[#545b64]" suppressHydrationWarning>
                          {st.lastEventTimestamp
                            ? isMounted
                              ? new Date(st.lastEventTimestamp).toLocaleString()
                              : formatLogDate(st.lastEventTimestamp)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-[#545b64]" suppressHydrationWarning>
                          {st.creationTime
                            ? isMounted
                              ? new Date(st.creationTime).toLocaleString()
                              : formatLogDate(st.creationTime)
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-[#545b64]">
                          {formatBytes(st.storedBytes)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Search Log Group (Event Filter) */}
      {activeTab === "search" && (
        <div className="space-y-4">
          <form
            onSubmit={handleSearchEvents}
            className="bg-white border border-[#eaeded] rounded-lg p-4 shadow-sm space-y-3"
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[280px]">
                <input
                  type="text"
                  placeholder='Filter events (e.g. "[ERROR]", "timeout", or JSON "{ $.status = 500 }")'
                  value={filterPattern}
                  onChange={(e) => setFilterPattern(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211]"
                />
              </div>

              <select
                value={filterStreamName}
                onChange={(e) => setFilterStreamName(e.target.value)}
                className="border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] bg-white focus:outline-none focus:border-[#ec7211]"
              >
                <option value="ALL">All log streams</option>
                {streams.map((s) => (
                  <option key={s.logStreamName} value={s.logStreamName}>
                    {s.logStreamName}
                  </option>
                ))}
              </select>

              <select
                value={filterTimeRange}
                onChange={(e) => setFilterTimeRange(e.target.value as any)}
                className="border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] bg-white focus:outline-none focus:border-[#ec7211]"
              >
                <option value="1h">Last 1 hour</option>
                <option value="3h">Last 3 hours</option>
                <option value="12h">Last 12 hours</option>
                <option value="1d">Last 1 day</option>
                <option value="3d">Last 3 days</option>
                <option value="1w">Last 1 week</option>
                <option value="all">All time</option>
              </select>

              <button
                type="submit"
                disabled={isFiltering}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] rounded shadow-sm disabled:opacity-50"
              >
                {isFiltering ? "Searching..." : "Search"}
              </button>
            </div>
          </form>

          {/* Results Table */}
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-sm">
            <div className="p-3 border-b border-[#eaeded] bg-[#fafafa] flex items-center justify-between text-[12px] text-[#545b64]">
              <span>
                Showing {filteredEvents.length} log event{filteredEvents.length === 1 ? "" : "s"}
              </span>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="p-12 text-center text-[#545b64] text-[13px]">
                {hasSearched
                  ? "No log events found matching the filter criteria."
                  : "Click Search to query log events across streams."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px] font-mono">
                  <thead className="bg-[#f2f3f3] text-[#545b64] border-b border-[#eaeded]">
                    <tr>
                      <th className="px-4 py-2 w-48">Timestamp (UTC)</th>
                      <th className="px-4 py-2 w-48">Log stream</th>
                      <th className="px-4 py-2">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeded]">
                    {filteredEvents.map((ev, i) => {
                      const id = ev.eventId || `ev-${i}`;
                      const isExpanded = expandedEventId === id;
                      return (
                        <tr
                          key={id}
                          onClick={() => setExpandedEventId(isExpanded ? null : id)}
                          className={`hover:bg-[#f2f8fd] cursor-pointer transition-colors ${
                            isExpanded ? "bg-[#fffaf5]" : ""
                          }`}
                        >
                          <td className="px-4 py-2 text-[#545b64] align-top whitespace-nowrap">
                            {formatLogDate(ev.timestamp)}
                          </td>
                          <td className="px-4 py-2 text-[#0972d3] align-top whitespace-nowrap truncate max-w-[200px]">
                            {ev.logStreamName || "-"}
                          </td>
                          <td className="px-4 py-2 text-[#16191f] align-top break-all">
                            <div>{ev.message}</div>
                            {isExpanded && (
                              <div className="mt-2 pt-2 border-t border-[#eaeded] text-[11px] text-[#545b64] space-y-1 bg-white p-2 rounded">
                                <div>
                                  <span className="font-bold">Event ID: </span>
                                  {ev.eventId || "N/A"}
                                </div>
                                <div>
                                  <span className="font-bold">Ingestion time: </span>
                                  {ev.ingestionTime ? formatLogDate(ev.ingestionTime) : "N/A"}
                                </div>
                              </div>
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

      {/* Tab 3: Metric Filters */}
      {activeTab === "metrics" && (
        <div className="bg-white border border-[#eaeded] rounded-lg shadow-sm">
          <div className="p-4 border-b border-[#eaeded] flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-[#16191f]">Metric filters</h3>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                Metric filters turn log patterns into CloudWatch metrics that you can graph or set alarms on.
              </p>
            </div>
            <button
              onClick={() => setShowCreateMetricModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] rounded shadow-sm"
            >
              Create metric filter
            </button>
          </div>

          {initialMetricFilters.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="text-[16px] font-bold text-[#16191f]">No metric filters</div>
              <p className="text-[13px] text-[#545b64] max-w-md mx-auto">
                No metric filters have been created for this log group. Create a filter to count errors or measure latencies.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] text-[#16191f]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[12px] font-bold text-[#545b64]">
                  <tr>
                    <th className="px-4 py-3">Filter name</th>
                    <th className="px-4 py-3">Pattern</th>
                    <th className="px-4 py-3">Metric namespace</th>
                    <th className="px-4 py-3">Metric name</th>
                    <th className="px-4 py-3">Metric value</th>
                    <th className="px-4 py-3">Default value</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {initialMetricFilters.map((mf) => (
                    <tr key={mf.filterName} className="hover:bg-[#fafafa]">
                      <td className="px-4 py-3 font-semibold">{mf.filterName}</td>
                      <td className="px-4 py-3 font-mono text-[12px]">{mf.filterPattern || "(All events)"}</td>
                      <td className="px-4 py-3 text-[#545b64]">
                        {mf.metricTransformations[0]?.metricNamespace || "-"}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {mf.metricTransformations[0]?.metricName || "-"}
                      </td>
                      <td className="px-4 py-3 text-[#545b64]">
                        {mf.metricTransformations[0]?.metricValue || "1"}
                      </td>
                      <td className="px-4 py-3 text-[#545b64]">
                        {mf.metricTransformations[0]?.defaultValue ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteMetricFilter(mf.filterName)}
                          className="text-[12px] text-[#d13212] hover:underline font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Subscription Filters */}
      {activeTab === "subscriptions" && (
        <div className="bg-white border border-[#eaeded] rounded-lg shadow-sm">
          <div className="p-4 border-b border-[#eaeded] flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-[#16191f]">Subscription filters</h3>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                Subscription filters stream log events in real time to Amazon Kinesis, AWS Lambda, or other destinations.
              </p>
            </div>
            <button
              onClick={() => setShowCreateSubModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] rounded shadow-sm"
            >
              Create subscription filter
            </button>
          </div>

          {initialSubscriptionFilters.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="text-[16px] font-bold text-[#16191f]">No subscription filters</div>
              <p className="text-[13px] text-[#545b64] max-w-md mx-auto">
                No subscription filters configured. Stream events into Amazon Kinesis Data Streams for analytics or AWS Lambda for event processing.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] text-[#16191f]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[12px] font-bold text-[#545b64]">
                  <tr>
                    <th className="px-4 py-3">Filter name</th>
                    <th className="px-4 py-3">Pattern</th>
                    <th className="px-4 py-3">Destination ARN</th>
                    <th className="px-4 py-3">Role ARN</th>
                    <th className="px-4 py-3">Distribution</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {initialSubscriptionFilters.map((sf) => (
                    <tr key={sf.filterName} className="hover:bg-[#fafafa]">
                      <td className="px-4 py-3 font-semibold">{sf.filterName}</td>
                      <td className="px-4 py-3 font-mono text-[12px]">{sf.filterPattern || "(All)"}</td>
                      <td className="px-4 py-3 font-mono text-[11px] truncate max-w-xs">{sf.destinationArn}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#545b64] truncate max-w-xs">
                        {sf.roleArn || "—"}
                      </td>
                      <td className="px-4 py-3 text-[#545b64]">{sf.distribution || "ByLogStream"}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteSubFilter(sf.filterName)}
                          className="text-[12px] text-[#d13212] hover:underline font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded-lg shadow-sm">
          <div className="p-4 border-b border-[#eaeded] flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-[#16191f]">Tags</h3>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                Key-value pairs associated with this CloudWatch Logs log group.
              </p>
            </div>
            <button
              onClick={openTagsModal}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] rounded shadow-sm"
            >
              Manage tags
            </button>
          </div>

          {Object.keys(tags).length === 0 ? (
            <div className="p-12 text-center text-[#545b64] text-[13px]">
              No tags associated with this log group.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] text-[#16191f]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[12px] font-bold text-[#545b64]">
                  <tr>
                    <th className="px-4 py-3">Key</th>
                    <th className="px-4 py-3">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {Object.entries(tags).map(([k, v]) => (
                    <tr key={k} className="hover:bg-[#fafafa]">
                      <td className="px-4 py-3 font-semibold">{k}</td>
                      <td className="px-4 py-3 text-[#545b64]">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Log Stream Modal */}
      {showCreateStreamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Create log stream</h2>
            <p className="text-[13px] text-[#545b64]">
              A log stream is a sequence of log events that belong to the same resource.
            </p>
            <form onSubmit={handleCreateStream} className="space-y-4 text-[13px]">
              <div>
                <label className="block font-bold text-[#16191f] mb-1">
                  Log stream name <span className="text-[#d13212]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="2026/11/21/[$LATEST]instance-1"
                  value={newStreamName}
                  onChange={(e) => setNewStreamName(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 font-mono text-[13px] focus:outline-none focus:border-[#ec7211]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowCreateStreamModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 border border-[#545b64] rounded text-[#16191f] hover:bg-[#fafafa]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingStream}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold rounded shadow-sm disabled:opacity-50"
                >
                  {isCreatingStream ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Stream Modal */}
      {showDeleteStreamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">
              Delete {selectedStreamNames.length} log stream(s)?
            </h2>
            <p className="text-[13px] text-[#545b64]">
              Deleting a log stream permanently removes all events stored in that stream.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowDeleteStreamModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-[#545b64] rounded text-[13px] text-[#16191f] hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStreams}
                disabled={isDeletingStream}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 bg-[#d13212] hover:bg-[#a82a0f] text-white font-bold text-[13px] rounded shadow-sm disabled:opacity-50"
              >
                {isDeletingStream ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Metric Filter Modal */}
      {showCreateMetricModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Create metric filter</h2>
            <form onSubmit={handleCreateMetricFilter} className="space-y-4 text-[13px]">
              <div>
                <label className="block font-bold text-[#16191f] mb-1">Filter pattern</label>
                <input
                  type="text"
                  placeholder='[ERROR] or [ip, user, username, timestamp, status = 500]'
                  value={mfPattern}
                  onChange={(e) => setMfPattern(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 font-mono text-[13px]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#16191f] mb-1">
                  Filter name <span className="text-[#d13212]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Http500Errors"
                  value={mfFilterName}
                  onChange={(e) => setMfFilterName(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#16191f] mb-1">
                    Metric namespace <span className="text-[#d13212]">*</span>
                  </label>
                  <input
                    type="text"
                    value={mfMetricNamespace}
                    onChange={(e) => setMfMetricNamespace(e.target.value)}
                    className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#16191f] mb-1">
                    Metric name <span className="text-[#d13212]">*</span>
                  </label>
                  <input
                    type="text"
                    value={mfMetricName}
                    onChange={(e) => setMfMetricName(e.target.value)}
                    className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#16191f] mb-1">Metric value</label>
                  <input
                    type="text"
                    value={mfMetricValue}
                    onChange={(e) => setMfMetricValue(e.target.value)}
                    className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#16191f] mb-1">Default value (optional)</label>
                  <input
                    type="number"
                    value={mfDefaultValue}
                    onChange={(e) => setMfDefaultValue(e.target.value)}
                    placeholder="0"
                    className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowCreateMetricModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 border border-[#545b64] rounded text-[#16191f] hover:bg-[#fafafa]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingMetricFilter}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold rounded shadow-sm disabled:opacity-50"
                >
                  {isCreatingMetricFilter ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Subscription Filter Modal */}
      {showCreateSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Create subscription filter</h2>
            <form onSubmit={handleCreateSubFilter} className="space-y-4 text-[13px]">
              <div>
                <label className="block font-bold text-[#16191f] mb-1">Destination service</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <label
                    className={`border rounded p-3 cursor-pointer flex flex-col justify-between ${
                      subDestinationType === "kinesis"
                        ? "border-[#ec7211] bg-[#fffaf5]"
                        : "border-[#eaeded] hover:bg-[#fafafa]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="destType"
                        value="kinesis"
                        checked={subDestinationType === "kinesis"}
                        onChange={() => setSubDestinationType("kinesis")}
                        className="text-[#ec7211] focus:ring-0"
                      />
                      <span className="font-bold text-[#16191f]">Amazon Kinesis</span>
                    </div>
                    <span className="text-[11px] text-[#545b64] mt-1">
                      Stream into real-time Kinesis Data Streams.
                    </span>
                  </label>

                  <label
                    className={`border rounded p-3 cursor-pointer flex flex-col justify-between ${
                      subDestinationType === "lambda"
                        ? "border-[#ec7211] bg-[#fffaf5]"
                        : "border-[#eaeded] hover:bg-[#fafafa]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="destType"
                        value="lambda"
                        checked={subDestinationType === "lambda"}
                        onChange={() => setSubDestinationType("lambda")}
                        className="text-[#ec7211] focus:ring-0"
                      />
                      <span className="font-bold text-[#16191f]">AWS Lambda</span>
                    </div>
                    <span className="text-[11px] text-[#545b64] mt-1">
                      Trigger serverless functions on log event batches.
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#16191f] mb-1">
                  Filter name <span className="text-[#d13212]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="KinesisStreamForwarder"
                  value={subFilterName}
                  onChange={(e) => setSubFilterName(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#16191f] mb-1">Filter pattern (optional)</label>
                <input
                  type="text"
                  placeholder='Leave empty to stream all events, or filter e.g. "[ERROR]"'
                  value={subPattern}
                  onChange={(e) => setSubPattern(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 font-mono text-[13px]"
                />
              </div>

              {subDestinationType === "kinesis" ? (
                <>
                  <div>
                    <label className="block font-bold text-[#16191f] mb-1">
                      Kinesis data stream <span className="text-[#d13212]">*</span>
                    </label>
                    {kinesisStreams.length === 0 ? (
                      <p className="text-[12px] text-[#545b64]">
                        No Kinesis streams found.{" "}
                        <Link href="/kinesis/streams" className="text-[#0972d3] hover:underline">
                          Create a data stream
                        </Link>
                      </p>
                    ) : (
                      <select
                        value={subKinesisArn}
                        onChange={(e) => setSubKinesisArn(e.target.value)}
                        className="w-full border border-[#aab7b8] rounded px-3 py-1.5 bg-white text-[13px]"
                        required
                      >
                        {kinesisStreams.map((s) => (
                          <option key={s.streamArn} value={s.streamArn}>
                            {s.streamName}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-[#16191f] mb-1">Execution role ARN</label>
                    {iamRoles.length === 0 ? (
                      <input
                        type="text"
                        placeholder="arn:aws:iam::000000000000:role/CWLtoKinesisRole"
                        value={subRoleArn}
                        onChange={(e) => setSubRoleArn(e.target.value)}
                        className="w-full border border-[#aab7b8] rounded px-3 py-1.5 font-mono text-[13px]"
                      />
                    ) : (
                      <select
                        value={subRoleArn}
                        onChange={(e) => setSubRoleArn(e.target.value)}
                        className="w-full border border-[#aab7b8] rounded px-3 py-1.5 bg-white text-[13px]"
                      >
                        <option value="">Select an IAM role...</option>
                        {iamRoles.map((r) => (
                          <option key={r.arn} value={r.arn}>
                            {r.roleName}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <label className="block font-bold text-[#16191f] mb-1">
                    Lambda function <span className="text-[#d13212]">*</span>
                  </label>
                  {lambdaFunctions.length === 0 ? (
                    <input
                      type="text"
                      placeholder="arn:aws:lambda:us-east-1:000000000000:function:my-function"
                      value={subLambdaArn}
                      onChange={(e) => setSubLambdaArn(e.target.value)}
                      className="w-full border border-[#aab7b8] rounded px-3 py-1.5 font-mono text-[13px]"
                      required
                    />
                  ) : (
                    <select
                      value={subLambdaArn}
                      onChange={(e) => setSubLambdaArn(e.target.value)}
                      className="w-full border border-[#aab7b8] rounded px-3 py-1.5 bg-white text-[13px]"
                      required
                    >
                      {lambdaFunctions.map((f) => (
                        <option key={f.functionArn} value={f.functionArn}>
                          {f.functionName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowCreateSubModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 border border-[#545b64] rounded text-[#16191f] hover:bg-[#fafafa]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingSubFilter}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold rounded shadow-sm disabled:opacity-50"
                >
                  {isCreatingSubFilter ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Retention Modal */}
      {showRetentionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Edit retention setting</h2>
            <p className="text-[13px] text-[#545b64]">
              Select how long log events should be retained in <code>{logGroup.logGroupName}</code>.
            </p>
            <div>
              <select
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] bg-white"
              >
                {RETENTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowRetentionModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-[#545b64] rounded text-[13px] text-[#16191f]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRetention}
                disabled={isUpdatingRetention}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] rounded shadow-sm"
              >
                {isUpdatingRetention ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Modal */}
      {showDeleteGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">
              Delete log group &apos;{logGroup.logGroupName}&apos;?
            </h2>
            <p className="text-[13px] text-[#545b64]">
              This action cannot be undone. All log streams, log events, and filters will be permanently deleted.
            </p>
            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                To confirm, type <span className="font-mono text-[#d13212]">delete</span> below:
              </label>
              <input
                type="text"
                placeholder="delete"
                value={deleteGroupInput}
                onChange={(e) => setDeleteGroupInput(e.target.value)}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px]"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowDeleteGroupModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-[#545b64] rounded text-[13px] text-[#16191f]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteGroup}
                disabled={isDeletingGroup || deleteGroupInput.trim().toLowerCase() !== "delete"}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 bg-[#d13212] hover:bg-[#a82a0f] text-white font-bold text-[13px] rounded shadow-sm disabled:opacity-50"
              >
                {isDeletingGroup ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Tags Modal */}
      {showTagsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Manage tags</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {editableTags.map((tag, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Key"
                    value={tag.key}
                    onChange={(e) => {
                      const copy = [...editableTags];
                      copy[idx].key = e.target.value;
                      setEditableTags(copy);
                    }}
                    className="flex-1 border border-[#aab7b8] rounded px-2.5 py-1 text-[12px]"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={tag.value}
                    onChange={(e) => {
                      const copy = [...editableTags];
                      copy[idx].value = e.target.value;
                      setEditableTags(copy);
                    }}
                    className="flex-1 border border-[#aab7b8] rounded px-2.5 py-1 text-[12px]"
                  />
                  <button
                    type="button"
                    onClick={() => setEditableTags(editableTags.filter((_, i) => i !== idx))}
                    className="text-[#d13212] font-bold px-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setEditableTags([...editableTags, { key: "", value: "" }])}
                className="text-[12px] text-[#0972d3] hover:underline font-medium"
              >
                + Add new tag
              </button>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowTagsModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-[#545b64] rounded text-[13px] text-[#16191f]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTags}
                disabled={isUpdatingTags}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] rounded shadow-sm disabled:opacity-50"
              >
                {isUpdatingTags ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
