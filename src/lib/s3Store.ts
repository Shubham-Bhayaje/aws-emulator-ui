/**
 * src/lib/s3Store.ts – State management & persistence for extended S3 features.
 * Persists S3 Access Points, Multi-Region Access Points, Batch Operations jobs,
 * and bucket configuration properties (Logging, Website, Accelerate, Object Lock,
 * Request Payment, Ownership Controls, Notifications, Replication, Inventory).
 * Zero emojis, Cloudscape enterprise standard.
 */

import fs from "fs";
import path from "path";
import type {
  S3AccessPoint,
  S3MultiRegionAccessPoint,
  S3BatchJob,
  S3BucketDetail,
} from "@/app/s3/types";

export interface BucketExtendedConfig {
  logging?: {
    enabled: boolean;
    targetBucket?: string;
    targetPrefix?: string;
  };
  website?: {
    enabled: boolean;
    indexDocument?: string;
    errorDocument?: string;
  };
  accelerate?: {
    status: "Enabled" | "Suspended";
  };
  objectLock?: {
    enabled: boolean;
    mode?: "GOVERNANCE" | "COMPLIANCE";
    days?: number;
  };
  requestPayment?: {
    payer: "Requester" | "BucketOwner";
  };
  ownershipControls?: {
    ownership: "BucketOwnerEnforced" | "BucketOwnerPreferred" | "ObjectWriter";
  };
  notifications?: Array<{
    name: string;
    events: string[];
    destination: string;
  }>;
  replicationRules?: Array<{
    name: string;
    destination: string;
    status: string;
  }>;
  inventoryConfigs?: Array<{
    id: string;
    destination: string;
    frequency: string;
    status: string;
  }>;
}

export interface S3ExtendedState {
  accessPoints: S3AccessPoint[];
  multiRegionAccessPoints: S3MultiRegionAccessPoint[];
  batchJobs: S3BatchJob[];
  bucketConfigs: Record<string, BucketExtendedConfig>;
}

const DATA_FILE = path.join(process.cwd(), "data", "s3_extended_state.json");

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

function getDefaultState(): S3ExtendedState {
  return {
    accessPoints: [],
    multiRegionAccessPoints: [],
    batchJobs: [],
    bucketConfigs: {},
  };
}

export function getS3ExtendedState(): S3ExtendedState {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const def = getDefaultState();
      ensureDirectoryExistence(DATA_FILE);
      fs.writeFileSync(DATA_FILE, JSON.stringify(def, null, 2), "utf-8");
      return def;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading s3_extended_state.json:", err);
    return getDefaultState();
  }
}

export function saveS3ExtendedState(state: S3ExtendedState): void {
  try {
    ensureDirectoryExistence(DATA_FILE);
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving s3_extended_state.json:", err);
  }
}

// --- Bucket Extended Configs ---
export function getBucketExtendedConfig(bucketName: string): BucketExtendedConfig {
  const state = getS3ExtendedState();
  return state.bucketConfigs[bucketName] || {};
}

export function saveBucketExtendedConfig(
  bucketName: string,
  partial: Partial<BucketExtendedConfig>
): void {
  const state = getS3ExtendedState();
  const current = state.bucketConfigs[bucketName] || {};
  state.bucketConfigs[bucketName] = {
    ...current,
    ...partial,
  };
  saveS3ExtendedState(state);
}

// --- Access Points ---
export function listStoredAccessPoints(): S3AccessPoint[] {
  const state = getS3ExtendedState();
  return state.accessPoints || [];
}

export function createStoredAccessPoint(ap: Omit<S3AccessPoint, "arn" | "creationDate" | "status">): S3AccessPoint {
  const state = getS3ExtendedState();
  const newAp: S3AccessPoint = {
    ...ap,
    status: "Active",
    creationDate: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    arn: `arn:aws:s3:us-east-1:000000000000:accesspoint/${ap.name}`,
  };
  state.accessPoints = [...(state.accessPoints || []).filter((p) => p.name !== ap.name), newAp];
  saveS3ExtendedState(state);
  return newAp;
}

export function deleteStoredAccessPoint(name: string): void {
  const state = getS3ExtendedState();
  state.accessPoints = (state.accessPoints || []).filter((p) => p.name !== name);
  saveS3ExtendedState(state);
}

// --- Multi-Region Access Points ---
export function listStoredMultiRegionAccessPoints(): S3MultiRegionAccessPoint[] {
  const state = getS3ExtendedState();
  return state.multiRegionAccessPoints || [];
}

export function createStoredMultiRegionAccessPoint(
  mrap: Omit<S3MultiRegionAccessPoint, "alias" | "status" | "createdAt" | "arn">
): S3MultiRegionAccessPoint {
  const state = getS3ExtendedState();
  const cleanName = mrap.name.toLowerCase();
  const newMrap: S3MultiRegionAccessPoint = {
    ...mrap,
    name: cleanName,
    alias: `${cleanName.slice(0, 10)}.${Math.random().toString(36).substring(2, 6)}.mrap.accesspoint.s3-global.amazonaws.com`,
    status: "Ready",
    createdAt: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    arn: `arn:aws:s3::000000000000:accesspoint/${cleanName}`,
  };
  state.multiRegionAccessPoints = [
    ...(state.multiRegionAccessPoints || []).filter((p) => p.name !== cleanName),
    newMrap,
  ];
  saveS3ExtendedState(state);
  return newMrap;
}

export function deleteStoredMultiRegionAccessPoint(name: string): void {
  const state = getS3ExtendedState();
  state.multiRegionAccessPoints = (state.multiRegionAccessPoints || []).filter((p) => p.name !== name);
  saveS3ExtendedState(state);
}

// --- Batch Jobs ---
export function listStoredBatchJobs(): S3BatchJob[] {
  const state = getS3ExtendedState();
  return state.batchJobs || [];
}

export function createStoredBatchJob(
  job: Omit<S3BatchJob, "id" | "status" | "creationTime">
): S3BatchJob {
  const state = getS3ExtendedState();
  const newJob: S3BatchJob = {
    ...job,
    id: `job-${Math.random().toString(36).substring(2, 10)}`,
    status: "Active",
    creationTime: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };
  state.batchJobs = [newJob, ...(state.batchJobs || [])];
  saveS3ExtendedState(state);
  return newJob;
}

export function cancelStoredBatchJob(id: string): void {
  const state = getS3ExtendedState();
  state.batchJobs = (state.batchJobs || []).map((j) =>
    j.id === id ? { ...j, status: "Cancelled" as const } : j
  );
  saveS3ExtendedState(state);
}

export function deleteStoredBatchJob(id: string): void {
  const state = getS3ExtendedState();
  state.batchJobs = (state.batchJobs || []).filter((j) => j.id !== id);
  saveS3ExtendedState(state);
}
