/**
 * src/app/s3/types.ts – TypeScript types for AWS S3.
 */

export interface S3BucketSummary {
  name: string;
  region: string;
  created: string;
  access: "Bucket and objects not public" | "Public" | "Objects can be public";
}

export interface S3LifecycleRule {
  id: string;
  status: "Enabled" | "Disabled";
  prefix?: string;
  transitions?: Array<{
    days: number;
    storageClass: string;
  }>;
  expirationDays?: number;
  abortIncompleteMultipartUploadDays?: number;
}

export interface S3BucketDetail {
  name: string;
  arn: string;
  region: string;
  creationDate: string;
  versioningStatus: "Enabled" | "Suspended" | "Disabled";
  encryption: {
    sseAlgorithm: string;
    kmsKeyId?: string;
    bucketKeyEnabled: boolean;
  };
  publicAccessBlock: {
    blockPublicAcls: boolean;
    ignorePublicAcls: boolean;
    blockPublicPolicy: boolean;
    restrictPublicBuckets: boolean;
  };
  policy?: string;
  cors?: string;
  tags: Array<{ key: string; value: string }>;
  objectCount: number;
  totalSizeBytes: number;
  lifecycleRules: S3LifecycleRule[];
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

export interface S3AccessPoint {
  name: string;
  bucket: string;
  networkOrigin: "Internet" | "VPC";
  vpcId?: string;
  status: "Active";
  creationDate: string;
  arn: string;
}

export interface S3MultiRegionAccessPoint {
  name: string;
}

export interface KmsKeyOption {
  keyId: string;
  keyArn: string;
  alias?: string;
}
  alias: string;
  status: "Ready" | "Creating" | "Deleting";
  createdAt: string;
  arn: string;
  buckets: string[];
  blockAllPublic: boolean;
}

export interface S3BatchJob {
  id: string;
  description: string;
  operation: string;
  status: "Active" | "Complete" | "Failed" | "Cancelled";
  priority: number;
  creationTime: string;
  completionTime?: string;
}

export interface S3ObjectSummary {
  key: string;
  name: string;
  size: number;
  lastModified: string;
  storageClass: string;
  versionId?: string;
  isLatest?: boolean;
  isDeleteMarker?: boolean;
}

export interface S3ObjectDetail {
  key: string;
  bucket: string;
  arn: string;
  s3Uri: string;
  size: number;
  lastModified: string;
  eTag: string;
  contentType: string;
  storageClass: string;
  serverSideEncryption?: string;
  ssekmsKeyId?: string;
  versionId?: string;
  metadata: Record<string, string>;
}
