/**
 * src/app/s3/[bucket]/BucketDetailClient.tsx – S3 Bucket Detail Client Component.
 * Full replica of AWS S3 Bucket Console with Objects, Properties, Permissions, and Metrics tabs.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { S3BucketDetail, S3ObjectSummary, KmsKeyOption } from "../types";
import {
  deleteObject,
  deleteObjects,
  createFolder,
  updateBucketVersioning,
  updateBucketEncryption,
  updateBucketPublicAccessBlock,
  updateBucketPolicy,
  deleteBucketPolicy,
  updateBucketCors,
  updateBucketTagging,
  createLifecycleRule,
  deleteLifecycleRule,
  toggleLifecycleRule,
  updateBucketLogging,
  updateBucketWebsite,
  updateBucketAccelerate,
  updateBucketObjectLock,
  updateBucketRequestPayment,
  updateBucketOwnershipControls,
  addBucketNotification,
  deleteBucketNotification,
  addBucketReplicationRule,
  deleteBucketReplicationRule,
  addBucketInventoryConfig,
  deleteBucketInventoryConfig,
} from "../actions";

interface BucketDetailClientProps {
  bucket: S3BucketDetail;
  folders: string[];
  objects: S3ObjectSummary[];
  versions?: S3ObjectSummary[];
  currentPrefix: string;
  kmsKeys?: KmsKeyOption[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + " " + units[i];
}

export function BucketDetailClient({
  bucket,
  folders,
  objects,
  versions = [],
  currentPrefix,
  kmsKeys = [],
}: BucketDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    "objects" | "properties" | "permissions" | "metrics" | "management"
  >("objects");

  // Show versions toggle state
  const [showVersions, setShowVersions] = useState(false);

  // Selection in Objects table
  const [selectedItems, setSelectedItems] = useState<
    Map<string, { key: string; versionId?: string; isDeleteMarker?: boolean }>
  >(new Map());

  // Search filter
  const [objectSearch, setObjectSearch] = useState("");

  // Modals & form state
  const [showLifecycleModal, setShowLifecycleModal] = useState(false);
  const [lifecycleRuleId, setLifecycleRuleId] = useState("");
  const [lifecycleScopeType, setLifecycleScopeType] = useState<"all" | "prefix">("all");
  const [lifecyclePrefix, setLifecyclePrefix] = useState("");
  const [enableTransition, setEnableTransition] = useState(false);
  const [transitionDays, setTransitionDays] = useState(30);
  const [transitionStorageClass, setTransitionStorageClass] = useState("STANDARD_IA");
  const [enableExpiration, setEnableExpiration] = useState(false);
  const [expirationDays, setExpirationDays] = useState(365);

  // Replication & Inventory state
  const [showReplicationModal, setShowReplicationModal] = useState(false);
  const [replicationRules, setReplicationRules] = useState<
    Array<{ name: string; destination: string; status: string }>
  >(bucket.replicationRules || []);
  const [repRuleName, setRepRuleName] = useState("");
  const [repDestBucket, setRepDestBucket] = useState("");

  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryConfigs, setInventoryConfigs] = useState<
    Array<{ id: string; destination: string; frequency: string; status: string }>
  >(bucket.inventoryConfigs || []);
  const [invConfigId, setInvConfigId] = useState("");
  const [invDestBucket, setInvDestBucket] = useState("");
  const [invFrequency, setInvFrequency] = useState("Weekly");

  // Properties card states & modals
  const [showLoggingModal, setShowLoggingModal] = useState(false);
  const [loggingEnabled, setLoggingEnabled] = useState(bucket.logging?.enabled ?? false);
  const [targetLoggingBucket, setTargetLoggingBucket] = useState(bucket.logging?.targetBucket || bucket.name);
  const [targetLoggingPrefix, setTargetLoggingPrefix] = useState(bucket.logging?.targetPrefix || "logs/");

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{ name: string; events: string[]; destination: string }>
  >(bucket.notifications || []);
  const [notifName, setNotifName] = useState("");
  const [notifEvents, setNotifEvents] = useState<string[]>(["s3:ObjectCreated:*"]);
  const [notifDest, setNotifDest] = useState("Lambda");

  const [showAccelerateModal, setShowAccelerateModal] = useState(false);
  const [accelerateStatus, setAccelerateStatus] = useState<"Enabled" | "Suspended">(
    bucket.accelerate?.status || "Suspended"
  );

  const [showObjectLockModal, setShowObjectLockModal] = useState(false);
  const [objectLockEnabled, setObjectLockEnabled] = useState(bucket.objectLock?.enabled ?? false);
  const [objectLockMode, setObjectLockMode] = useState<"GOVERNANCE" | "COMPLIANCE">(
    bucket.objectLock?.mode || "GOVERNANCE"
  );
  const [objectLockDays, setObjectLockDays] = useState(bucket.objectLock?.days || 30);

  const [showRequesterPaysModal, setShowRequesterPaysModal] = useState(false);
  const [requesterPaysEnabled, setRequesterPaysEnabled] = useState(
    bucket.requestPayment?.payer === "Requester"
  );

  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [websiteEnabled, setWebsiteEnabled] = useState(bucket.website?.enabled ?? false);
  const [websiteIndexDoc, setWebsiteIndexDoc] = useState(bucket.website?.indexDocument || "index.html");
  const [websiteErrorDoc, setWebsiteErrorDoc] = useState(bucket.website?.errorDocument || "error.html");

  const [showOwnershipModal, setShowOwnershipModal] = useState(false);
  const [ownershipMode, setOwnershipMode] = useState<
    "BucketOwnerEnforced" | "BucketOwnerPreferred" | "ObjectWriter"
  >(bucket.ownershipControls?.ownership || "BucketOwnerEnforced");

  // Modals & form state
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [showVersioningModal, setShowVersioningModal] = useState(false);
  const [newVersioningStatus, setNewVersioningStatus] = useState<"Enabled" | "Suspended">(
    bucket.versioningStatus === "Enabled" ? "Suspended" : "Enabled"
  );

  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [encAlgo, setEncAlgo] = useState<"AES256" | "aws:kms">(
    bucket.encryption.sseAlgorithm === "aws:kms" ? "aws:kms" : "AES256"
  );
  const [kmsKeyIdInput, setKmsKeyIdInput] = useState(bucket.encryption.kmsKeyId || "");
  const [bucketKeyToggle, setBucketKeyToggle] = useState(bucket.encryption.bucketKeyEnabled);

  const [showPabModal, setShowPabModal] = useState(false);
  const [pabBlockAll, setPabBlockAll] = useState(
    bucket.publicAccessBlock.blockPublicAcls &&
      bucket.publicAccessBlock.ignorePublicAcls &&
      bucket.publicAccessBlock.blockPublicPolicy &&
      bucket.publicAccessBlock.restrictPublicBuckets
  );
  const [pabBlockAcls, setPabBlockAcls] = useState(bucket.publicAccessBlock.blockPublicAcls);
  const [pabIgnoreAcls, setPabIgnoreAcls] = useState(bucket.publicAccessBlock.ignorePublicAcls);
  const [pabBlockPolicy, setPabBlockPolicy] = useState(bucket.publicAccessBlock.blockPublicPolicy);
  const [pabRestrictBuckets, setPabRestrictBuckets] = useState(
    bucket.publicAccessBlock.restrictPublicBuckets
  );

  const [isEditingPolicy, setIsEditingPolicy] = useState(false);
  const [policyInput, setPolicyInput] = useState(bucket.policy || "");

  const [isEditingCors, setIsEditingCors] = useState(false);
  const [corsInput, setCorsInput] = useState(bucket.cors || "");

  const [showTagModal, setShowTagModal] = useState(false);
  const [tagsList, setTagsList] = useState(bucket.tags);
  const [tagKey, setTagKey] = useState("");
  const [tagVal, setTagVal] = useState("");

  // Feedback alerts
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(label);
    setTimeout(() => setCopiedNotification(null), 2000);
  };

  // Combine items for objects table
  const allItems = showVersions
    ? [
        ...folders.map((f) => ({
          id: f,
          key: f,
          name: f.slice(currentPrefix.length),
          isFolder: true,
          size: 0,
          lastModified: "—",
          storageClass: "—",
          versionId: undefined,
          isDeleteMarker: false,
          isLatest: true,
        })),
        ...(versions || []).map((v) => ({
          id: `${v.key}::${v.versionId || "null"}::${v.isDeleteMarker ? "dm" : "obj"}`,
          key: v.key,
          name: v.name,
          isFolder: false,
          size: v.size,
          lastModified: v.lastModified,
          storageClass: v.storageClass,
          versionId: v.versionId,
          isDeleteMarker: v.isDeleteMarker ?? false,
          isLatest: v.isLatest ?? false,
        })),
      ]
    : [
        ...folders.map((f) => ({
          id: f,
          key: f,
          name: f.slice(currentPrefix.length),
          isFolder: true,
          size: 0,
          lastModified: "—",
          storageClass: "—",
          versionId: undefined,
          isDeleteMarker: false,
          isLatest: true,
        })),
        ...objects.map((o) => ({
          id: o.key,
          key: o.key,
          name: o.name,
          isFolder: false,
          size: o.size,
          lastModified: o.lastModified,
          storageClass: o.storageClass,
          versionId: o.versionId,
          isDeleteMarker: false,
          isLatest: true,
        })),
      ];

  const filteredItems = allItems.filter((i) =>
    i.name.toLowerCase().includes(objectSearch.toLowerCase())
  );

  const singleSelectedItem =
    selectedItems.size === 1 ? Array.from(selectedItems.values())[0] : null;

  const toggleSelectObject = (item: {
    id: string;
    key: string;
    versionId?: string;
    isDeleteMarker?: boolean;
  }) => {
    const next = new Map(selectedItems);
    if (next.has(item.id)) {
      next.delete(item.id);
    } else {
      next.set(item.id, {
        key: item.key,
        versionId: item.versionId,
        isDeleteMarker: item.isDeleteMarker,
      });
    }
    setSelectedItems(next);
  };

  const toggleAllObjects = () => {
    if (selectedItems.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedItems(new Map());
    } else {
      const next = new Map();
      filteredItems.forEach((i) => {
        next.set(i.id, {
          key: i.key,
          versionId: i.versionId,
          isDeleteMarker: i.isDeleteMarker,
        });
      });
      setSelectedItems(next);
    }
  };

  // Object Actions
  const handleDeleteObjects = () => {
    if (selectedItems.size === 0) return;

    const items = Array.from(selectedItems.values());
    const hasDeleteMarker = items.some((i) => i.isDeleteMarker);

    let confirmMsg = `Delete ${items.length} item(s)?`;
    if (hasDeleteMarker) {
      confirmMsg = `Delete ${items.length} selected item(s)? Deleting a Delete marker will restore the previous version of the object.`;
    } else if (showVersions) {
      confirmMsg = `Permanently delete ${items.length} selected version(s)? This action cannot be undone.`;
    } else if (bucket.versioningStatus === "Enabled") {
      confirmMsg = `Delete ${items.length} object(s)? A Delete marker will be created because bucket versioning is enabled. The object(s) will be hidden from the standard view. To see all versions and delete markers, turn on "Show versions".`;
    }

    if (!confirm(confirmMsg)) return;

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await deleteObjects(bucket.name, items);
      if (res.success) {
        if (hasDeleteMarker) {
          setSuccess(
            `Successfully deleted Delete marker(s). Previous object version has been restored.`
          );
        } else if (showVersions) {
          setSuccess(`Permanently deleted ${items.length} version(s).`);
        } else if (bucket.versioningStatus === "Enabled") {
          setSuccess(
            `Successfully added Delete marker to ${items.length} object(s). (Turn on 'Show versions' above the table to view versions or restore).`
          );
        } else {
          setSuccess(`Successfully deleted ${items.length} object(s).`);
        }
        setSelectedItems(new Map());
        router.refresh();
      } else {
        setError(res.error || "Failed to delete objects.");
      }
    });
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const fd = new FormData();
    fd.set("bucket", bucket.name);
    fd.set("prefix", currentPrefix);
    fd.set("folderName", newFolderName.trim());

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      await createFolder(fd);
      setShowFolderModal(false);
      setNewFolderName("");
      router.refresh();
    });
  };

  // Versioning Action
  const handleSaveVersioning = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateBucketVersioning(bucket.name, newVersioningStatus);
      if (res.success) {
        setSuccess(`Bucket versioning updated to ${newVersioningStatus}.`);
        setShowVersioningModal(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to update versioning.");
      }
    });
  };

  // Encryption Action
  const handleSaveEncryption = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateBucketEncryption(
        bucket.name,
        encAlgo,
        encAlgo === "aws:kms" ? kmsKeyIdInput.trim() : undefined,
        bucketKeyToggle
      );
      if (res.success) {
        setSuccess("Default server-side encryption updated.");
        setShowEncryptionModal(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to update default encryption.");
      }
    });
  };

  // Public Access Block Action
  const handleSavePab = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateBucketPublicAccessBlock(bucket.name, {
        blockPublicAcls: pabBlockAll || pabBlockAcls,
        ignorePublicAcls: pabBlockAll || pabIgnoreAcls,
        blockPublicPolicy: pabBlockAll || pabBlockPolicy,
        restrictPublicBuckets: pabBlockAll || pabRestrictBuckets,
      });
      if (res.success) {
        setSuccess("Block public access settings updated.");
        setShowPabModal(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to update Block Public Access.");
      }
    });
  };

  // Policy Actions
  const handleSavePolicy = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateBucketPolicy(bucket.name, policyInput);
      if (res.success) {
        setSuccess("Bucket policy updated.");
        setIsEditingPolicy(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to update bucket policy.");
      }
    });
  };

  const handleDeletePolicy = () => {
    if (!confirm("Delete bucket policy?")) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await deleteBucketPolicy(bucket.name);
      if (res.success) {
        setSuccess("Bucket policy deleted.");
        router.refresh();
      } else {
        setError(res.error || "Failed to delete bucket policy.");
      }
    });
  };

  // CORS Action
  const handleSaveCors = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateBucketCors(bucket.name, corsInput);
      if (res.success) {
        setSuccess("CORS configuration updated.");
        setIsEditingCors(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to update CORS configuration.");
      }
    });
  };

  // Tagging Action
  const handleAddTag = () => {
    if (!tagKey.trim()) return;
    setTagsList([...tagsList, { key: tagKey.trim(), value: tagVal.trim() }]);
    setTagKey("");
    setTagVal("");
  };

  const handleRemoveTag = (idx: number) => {
    setTagsList(tagsList.filter((_, i) => i !== idx));
  };

  const handleSaveTags = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateBucketTagging(bucket.name, tagsList);
      if (res.success) {
        setSuccess("Tags updated successfully.");
        setShowTagModal(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to update tags.");
      }
    });
  };

  // Lifecycle Rule Actions
  const handleCreateLifecycleRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lifecycleRuleId.trim()) {
      setError("Lifecycle rule name is required.");
      return;
    }
    if (!enableTransition && !enableExpiration) {
      setError("Please specify at least one rule action (transition or expiration).");
      return;
    }
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await createLifecycleRule(bucket.name, {
        id: lifecycleRuleId.trim(),
        status: "Enabled",
        prefix: lifecycleScopeType === "prefix" ? lifecyclePrefix.trim() : undefined,
        transitionDays: enableTransition ? Number(transitionDays) : undefined,
        transitionStorageClass: enableTransition ? transitionStorageClass : undefined,
        expirationDays: enableExpiration ? Number(expirationDays) : undefined,
      });
      if (res.success) {
        setSuccess(`Lifecycle rule '${lifecycleRuleId}' created successfully.`);
        setShowLifecycleModal(false);
        setLifecycleRuleId("");
        setLifecyclePrefix("");
        setEnableTransition(false);
        setEnableExpiration(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to create lifecycle rule.");
      }
    });
  };

  const handleToggleLifecycleRule = (ruleId: string, currentStatus: "Enabled" | "Disabled") => {
    const nextStatus = currentStatus === "Enabled" ? "Disabled" : "Enabled";
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await toggleLifecycleRule(bucket.name, ruleId, nextStatus);
      if (res.success) {
        setSuccess(`Rule '${ruleId}' status updated to ${nextStatus}.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to toggle rule status.");
      }
    });
  };

  const handleDeleteLifecycleRule = (ruleId: string) => {
    if (!confirm(`Delete lifecycle rule '${ruleId}'?`)) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await deleteLifecycleRule(bucket.name, ruleId);
      if (res.success) {
        setSuccess(`Rule '${ruleId}' deleted successfully.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to delete rule.");
      }
    });
  };

  const handleCreateReplicationRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repRuleName.trim() || !repDestBucket.trim()) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await addBucketReplicationRule(bucket.name, {
        name: repRuleName.trim(),
        destination: repDestBucket.trim(),
        status: "Enabled",
      });
      if (res.success) {
        setReplicationRules((prev) => [
          ...prev.filter((r) => r.name !== repRuleName.trim()),
          { name: repRuleName.trim(), destination: repDestBucket.trim(), status: "Enabled" },
        ]);
        setShowReplicationModal(false);
        setRepRuleName("");
        setRepDestBucket("");
        setSuccess(`Replication rule '${repRuleName}' created successfully.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to create replication rule.");
      }
    });
  };

  const handleDeleteReplicationRule = (name: string) => {
    if (!confirm(`Delete replication rule '${name}'?`)) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await deleteBucketReplicationRule(bucket.name, name);
      if (res.success) {
        setReplicationRules((prev) => prev.filter((r) => r.name !== name));
        setSuccess(`Replication rule '${name}' deleted.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to delete replication rule.");
      }
    });
  };

  const handleCreateInventoryConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invConfigId.trim() || !invDestBucket.trim()) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await addBucketInventoryConfig(bucket.name, {
        id: invConfigId.trim(),
        destination: invDestBucket.trim(),
        frequency: invFrequency,
        status: "Enabled",
      });
      if (res.success) {
        setInventoryConfigs((prev) => [
          ...prev.filter((c) => c.id !== invConfigId.trim()),
          {
            id: invConfigId.trim(),
            destination: invDestBucket.trim(),
            frequency: invFrequency,
            status: "Enabled",
          },
        ]);
        setShowInventoryModal(false);
        setInvConfigId("");
        setInvDestBucket("");
        setSuccess(`Inventory configuration '${invConfigId}' created successfully.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to create inventory configuration.");
      }
    });
  };

  const handleDeleteInventoryConfig = (id: string) => {
    if (!confirm(`Delete inventory configuration '${id}'?`)) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await deleteBucketInventoryConfig(bucket.name, id);
      if (res.success) {
        setInventoryConfigs((prev) => prev.filter((c) => c.id !== id));
        setSuccess(`Inventory configuration '${id}' deleted.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to delete inventory configuration.");
      }
    });
  };

  const handleSaveLogging = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateBucketLogging(bucket.name, {
        enabled: loggingEnabled,
        targetBucket: targetLoggingBucket,
        targetPrefix: targetLoggingPrefix,
      });
      if (res.success) {
        setShowLoggingModal(false);
        setSuccess(
          loggingEnabled
            ? `Server access logging enabled to ${targetLoggingBucket}/${targetLoggingPrefix}`
            : "Server access logging disabled."
        );
        router.refresh();
      } else {
        setError(res.error || "Failed to update logging.");
      }
    });
  };

  const handleSaveNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifName.trim()) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await addBucketNotification(bucket.name, {
        name: notifName.trim(),
        events: notifEvents,
        destination: notifDest,
      });
      if (res.success) {
        setNotifications((prev) => [
          ...prev.filter((n) => n.name !== notifName.trim()),
          { name: notifName.trim(), events: notifEvents, destination: notifDest },
        ]);
        setShowNotificationModal(false);
        setNotifName("");
        setSuccess(`Event notification '${notifName}' created successfully.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to create notification.");
      }
    });
  };

  const handleDeleteNotification = (name: string) => {
    if (!confirm(`Delete event notification '${name}'?`)) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await deleteBucketNotification(bucket.name, name);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n.name !== name));
        setSuccess(`Event notification '${name}' deleted.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to delete notification.");
      }
    });
  };

  const handleSaveAccelerate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateBucketAccelerate(bucket.name, accelerateStatus);
      if (res.success) {
        setShowAccelerateModal(false);
        setSuccess(`Transfer acceleration status updated to ${accelerateStatus}.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to update transfer acceleration.");
      }
    });
  };

  const handleSaveObjectLock = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateBucketObjectLock(bucket.name, {
        enabled: objectLockEnabled,
        mode: objectLockMode,
        days: Number(objectLockDays),
      });
      if (res.success) {
        setShowObjectLockModal(false);
        setSuccess(
          objectLockEnabled
            ? `Object Lock enabled with ${objectLockMode} mode (${objectLockDays} days retention).`
            : "Object Lock settings updated."
        );
        router.refresh();
      } else {
        setError(res.error || "Failed to update object lock.");
      }
    });
  };

  const handleSaveRequesterPays = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateBucketRequestPayment(
        bucket.name,
        requesterPaysEnabled ? "Requester" : "BucketOwner"
      );
      if (res.success) {
        setShowRequesterPaysModal(false);
        setSuccess(requesterPaysEnabled ? "Requester pays enabled." : "Requester pays disabled.");
        router.refresh();
      } else {
        setError(res.error || "Failed to update requester pays.");
      }
    });
  };

  const handleSaveWebsite = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateBucketWebsite(bucket.name, {
        enabled: websiteEnabled,
        indexDocument: websiteIndexDoc,
        errorDocument: websiteErrorDoc,
      });
      if (res.success) {
        setShowWebsiteModal(false);
        setSuccess(
          websiteEnabled
            ? `Static website hosting enabled at http://${bucket.name}.s3-website-us-east-1.amazonaws.com`
            : "Static website hosting disabled."
        );
        router.refresh();
      } else {
        setError(res.error || "Failed to update static website hosting.");
      }
    });
  };

  const handleSaveOwnership = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateBucketOwnershipControls(bucket.name, ownershipMode);
      if (res.success) {
        setShowOwnershipModal(false);
        setSuccess(`Object ownership updated to ${ownershipMode}.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to update object ownership.");
      }
    });
  };

  // Breadcrumb path parts
  const prefixSegments = currentPrefix
    .split("/")
    .filter(Boolean)
    .map((part, i, arr) => ({
      name: part,
      prefix: arr.slice(0, i + 1).join("/") + "/",
    }));

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header & Breadcrumb */}
      <div>
        <div className="text-[12px] text-[#545b64] mb-1 flex items-center gap-1.5 font-medium">
          <Link href="/s3" className="hover:underline text-[#0972d3]">
            Amazon S3
          </Link>
          <span>/</span>
          <Link href="/s3" className="hover:underline text-[#0972d3]">
            Buckets
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#16191f]">{bucket.name}</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-[22px] font-bold text-[#16191f] tracking-tight">{bucket.name}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(`s3://${bucket.name}`, "s3Uri")}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              {copiedNotification === "s3Uri" ? "Copied S3 URI" : "Copy S3 URI"}
            </button>
            <button
              onClick={() => copyToClipboard(bucket.arn, "arn")}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              {copiedNotification === "arn" ? "Copied ARN" : "Copy ARN"}
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-[#fbeeed] border-l-4 border-[#d13212] p-3 text-[13px] text-[#d13212] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline text-[12px] ml-4">
            Dismiss
          </button>
        </div>
      )}
      {success && (
        <div className="bg-[#edfbf0] border-l-4 border-[#1d8102] p-3 text-[13px] text-[#1d8102] flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="underline text-[12px] ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Cloudscape Tabs */}
      <div className="flex border-b border-[#eaeded] space-x-6 text-[13px] font-medium">
        <button
          onClick={() => setActiveTab("objects")}
          className={`pb-2.5 transition-colors ${
            activeTab === "objects"
              ? "border-b-2 border-[#0972d3] text-[#0972d3] font-bold"
              : "text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Objects ({showVersions ? folders.length + (versions || []).length : folders.length + objects.length})
        </button>
        <button
          onClick={() => setActiveTab("properties")}
          className={`pb-2.5 transition-colors ${
            activeTab === "properties"
              ? "border-b-2 border-[#0972d3] text-[#0972d3] font-bold"
              : "text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Properties
        </button>
        <button
          onClick={() => setActiveTab("permissions")}
          className={`pb-2.5 transition-colors ${
            activeTab === "permissions"
              ? "border-b-2 border-[#0972d3] text-[#0972d3] font-bold"
              : "text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Permissions
        </button>
        <button
          onClick={() => setActiveTab("metrics")}
          className={`pb-2.5 transition-colors ${
            activeTab === "metrics"
              ? "border-b-2 border-[#0972d3] text-[#0972d3] font-bold"
              : "text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Metrics
        </button>
        <button
          onClick={() => setActiveTab("management")}
          className={`pb-2.5 transition-colors ${
            activeTab === "management"
              ? "border-b-2 border-[#0972d3] text-[#0972d3] font-bold"
              : "text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Management
        </button>
      </div>

      {/* TAB 1: OBJECTS */}
      {activeTab === "objects" && (
        <div className="space-y-4">
          {/* Breadcrumb folder path */}
          <div className="flex items-center gap-1.5 text-[13px] bg-[#fafafa] p-2.5 rounded border border-[#eaeded]">
            <Link
              href={`/s3/${bucket.name}`}
              className="text-[#0972d3] hover:underline font-semibold"
            >
              {bucket.name}
            </Link>
            {prefixSegments.map((seg) => (
              <span key={seg.prefix} className="flex items-center gap-1.5">
                <span className="text-[#aab7b8]">/</span>
                <Link
                  href={`/s3/${bucket.name}?prefix=${encodeURIComponent(seg.prefix)}`}
                  className="text-[#0972d3] hover:underline"
                >
                  {seg.name}
                </Link>
              </span>
            ))}
          </div>

          {/* Table Container */}
          <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
            {/* Objects Toolbar */}
            <div className="p-4 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3 bg-[#fafafa]">
              <div className="flex flex-wrap items-center gap-4 flex-1 min-w-[280px]">
                <div className="relative min-w-[220px] flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Find objects by prefix"
                    value={objectSearch}
                    onChange={(e) => setObjectSearch(e.target.value)}
                    className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white placeholder-[#879596]"
                  />
                </div>

                {/* Show versions switch */}
                <div className="flex items-center gap-2 select-none">
                  <span className="text-[13px] font-semibold text-[#16191f]">Show versions</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showVersions}
                    onClick={() => {
                      setShowVersions(!showVersions);
                      setSelectedItems(new Map());
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      showVersions ? "bg-[#0972d3]" : "bg-[#aab7b8]"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        showVersions ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Action Buttons (32px Standard) */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(true)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
                >
                  Create folder
                </button>

                {singleSelectedItem && !singleSelectedItem.key.endsWith("/") && !singleSelectedItem.isDeleteMarker && (
                  <>
                    <a
                      href={`/api/s3/download?bucket=${bucket.name}&key=${encodeURIComponent(
                        singleSelectedItem.key
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
                    >
                      Open
                    </a>
                    <a
                      href={`/api/s3/download?bucket=${bucket.name}&key=${encodeURIComponent(
                        singleSelectedItem.key
                      )}`}
                      download
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
                    >
                      Download
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/api/s3/download?bucket=${bucket.name}&key=${encodeURIComponent(
                          singleSelectedItem.key
                        )}`;
                        copyToClipboard(url, "objUrl");
                      }}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
                    >
                      {copiedNotification === "objUrl" ? "Copied URL" : "Copy URL"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        copyToClipboard(`s3://${bucket.name}/${singleSelectedItem.key}`, "objUri");
                      }}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
                    >
                      {copiedNotification === "objUri" ? "Copied S3 URI" : "Copy S3 URI"}
                    </button>
                  </>
                )}

                <button
                  onClick={handleDeleteObjects}
                  disabled={selectedItems.size === 0 || isPending}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Delete
                </button>

                <Link
                  href={`/s3/${bucket.name}/upload${
                    currentPrefix ? `?prefix=${encodeURIComponent(currentPrefix)}` : ""
                  }`}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm"
                >
                  Upload
                </Link>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-semibold text-[12px]">
                    <th className="py-2.5 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={
                          filteredItems.length > 0 && selectedItems.size === filteredItems.length
                        }
                        onChange={toggleAllObjects}
                        className="accent-[#0972d3] rounded"
                      />
                    </th>
                    <th className="py-2.5 px-4">Name</th>
                    {showVersions && <th className="py-2.5 px-4">Version ID</th>}
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Last modified</th>
                    <th className="py-2.5 px-4">Size</th>
                    <th className="py-2.5 px-4">Storage class</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={showVersions ? 7 : 6}
                        className="py-12 text-center text-[#545b64]"
                      >
                        <div className="font-semibold text-[#16191f] text-[14px] mb-1">
                          No objects found
                        </div>
                        <p className="text-[13px] max-w-md mx-auto mb-4">
                          Objects are the fundamental entities stored in Amazon S3. Upload files to
                          get started.
                        </p>
                        <Link
                          href={`/s3/${bucket.name}/upload${
                            currentPrefix ? `?prefix=${encodeURIComponent(currentPrefix)}` : ""
                          }`}
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                          className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm"
                        >
                          Upload objects
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-[#f2f8fd] transition-colors">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => toggleSelectObject(item)}
                            className="accent-[#0972d3] rounded"
                          />
                        </td>
                        <td className="py-3 px-4 font-medium text-[#0972d3]">
                          {item.isFolder ? (
                            <Link
                              href={`/s3/${bucket.name}?prefix=${encodeURIComponent(item.key)}`}
                              className="hover:underline flex items-center gap-1.5"
                            >
                              <span>{item.name}</span>
                            </Link>
                          ) : item.isDeleteMarker ? (
                            <span className="text-[#545b64] font-normal">{item.name}</span>
                          ) : (
                            <Link
                              href={`/s3/${bucket.name}/object?key=${encodeURIComponent(item.key)}`}
                              className="hover:underline font-semibold"
                            >
                              {item.name}
                            </Link>
                          )}
                        </td>
                        {showVersions && (
                          <td className="py-3 px-4 font-mono text-[12px] text-[#545b64]">
                            {item.isFolder ? (
                              "—"
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="truncate max-w-[140px]">{item.versionId}</span>
                                {item.isLatest && (
                                  <span className="text-[11px] font-semibold text-[#0972d3] bg-[#f2f8fd] px-1.5 py-0.5 rounded border border-[#d5dbdb]">
                                    (Latest version)
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        )}
                        <td className="py-3 px-4 text-[#545b64]">
                          {item.isFolder ? (
                            "Folder"
                          ) : item.isDeleteMarker ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold bg-[#eaeded] text-[#545b64] border border-[#d5dbdb]">
                              Delete marker
                            </span>
                          ) : (
                            "File"
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#545b64]">{item.lastModified}</td>
                        <td className="py-3 px-4 text-[#545b64]">
                          {item.isFolder || item.isDeleteMarker ? "—" : formatBytes(item.size)}
                        </td>
                        <td className="py-3 px-4 text-[#545b64]">
                          {item.isFolder || item.isDeleteMarker ? "—" : item.storageClass}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROPERTIES */}
      {activeTab === "properties" && (
        <div className="space-y-6">
          {/* Bucket overview */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Bucket overview
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px]">
              <div>
                <dt className="text-[#545b64] mb-1">AWS Region</dt>
                <dd className="font-semibold text-[#16191f]">{bucket.region}</dd>
              </div>
              <div>
                <dt className="text-[#545b64] mb-1">Amazon Resource Name (ARN)</dt>
                <dd className="font-mono text-[#16191f] flex items-center gap-2">
                  <span>{bucket.arn}</span>
                  <button
                    onClick={() => copyToClipboard(bucket.arn, "arnProp")}
                    className="text-[#0972d3] text-[11px] hover:underline"
                  >
                    {copiedNotification === "arnProp" ? "Copied" : "Copy"}
                  </button>
                </dd>
              </div>
              <div>
                <dt className="text-[#545b64] mb-1">Creation date</dt>
                <dd className="text-[#16191f]">{bucket.creationDate}</dd>
              </div>
            </dl>
          </div>

          {/* Bucket Versioning Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm flex items-start justify-between">
            <div className="space-y-1 max-w-2xl">
              <h3 className="text-[16px] font-bold text-[#16191f]">Bucket Versioning</h3>
              <p className="text-[13px] text-[#545b64]">
                Versioning is a means of keeping multiple variants of an object in the same bucket.
                You can use versioning to preserve, retrieve, and restore every version of every
                object stored in your Amazon S3 bucket.
              </p>
              <div className="pt-2">
                <span className="text-[13px] text-[#545b64]">Status: </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                    bucket.versioningStatus === "Enabled"
                      ? "bg-[#edfbf0] text-[#1d8102] border border-[#a4e2b0]"
                      : "bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]"
                  }`}
                >
                  {bucket.versioningStatus}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setNewVersioningStatus(
                  bucket.versioningStatus === "Enabled" ? "Suspended" : "Enabled"
                );
                setShowVersioningModal(true);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              Edit
            </button>
          </div>

          {/* Default encryption Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm flex items-start justify-between">
            <div className="space-y-1 max-w-2xl">
              <h3 className="text-[16px] font-bold text-[#16191f]">Default encryption</h3>
              <p className="text-[13px] text-[#545b64]">
                Server-side encryption is automatically applied to new objects stored in this bucket.
              </p>
              <div className="pt-2 text-[13px] space-y-1">
                <div>
                  <span className="text-[#545b64]">Encryption type: </span>
                  <span className="font-semibold text-[#16191f]">
                    {bucket.encryption.sseAlgorithm === "aws:kms"
                      ? "AWS Key Management Service key (SSE-KMS)"
                      : "Amazon S3 managed keys (SSE-S3)"}
                  </span>
                </div>
                {bucket.encryption.kmsKeyId && (
                  <div>
                    <span className="text-[#545b64]">KMS key ID: </span>
                    <span className="font-mono text-[#0972d3]">{bucket.encryption.kmsKeyId}</span>
                  </div>
                )}
                <div>
                  <span className="text-[#545b64]">Bucket Key: </span>
                  <span className="text-[#16191f]">
                    {bucket.encryption.bucketKeyEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setEncAlgo(bucket.encryption.sseAlgorithm === "aws:kms" ? "aws:kms" : "AES256");
                setKmsKeyIdInput(bucket.encryption.kmsKeyId || "");
                setBucketKeyToggle(bucket.encryption.bucketKeyEnabled);
                setShowEncryptionModal(true);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              Edit
            </button>
          </div>

          {/* Tags Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm flex items-start justify-between">
            <div className="space-y-2 max-w-2xl">
              <h3 className="text-[16px] font-bold text-[#16191f]">
                Tags ({bucket.tags.length})
              </h3>
              <p className="text-[13px] text-[#545b64]">
                You can use bucket tags to track project costs and group resources.
              </p>
              {bucket.tags.length > 0 ? (
                <div className="border border-[#eaeded] rounded overflow-hidden max-w-md mt-2">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                      <tr>
                        <th className="p-2">Key</th>
                        <th className="p-2">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded]">
                      {bucket.tags.map((t, i) => (
                        <tr key={i}>
                          <td className="p-2 font-medium">{t.key}</td>
                          <td className="p-2 text-[#545b64]">{t.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-[12px] text-[#545b64]">No tags defined on this bucket.</div>
              )}
            </div>
            <button
              onClick={() => {
                setTagsList(bucket.tags);
                setShowTagModal(true);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              Edit tags
            </button>
          </div>

          {/* Server access logging Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm flex items-start justify-between">
            <div className="space-y-1 max-w-2xl">
              <h3 className="text-[16px] font-bold text-[#16191f]">Server access logging</h3>
              <p className="text-[13px] text-[#545b64]">
                Server access logging provides detailed records for the requests that are made to a bucket.
              </p>
              <div className="pt-2 text-[13px]">
                <span className="text-[#545b64]">Status: </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                    loggingEnabled
                      ? "bg-[#edfbf0] text-[#1d8102] border border-[#a4e2b0]"
                      : "bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]"
                  }`}
                >
                  {loggingEnabled ? "Enabled" : "Disabled"}
                </span>
                {loggingEnabled && (
                  <span className="text-[#545b64] ml-2 text-[12px]">
                    Target: {targetLoggingBucket}/{targetLoggingPrefix}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowLoggingModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              Edit
            </button>
          </div>

          {/* Event notifications Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm flex items-start justify-between">
            <div className="space-y-1 max-w-2xl">
              <h3 className="text-[16px] font-bold text-[#16191f]">
                Event notifications ({notifications.length})
              </h3>
              <p className="text-[13px] text-[#545b64]">
                Use Amazon S3 Event Notifications to receive notifications when certain events happen in your bucket, such as when an object is created or deleted.
              </p>
              {notifications.length > 0 && (
                <div className="pt-2 text-[12px] text-[#545b64] space-y-1">
                  {notifications.map((n, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 py-1 border-b border-[#f2f3f3] last:border-0"
                    >
                      <div>
                        <span className="font-semibold text-[#16191f]">{n.name}:</span>{" "}
                        <span>{n.events.join(", ")} &rarr; {n.destination}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteNotification(n.name)}
                        className="text-[#d13212] hover:underline text-[12px] font-medium ml-4"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowNotificationModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              Create event notification
            </button>
          </div>

          {/* Transfer acceleration Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm flex items-start justify-between">
            <div className="space-y-1 max-w-2xl">
              <h3 className="text-[16px] font-bold text-[#16191f]">Transfer acceleration</h3>
              <p className="text-[13px] text-[#545b64]">
                Amazon S3 Transfer Acceleration enables fast, easy, and secure transfers of files over long distances between your client and an S3 bucket.
              </p>
              <div className="pt-2 text-[13px]">
                <span className="text-[#545b64]">Status: </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                    accelerateStatus === "Enabled"
                      ? "bg-[#edfbf0] text-[#1d8102] border border-[#a4e2b0]"
                      : "bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]"
                  }`}
                >
                  {accelerateStatus}
                </span>
                {accelerateStatus === "Enabled" && (
                  <span className="text-[#0972d3] font-mono ml-2 text-[12px]">
                    https://{bucket.name}.s3-accelerate.amazonaws.com
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAccelerateModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              Edit
            </button>
          </div>

          {/* Object Lock Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm flex items-start justify-between">
            <div className="space-y-1 max-w-2xl">
              <h3 className="text-[16px] font-bold text-[#16191f]">Object Lock</h3>
              <p className="text-[13px] text-[#545b64]">
                Store objects using a write-once-read-many (WORM) model to help you prevent objects from being deleted or overwritten for a fixed amount of time or indefinitely.
              </p>
              <div className="pt-2 text-[13px]">
                <span className="text-[#545b64]">Status: </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                    objectLockEnabled
                      ? "bg-[#edfbf0] text-[#1d8102] border border-[#a4e2b0]"
                      : "bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]"
                  }`}
                >
                  {objectLockEnabled ? "Enabled" : "Disabled"}
                </span>
                {objectLockEnabled && (
                  <span className="text-[#545b64] ml-2 text-[12px]">
                    Mode: {objectLockMode} ({objectLockDays} days retention)
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowObjectLockModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              Edit
            </button>
          </div>

          {/* Requester pays Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm flex items-start justify-between">
            <div className="space-y-1 max-w-2xl">
              <h3 className="text-[16px] font-bold text-[#16191f]">Requester pays</h3>
              <p className="text-[13px] text-[#545b64]">
                When enabled, the requester pays for requests and data transfer costs when downloading objects from this bucket.
              </p>
              <div className="pt-2 text-[13px]">
                <span className="text-[#545b64]">Status: </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                    requesterPaysEnabled
                      ? "bg-[#edfbf0] text-[#1d8102] border border-[#a4e2b0]"
                      : "bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]"
                  }`}
                >
                  {requesterPaysEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowRequesterPaysModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              Edit
            </button>
          </div>

          {/* Static website hosting Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm flex items-start justify-between">
            <div className="space-y-1 max-w-2xl">
              <h3 className="text-[16px] font-bold text-[#16191f]">Static website hosting</h3>
              <p className="text-[13px] text-[#545b64]">
                You can host a static website by configuring this bucket for website hosting and uploading your website content.
              </p>
              <div className="pt-2 text-[13px]">
                <span className="text-[#545b64]">Status: </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                    websiteEnabled
                      ? "bg-[#edfbf0] text-[#1d8102] border border-[#a4e2b0]"
                      : "bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]"
                  }`}
                >
                  {websiteEnabled ? "Enabled" : "Disabled"}
                </span>
                {websiteEnabled && (
                  <div className="pt-1 text-[12px] text-[#0972d3]">
                    <a
                      href={`http://${bucket.name}.s3-website-us-east-1.amazonaws.com`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline font-mono"
                    >
                      http://{bucket.name}.s3-website-us-east-1.amazonaws.com
                    </a>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowWebsiteModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              Edit
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: PERMISSIONS */}
      {activeTab === "permissions" && (
        <div className="space-y-6">
          {/* Block Public Access Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <div>
                <h3 className="text-[16px] font-bold text-[#16191f]">
                  Block public access (bucket settings)
                </h3>
                <p className="text-[13px] text-[#545b64] mt-0.5">
                  Block public access settings apply to this bucket and its objects.
                </p>
              </div>
              <button
                onClick={() => {
                  setPabBlockAll(
                    bucket.publicAccessBlock.blockPublicAcls &&
                      bucket.publicAccessBlock.ignorePublicAcls &&
                      bucket.publicAccessBlock.blockPublicPolicy &&
                      bucket.publicAccessBlock.restrictPublicBuckets
                  );
                  setPabBlockAcls(bucket.publicAccessBlock.blockPublicAcls);
                  setPabIgnoreAcls(bucket.publicAccessBlock.ignorePublicAcls);
                  setPabBlockPolicy(bucket.publicAccessBlock.blockPublicPolicy);
                  setPabRestrictBuckets(bucket.publicAccessBlock.restrictPublicBuckets);
                  setShowPabModal(true);
                }}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
              >
                Edit
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
              <div className="p-3 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
                <div className="font-semibold text-[#16191f]">
                  Block public access to buckets and objects granted through new ACLs
                </div>
                <div className="text-[12px] text-[#545b64]">
                  Status:{" "}
                  <span className="font-bold text-[#16191f]">
                    {bucket.publicAccessBlock.blockPublicAcls ? "On" : "Off"}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
                <div className="font-semibold text-[#16191f]">
                  Block public access to buckets and objects granted through any ACLs
                </div>
                <div className="text-[12px] text-[#545b64]">
                  Status:{" "}
                  <span className="font-bold text-[#16191f]">
                    {bucket.publicAccessBlock.ignorePublicAcls ? "On" : "Off"}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
                <div className="font-semibold text-[#16191f]">
                  Block public access to buckets and objects granted through new public policies
                </div>
                <div className="text-[12px] text-[#545b64]">
                  Status:{" "}
                  <span className="font-bold text-[#16191f]">
                    {bucket.publicAccessBlock.blockPublicPolicy ? "On" : "Off"}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
                <div className="font-semibold text-[#16191f]">
                  Block public and cross-account access to buckets and objects with public policies
                </div>
                <div className="text-[12px] text-[#545b64]">
                  Status:{" "}
                  <span className="font-bold text-[#16191f]">
                    {bucket.publicAccessBlock.restrictPublicBuckets ? "On" : "Off"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bucket Policy Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eaeded] pb-3">
              <div>
                <h3 className="text-[16px] font-bold text-[#16191f]">Bucket policy</h3>
                <p className="text-[13px] text-[#545b64] mt-0.5">
                  The bucket policy, written in JSON format, provides access to the objects stored in
                  the bucket.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {bucket.policy && !isEditingPolicy && (
                  <button
                    onClick={handleDeletePolicy}
                    disabled={isPending}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#d13212] bg-white text-[#d13212] hover:bg-[#fbeeed] transition-colors shadow-sm"
                  >
                    Delete policy
                  </button>
                )}
                {!isEditingPolicy ? (
                  <button
                    onClick={() => {
                      setPolicyInput(bucket.policy || "");
                      setIsEditingPolicy(true);
                    }}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
                  >
                    Edit
                  </button>
                ) : null}
              </div>
            </div>

            {isEditingPolicy ? (
              <div className="space-y-4">
                <textarea
                  rows={14}
                  value={policyInput}
                  onChange={(e) => setPolicyInput(e.target.value)}
                  placeholder='{\n  "Version": "2012-10-17",\n  "Statement": []\n}'
                  className="w-full font-mono text-[12px] p-4 border border-[#aab7b8] rounded bg-[#1e293b] text-[#f8fafc] focus:outline-none focus:border-[#0972d3]"
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setIsEditingPolicy(false);
                      setPolicyInput(bucket.policy || "");
                    }}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePolicy}
                    disabled={isPending}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors disabled:opacity-50"
                  >
                    {isPending ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            ) : (
              <pre className="font-mono text-[12px] p-4 bg-[#f8f9fa] border border-[#eaeded] rounded overflow-x-auto text-[#16191f] max-h-96">
                {bucket.policy || "// No bucket policy defined"}
              </pre>
            )}
          </div>

          {/* Object Ownership Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm flex items-start justify-between">
            <div className="space-y-1 max-w-2xl">
              <h3 className="text-[16px] font-bold text-[#16191f]">Object Ownership</h3>
              <p className="text-[13px] text-[#545b64]">
                Control ownership of objects written to this bucket and disable or enable access control lists (ACLs).
              </p>
              <div className="pt-2 text-[13px]">
                <span className="text-[#545b64]">Setting: </span>
                <span className="font-semibold text-[#16191f]">
                  {ownershipMode === "BucketOwnerEnforced"
                    ? "Bucket owner enforced (ACLs disabled)"
                    : ownershipMode === "BucketOwnerPreferred"
                    ? "Bucket owner preferred (ACLs enabled)"
                    : "Object writer (ACLs enabled)"}
                </span>
                <p className="text-[12px] text-[#545b64] mt-0.5">
                  {ownershipMode === "BucketOwnerEnforced"
                    ? "All objects in this bucket are owned by the bucket owner. Access to this bucket and its objects is specified using policies only."
                    : "Objects in this bucket can be owned by other AWS accounts via ACLs."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowOwnershipModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              Edit
            </button>
          </div>

          {/* Access Control List (ACL) Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <div>
                <h3 className="text-[16px] font-bold text-[#16191f]">Access control list (ACL)</h3>
                <p className="text-[13px] text-[#545b64] mt-0.5">
                  Access control lists grant basic read and write permissions to other AWS accounts.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold text-[12px]">
                  <tr>
                    <th className="p-3">Grantee</th>
                    <th className="p-3">Objects</th>
                    <th className="p-3">Bucket ACL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  <tr>
                    <td className="p-3">
                      <div className="font-semibold text-[#16191f]">Bucket owner (current account)</div>
                      <div className="text-[11px] text-[#545b64] font-mono">Canonical ID: emulator</div>
                    </td>
                    <td className="p-3 text-[#16191f]">List, Write</td>
                    <td className="p-3 text-[#16191f]">Read, Write</td>
                  </tr>
                  <tr>
                    <td className="p-3">
                      <div className="font-semibold text-[#16191f]">Everyone (public access)</div>
                      <div className="text-[11px] text-[#545b64]">All users</div>
                    </td>
                    <td className="p-3 text-[#545b64]">—</td>
                    <td className="p-3 text-[#545b64]">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CORS Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <div>
                <h3 className="text-[16px] font-bold text-[#16191f]">
                  Cross-origin resource sharing (CORS)
                </h3>
                <p className="text-[13px] text-[#545b64] mt-0.5">
                  The CORS configuration defines client web application access permissions.
                </p>
              </div>
              {!isEditingCors && (
                <button
                  onClick={() => {
                    setCorsInput(bucket.cors || "");
                    setIsEditingCors(true);
                  }}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditingCors ? (
              <div className="space-y-4">
                <textarea
                  rows={10}
                  value={corsInput}
                  onChange={(e) => setCorsInput(e.target.value)}
                  placeholder='[\n  {\n    "AllowedHeaders": ["*"],\n    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],\n    "AllowedOrigins": ["*"],\n    "ExposeHeaders": []\n  }\n]'
                  className="w-full font-mono text-[12px] p-4 border border-[#aab7b8] rounded bg-[#1e293b] text-[#f8fafc] focus:outline-none focus:border-[#0972d3]"
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setIsEditingCors(false);
                      setCorsInput(bucket.cors || "");
                    }}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCors}
                    disabled={isPending}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] disabled:opacity-50"
                  >
                    {isPending ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            ) : (
              <pre className="font-mono text-[12px] p-4 bg-[#f8f9fa] border border-[#eaeded] rounded overflow-x-auto text-[#16191f] max-h-72">
                {bucket.cors || "// No CORS configuration defined"}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: METRICS */}
      {activeTab === "metrics" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Bucket storage metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
                <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wider">
                  Total bucket size
                </div>
                <div className="text-[24px] font-bold text-[#16191f]">
                  {formatBytes(bucket.totalSizeBytes)}
                </div>
              </div>

              <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
                <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wider">
                  Total object count
                </div>
                <div className="text-[24px] font-bold text-[#16191f]">{bucket.objectCount}</div>
              </div>

              <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
                <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wider">
                  Storage class
                </div>
                <div className="text-[24px] font-bold text-[#0972d3]">STANDARD (100%)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MANAGEMENT */}
      {activeTab === "management" && (
        <div className="space-y-6">
          {/* Lifecycle rules Card */}
          <div className="bg-white border border-[#eaeded] rounded shadow-sm">
            <div className="p-4 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-[16px] font-bold text-[#16191f]">
                  Lifecycle rules ({bucket.lifecycleRules?.length || 0})
                </h3>
                <p className="text-[13px] text-[#545b64] mt-0.5 max-w-3xl">
                  Lifecycle configuration rules define actions that Amazon S3 applies to a group of objects, such as transitioning objects to another storage class or expiring them after a set period.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLifecycleModal(true)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm"
              >
                Create lifecycle rule
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold text-[12px]">
                  <tr>
                    <th className="p-3">Rule name</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Scope</th>
                    <th className="p-3">Lifecycle actions</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {!bucket.lifecycleRules || bucket.lifecycleRules.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-[#545b64]">
                        No lifecycle rules configured for this bucket. Create a lifecycle rule to automatically transition or expire objects.
                      </td>
                    </tr>
                  ) : (
                    bucket.lifecycleRules.map((rule) => {
                      const actionsSummary: string[] = [];
                      if (rule.transitions && rule.transitions.length > 0) {
                        rule.transitions.forEach((t) => {
                          actionsSummary.push(`Transition to ${t.storageClass} after ${t.days} day(s)`);
                        });
                      }
                      if (rule.expirationDays) {
                        actionsSummary.push(`Expire current version after ${rule.expirationDays} day(s)`);
                      }
                      if (actionsSummary.length === 0) {
                        actionsSummary.push("No transition or expiration configured");
                      }

                      return (
                        <tr key={rule.id} className="hover:bg-[#fbfbfb]">
                          <td className="p-3 font-semibold text-[#16191f]">{rule.id}</td>
                          <td className="p-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                                rule.status === "Enabled"
                                  ? "bg-[#edfbf0] text-[#1d8102] border border-[#1d8102]/30"
                                  : "bg-[#f2f3f3] text-[#545b64] border border-[#eaeded]"
                              }`}
                            >
                              {rule.status}
                            </span>
                          </td>
                          <td className="p-3 text-[#545b64]">
                            {rule.prefix ? (
                              <span className="font-mono text-[12px] bg-[#f2f3f3] px-1.5 py-0.5 rounded">
                                Prefix: {rule.prefix}
                              </span>
                            ) : (
                              "Entire bucket"
                            )}
                          </td>
                          <td className="p-3 text-[#16191f]">
                            <ul className="list-disc list-inside space-y-0.5">
                              {actionsSummary.map((act, i) => (
                                <li key={i}>{act}</li>
                              ))}
                            </ul>
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleToggleLifecycleRule(rule.id, rule.status)}
                                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[12px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors"
                              >
                                {rule.status === "Enabled" ? "Disable" : "Enable"}
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleDeleteLifecycleRule(rule.id)}
                                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[12px] px-3 rounded border border-[#d13212] bg-white text-[#d13212] hover:bg-[#fbeeed] transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Replication rules Card */}
          <div className="bg-white border border-[#eaeded] rounded shadow-sm">
            <div className="p-4 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-[16px] font-bold text-[#16191f]">
                  Replication rules ({replicationRules.length})
                </h3>
                <p className="text-[13px] text-[#545b64] mt-0.5 max-w-3xl">
                  Replication rules define how Amazon S3 replicates objects from one bucket to another across AWS Regions (Cross-Region Replication, CRR) or within the same Region (Same-Region Replication, SRR).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReplicationModal(true)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm"
              >
                Create replication rule
              </button>
            </div>
            {replicationRules.length === 0 ? (
              <div className="p-6 text-center text-[#545b64] text-[13px]">
                No replication rules configured. Create a replication rule to automatically replicate objects to another bucket.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold text-[12px]">
                    <tr>
                      <th className="p-3">Rule name</th>
                      <th className="p-3">Destination bucket</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeded]">
                    {replicationRules.map((r, i) => (
                      <tr key={i} className="hover:bg-[#f2f8fd]">
                        <td className="p-3 font-semibold text-[#16191f]">{r.name}</td>
                        <td className="p-3 font-mono text-[12px]">{r.destination}</td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-[#edfbf0] text-[#1d8102]">
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteReplicationRule(r.name)}
                            className="text-[#d13212] hover:underline text-[12px] font-medium"
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

          {/* Inventory configurations Card */}
          <div className="bg-white border border-[#eaeded] rounded shadow-sm">
            <div className="p-4 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-[16px] font-bold text-[#16191f]">
                  Inventory configurations ({inventoryConfigs.length})
                </h3>
                <p className="text-[13px] text-[#545b64] mt-0.5 max-w-3xl">
                  Amazon S3 inventory provides scheduled reports of your objects and their metadata for business, compliance, and regulatory needs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInventoryModal(true)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm"
              >
                Create inventory configuration
              </button>
            </div>
            {inventoryConfigs.length === 0 ? (
              <div className="p-6 text-center text-[#545b64] text-[13px]">
                No inventory configurations configured. Create an inventory configuration to schedule regular object audit reports.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold text-[12px]">
                    <tr>
                      <th className="p-3">Configuration ID</th>
                      <th className="p-3">Destination</th>
                      <th className="p-3">Frequency</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeded]">
                    {inventoryConfigs.map((c, i) => (
                      <tr key={i} className="hover:bg-[#f2f8fd]">
                        <td className="p-3 font-semibold text-[#16191f]">{c.id}</td>
                        <td className="p-3 font-mono text-[12px]">{c.destination}</td>
                        <td className="p-3 text-[#545b64]">{c.frequency}</td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-[#edfbf0] text-[#1d8102]">
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteInventoryConfig(c.id)}
                            className="text-[#d13212] hover:underline text-[12px] font-medium"
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
        </div>
      )}

      {/* MODAL: Create Folder */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Create folder</h3>
            <p className="text-[13px] text-[#545b64]">
              Folders allow you to group objects in your bucket logically.
            </p>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Folder name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. photos or documents"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                >
                  Create folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Versioning */}
      {showVersioningModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Edit Bucket Versioning</h3>
            <p className="text-[13px] text-[#545b64]">
              Once you enable versioning, you can never return to an unversioned state. You can,
              however, suspend versioning on that bucket.
            </p>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer text-[13px]">
                <input
                  type="radio"
                  name="versioning"
                  checked={newVersioningStatus === "Enabled"}
                  onChange={() => setNewVersioningStatus("Enabled")}
                  className="text-[#0972d3]"
                />
                <span className="font-semibold text-[#16191f]">Enable versioning</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer text-[13px]">
                <input
                  type="radio"
                  name="versioning"
                  checked={newVersioningStatus === "Suspended"}
                  onChange={() => setNewVersioningStatus("Suspended")}
                  className="text-[#0972d3]"
                />
                <span className="font-semibold text-[#16191f]">Suspend versioning</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowVersioningModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVersioning}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Encryption */}
      {showEncryptionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Edit default encryption</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Encryption type
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer text-[13px]">
                    <input
                      type="radio"
                      name="enc"
                      checked={encAlgo === "AES256"}
                      onChange={() => setEncAlgo("AES256")}
                      className="mt-0.5 text-[#0972d3]"
                    />
                    <div>
                      <span className="font-semibold text-[#16191f]">
                        Amazon S3 managed keys (SSE-S3)
                      </span>
                      <div className="text-[12px] text-[#545b64]">
                        Encrypts each object with a unique AES-256 key managed by Amazon S3.
                      </div>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer text-[13px]">
                    <input
                      type="radio"
                      name="enc"
                      checked={encAlgo === "aws:kms"}
                      onChange={() => setEncAlgo("aws:kms")}
                      className="mt-0.5 text-[#0972d3]"
                    />
                    <div>
                      <span className="font-semibold text-[#16191f]">
                        AWS Key Management Service key (SSE-KMS)
                      </span>
                      <div className="text-[12px] text-[#545b64]">
                        Encrypts objects using a KMS key that you manage or an AWS managed key.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {encAlgo === "aws:kms" && (
                <div className="space-y-2">
                  <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                    AWS KMS key ARN or alias
                  </label>
                  {kmsKeys.length > 0 && (
                    <select
                      value={kmsKeyIdInput}
                      onChange={(e) => setKmsKeyIdInput(e.target.value)}
                      className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white mb-2"
                    >
                      <option value="alias/aws/s3">AWS managed key (aws/s3)</option>
                      {kmsKeys.map((k) => (
                        <option key={k.keyId} value={k.keyArn || k.keyId}>
                          {k.alias ? `${k.alias} (${k.keyId})` : k.keyId}
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    placeholder="alias/aws/s3 or custom key ARN"
                    value={kmsKeyIdInput}
                    onChange={(e) => setKmsKeyIdInput(e.target.value)}
                    className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                  />
                  {kmsKeys.length === 0 && (
                    <div className="text-[12px] text-[#545b64]">
                      <Link href="/kms/keys/create" className="text-[#0972d3] hover:underline">
                        Create a customer managed key in AWS KMS
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="checkbox"
                    checked={bucketKeyToggle}
                    onChange={(e) => setBucketKeyToggle(e.target.checked)}
                    className="text-[#0972d3] rounded"
                  />
                  <span className="font-semibold text-[#16191f]">Bucket Key</span>
                </label>
                <p className="text-[12px] text-[#545b64] ml-6">
                  Decreases encryption costs by reducing KMS request traffic.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowEncryptionModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEncryption}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Block Public Access */}
      {showPabModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Edit Block Public Access settings
            </h3>

            <div className="space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pabBlockAll}
                  onChange={(e) => {
                    setPabBlockAll(e.target.checked);
                    if (e.target.checked) {
                      setPabBlockAcls(true);
                      setPabIgnoreAcls(true);
                      setPabBlockPolicy(true);
                      setPabRestrictBuckets(true);
                    }
                  }}
                  className="mt-1 text-[#0972d3] rounded"
                />
                <div>
                  <div className="font-bold text-[13px] text-[#16191f]">
                    Block all public access
                  </div>
                  <div className="text-[12px] text-[#545b64]">
                    Turning on this setting enables all four settings below.
                  </div>
                </div>
              </label>

              <div className="border-t border-[#eaeded] pt-3 space-y-2 ml-4">
                <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                  <input
                    type="checkbox"
                    checked={pabBlockAcls}
                    onChange={(e) => setPabBlockAcls(e.target.checked)}
                    disabled={pabBlockAll}
                    className="text-[#0972d3] rounded"
                  />
                  <span>Block public access granted through new ACLs</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                  <input
                    type="checkbox"
                    checked={pabIgnoreAcls}
                    onChange={(e) => setPabIgnoreAcls(e.target.checked)}
                    disabled={pabBlockAll}
                    className="text-[#0972d3] rounded"
                  />
                  <span>Block public access granted through any ACLs</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                  <input
                    type="checkbox"
                    checked={pabBlockPolicy}
                    onChange={(e) => setPabBlockPolicy(e.target.checked)}
                    disabled={pabBlockAll}
                    className="text-[#0972d3] rounded"
                  />
                  <span>Block public access granted through new public policies</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                  <input
                    type="checkbox"
                    checked={pabRestrictBuckets}
                    onChange={(e) => setPabRestrictBuckets(e.target.checked)}
                    disabled={pabBlockAll}
                    className="text-[#0972d3] rounded"
                  />
                  <span>Block public access through public policies</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowPabModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePab}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Tags */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Edit bucket tags</h3>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Key"
                value={tagKey}
                onChange={(e) => setTagKey(e.target.value)}
                className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded flex-1"
              />
              <input
                type="text"
                placeholder="Value"
                value={tagVal}
                onChange={(e) => setTagVal(e.target.value)}
                className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded flex-1"
              />
              <button
                type="button"
                onClick={handleAddTag}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white hover:bg-[#f2f8fd]"
              >
                Add
              </button>
            </div>

            <div className="border border-[#eaeded] rounded overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                  <tr>
                    <th className="p-2">Key</th>
                    <th className="p-2">Value</th>
                    <th className="p-2 w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {tagsList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-[#545b64]">
                        No tags added.
                      </td>
                    </tr>
                  ) : (
                    tagsList.map((t, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium">{t.key}</td>
                        <td className="p-2 text-[#545b64]">{t.value}</td>
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(idx)}
                            className="text-[#d13212] hover:underline"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowTagModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTags}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create Lifecycle Rule */}
      {showLifecycleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-[18px] font-bold text-[#16191f]">Create lifecycle rule</h3>
            <p className="text-[13px] text-[#545b64]">
              Define rules to automatically manage object storage lifecycle, transitions, and expiration.
            </p>

            <form onSubmit={handleCreateLifecycleRule} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Lifecycle rule name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ArchiveLogsAfter90Days"
                  value={lifecycleRuleId}
                  onChange={(e) => setLifecycleRuleId(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Choose a rule scope
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                    <input
                      type="radio"
                      name="scope"
                      checked={lifecycleScopeType === "all"}
                      onChange={() => setLifecycleScopeType("all")}
                      className="text-[#0972d3]"
                    />
                    <span>Apply to all objects in the bucket</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                    <input
                      type="radio"
                      name="scope"
                      checked={lifecycleScopeType === "prefix"}
                      onChange={() => setLifecycleScopeType("prefix")}
                      className="text-[#0972d3]"
                    />
                    <span>Limit the scope using a prefix filter</span>
                  </label>
                </div>

                {lifecycleScopeType === "prefix" && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="e.g. logs/ or archive/"
                      value={lifecyclePrefix}
                      onChange={(e) => setLifecyclePrefix(e.target.value)}
                      className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-[#eaeded] pt-3 space-y-3">
                <label className="block text-[13px] font-semibold text-[#16191f]">
                  Lifecycle rule actions
                </label>

                {/* Transition Action */}
                <div className="p-3 border border-[#eaeded] rounded space-y-2 bg-[#fafafa]">
                  <label className="flex items-center gap-2 cursor-pointer text-[13px] font-semibold text-[#16191f]">
                    <input
                      type="checkbox"
                      checked={enableTransition}
                      onChange={(e) => setEnableTransition(e.target.checked)}
                      className="text-[#0972d3] rounded"
                    />
                    <span>Move current versions of objects between storage classes</span>
                  </label>

                  {enableTransition && (
                    <div className="grid grid-cols-2 gap-3 pl-6 pt-2">
                      <div>
                        <label className="block text-[12px] text-[#545b64] mb-1">
                          Transition after (days)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={transitionDays}
                          onChange={(e) => setTransitionDays(Number(e.target.value))}
                          className="w-full text-[13px] px-3 py-1 border border-[#aab7b8] rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] text-[#545b64] mb-1">
                          Target storage class
                        </label>
                        <select
                          value={transitionStorageClass}
                          onChange={(e) => setTransitionStorageClass(e.target.value)}
                          className="w-full text-[13px] px-3 py-1 border border-[#aab7b8] rounded bg-white"
                        >
                          <option value="STANDARD_IA">Standard-IA</option>
                          <option value="INTELLIGENT_TIERING">Intelligent-Tiering</option>
                          <option value="GLACIER">Glacier Flexible Retrieval</option>
                          <option value="DEEP_ARCHIVE">Glacier Deep Archive</option>
                          <option value="ONEZONE_IA">One Zone-IA</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expiration Action */}
                <div className="p-3 border border-[#eaeded] rounded space-y-2 bg-[#fafafa]">
                  <label className="flex items-center gap-2 cursor-pointer text-[13px] font-semibold text-[#16191f]">
                    <input
                      type="checkbox"
                      checked={enableExpiration}
                      onChange={(e) => setEnableExpiration(e.target.checked)}
                      className="text-[#0972d3] rounded"
                    />
                    <span>Expire current versions of objects</span>
                  </label>

                  {enableExpiration && (
                    <div className="pl-6 pt-2">
                      <label className="block text-[12px] text-[#545b64] mb-1">
                        Days after object creation
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={expirationDays}
                        onChange={(e) => setExpirationDays(Number(e.target.value))}
                        className="w-40 text-[13px] px-3 py-1 border border-[#aab7b8] rounded bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowLifecycleModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                >
                  Create rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create Replication Rule */}
      {showReplicationModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Create replication rule</h3>
            <p className="text-[13px] text-[#545b64]">
              Replicate objects automatically to a destination bucket in another region (CRR) or the same region (SRR).
            </p>

            <form onSubmit={handleCreateReplicationRule} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Replication rule name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ReplicateToBackup"
                  value={repRuleName}
                  onChange={(e) => setRepRuleName(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Destination bucket
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. my-backup-bucket"
                  value={repDestBucket}
                  onChange={(e) => setRepDestBucket(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowReplicationModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                >
                  Create rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create Inventory Configuration */}
      {showInventoryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Create inventory configuration</h3>
            <p className="text-[13px] text-[#545b64]">
              Generate a scheduled CSV or ORC report of your objects and their metadata.
            </p>

            <form onSubmit={handleCreateInventoryConfig} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Inventory configuration ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. weekly-audit-report"
                  value={invConfigId}
                  onChange={(e) => setInvConfigId(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Destination bucket
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. audit-reports-bucket"
                  value={invDestBucket}
                  onChange={(e) => setInvDestBucket(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Frequency
                </label>
                <select
                  value={invFrequency}
                  onChange={(e) => setInvFrequency(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded bg-white"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowInventoryModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                >
                  Create configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Server Access Logging */}
      {showLoggingModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Edit server access logging</h3>
            <p className="text-[13px] text-[#545b64]">
              Server access logging provides detailed records for the requests that are made to a bucket.
            </p>

            <form onSubmit={handleSaveLogging} className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="logging"
                    checked={!loggingEnabled}
                    onChange={() => setLoggingEnabled(false)}
                    className="text-[#0972d3]"
                  />
                  <span>Disable</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="logging"
                    checked={loggingEnabled}
                    onChange={() => setLoggingEnabled(true)}
                    className="text-[#0972d3]"
                  />
                  <span>Enable</span>
                </label>
              </div>

              {loggingEnabled && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#16191f] mb-1">
                      Target bucket
                    </label>
                    <input
                      type="text"
                      required
                      value={targetLoggingBucket}
                      onChange={(e) => setTargetLoggingBucket(e.target.value)}
                      className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#16191f] mb-1">
                      Target prefix
                    </label>
                    <input
                      type="text"
                      value={targetLoggingPrefix}
                      onChange={(e) => setTargetLoggingPrefix(e.target.value)}
                      className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowLoggingModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create Event Notification */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Create event notification</h3>
            <p className="text-[13px] text-[#545b64]">
              Receive notifications when specified events occur in your bucket.
            </p>

            <form onSubmit={handleSaveNotification} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Event name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. upload-trigger"
                  value={notifName}
                  onChange={(e) => setNotifName(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Event types
                </label>
                <div className="space-y-1.5 text-[13px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifEvents.includes("s3:ObjectCreated:*")}
                      onChange={(e) => {
                        if (e.target.checked) setNotifEvents([...notifEvents, "s3:ObjectCreated:*"]);
                        else setNotifEvents(notifEvents.filter((ev) => ev !== "s3:ObjectCreated:*"));
                      }}
                      className="text-[#0972d3] rounded"
                    />
                    <span>All object create events</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifEvents.includes("s3:ObjectRemoved:*")}
                      onChange={(e) => {
                        if (e.target.checked) setNotifEvents([...notifEvents, "s3:ObjectRemoved:*"]);
                        else setNotifEvents(notifEvents.filter((ev) => ev !== "s3:ObjectRemoved:*"));
                      }}
                      className="text-[#0972d3] rounded"
                    />
                    <span>All object removal events</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Destination
                </label>
                <select
                  value={notifDest}
                  onChange={(e) => setNotifDest(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded bg-white"
                >
                  <option value="Lambda function">Lambda function</option>
                  <option value="SNS topic">SNS topic</option>
                  <option value="SQS queue">SQS queue</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowNotificationModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Transfer Acceleration */}
      {showAccelerateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Edit Transfer Acceleration</h3>
            <p className="text-[13px] text-[#545b64]">
              Enable fast, secure transfers of files over long distances using AWS edge locations.
            </p>

            <form onSubmit={handleSaveAccelerate} className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="accel"
                    checked={accelerateStatus === "Suspended"}
                    onChange={() => setAccelerateStatus("Suspended")}
                    className="text-[#0972d3]"
                  />
                  <span>Suspend</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="accel"
                    checked={accelerateStatus === "Enabled"}
                    onChange={() => setAccelerateStatus("Enabled")}
                    className="text-[#0972d3]"
                  />
                  <span>Enable</span>
                </label>
              </div>

              {accelerateStatus === "Enabled" && (
                <div className="p-3 bg-[#f2f8fd] border border-[#0972d3]/30 rounded text-[12px] text-[#545b64]">
                  Accelerated endpoint: <code className="text-[#0972d3] font-mono">https://{bucket.name}.s3-accelerate.amazonaws.com</code>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowAccelerateModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Object Lock */}
      {showObjectLockModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Edit Object Lock</h3>
            <p className="text-[13px] text-[#545b64]">
              Object Lock prevents objects from being deleted or overwritten for a fixed period or indefinitely.
            </p>

            <form onSubmit={handleSaveObjectLock} className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="lock"
                    checked={!objectLockEnabled}
                    onChange={() => setObjectLockEnabled(false)}
                    className="text-[#0972d3]"
                  />
                  <span>Disable</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="lock"
                    checked={objectLockEnabled}
                    onChange={() => setObjectLockEnabled(true)}
                    className="text-[#0972d3]"
                  />
                  <span>Enable</span>
                </label>
              </div>

              {objectLockEnabled && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#16191f] mb-1">
                      Default retention mode
                    </label>
                    <div className="space-y-1.5 text-[13px]">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="mode"
                          checked={objectLockMode === "GOVERNANCE"}
                          onChange={() => setObjectLockMode("GOVERNANCE")}
                          className="text-[#0972d3]"
                        />
                        <div>
                          <span className="font-semibold text-[#16191f]">Governance mode</span>
                          <p className="text-[11px] text-[#545b64]">Users with special permissions can overwrite or delete.</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="mode"
                          checked={objectLockMode === "COMPLIANCE"}
                          onChange={() => setObjectLockMode("COMPLIANCE")}
                          className="text-[#0972d3]"
                        />
                        <div>
                          <span className="font-semibold text-[#16191f]">Compliance mode</span>
                          <p className="text-[11px] text-[#545b64]">No user, including root, can delete protected versions.</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#16191f] mb-1">
                      Retention period (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={objectLockDays}
                      onChange={(e) => setObjectLockDays(Number(e.target.value))}
                      className="w-28 text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowObjectLockModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Requester Pays */}
      {showRequesterPaysModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Edit Requester pays</h3>
            <p className="text-[13px] text-[#545b64]">
              When enabled, the requester pays for requests and data transfer costs for downloads.
            </p>

            <form onSubmit={handleSaveRequesterPays} className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="reqpay"
                    checked={!requesterPaysEnabled}
                    onChange={() => setRequesterPaysEnabled(false)}
                    className="text-[#0972d3]"
                  />
                  <span>Disable</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="reqpay"
                    checked={requesterPaysEnabled}
                    onChange={() => setRequesterPaysEnabled(true)}
                    className="text-[#0972d3]"
                  />
                  <span>Enable</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowRequesterPaysModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Static Website Hosting */}
      {showWebsiteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Edit static website hosting</h3>
            <p className="text-[13px] text-[#545b64]">
              Host a static website using this S3 bucket with custom index and error documents.
            </p>

            <form onSubmit={handleSaveWebsite} className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="website"
                    checked={!websiteEnabled}
                    onChange={() => setWebsiteEnabled(false)}
                    className="text-[#0972d3]"
                  />
                  <span>Disable</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="website"
                    checked={websiteEnabled}
                    onChange={() => setWebsiteEnabled(true)}
                    className="text-[#0972d3]"
                  />
                  <span>Enable</span>
                </label>
              </div>

              {websiteEnabled && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#16191f] mb-1">
                      Index document
                    </label>
                    <input
                      type="text"
                      required
                      value={websiteIndexDoc}
                      onChange={(e) => setWebsiteIndexDoc(e.target.value)}
                      className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#16191f] mb-1">
                      Error document (optional)
                    </label>
                    <input
                      type="text"
                      value={websiteErrorDoc}
                      onChange={(e) => setWebsiteErrorDoc(e.target.value)}
                      className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowWebsiteModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Object Ownership */}
      {showOwnershipModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Edit Object Ownership</h3>
            <p className="text-[13px] text-[#545b64]">
              Control ownership of objects written to this bucket and disable or enable access control lists (ACLs).
            </p>

            <form onSubmit={handleSaveOwnership} className="space-y-3">
              <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fbfbfb]">
                <input
                  type="radio"
                  name="ownership"
                  checked={ownershipMode === "BucketOwnerEnforced"}
                  onChange={() => setOwnershipMode("BucketOwnerEnforced")}
                  className="mt-1 text-[#0972d3]"
                />
                <div>
                  <div className="font-semibold text-[13px] text-[#16191f]">
                    ACLs disabled (recommended)
                  </div>
                  <div className="text-[12px] text-[#545b64]">
                    All objects in this bucket are owned by this account. Access is specified using policies only.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fbfbfb]">
                <input
                  type="radio"
                  name="ownership"
                  checked={ownershipMode === "BucketOwnerPreferred"}
                  onChange={() => setOwnershipMode("BucketOwnerPreferred")}
                  className="mt-1 text-[#0972d3]"
                />
                <div>
                  <div className="font-semibold text-[13px] text-[#16191f]">
                    Bucket owner preferred
                  </div>
                  <div className="text-[12px] text-[#545b64]">
                    Objects uploaded with bucket-owner-full-control ACL are owned by the bucket owner.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fbfbfb]">
                <input
                  type="radio"
                  name="ownership"
                  checked={ownershipMode === "ObjectWriter"}
                  onChange={() => setOwnershipMode("ObjectWriter")}
                  className="mt-1 text-[#0972d3]"
                />
                <div>
                  <div className="font-semibold text-[13px] text-[#16191f]">
                    Object writer
                  </div>
                  <div className="text-[12px] text-[#545b64]">
                    The object writer remains the object owner.
                  </div>
                </div>
              </label>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowOwnershipModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
