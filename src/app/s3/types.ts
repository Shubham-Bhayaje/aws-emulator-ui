/**
 * src/app/s3/types.ts – TypeScript types for AWS S3.
 */

export interface S3BucketSummary {
  name: string;
  region: string;
  created: string;
  access: "Bucket and objects not public" | "Public" | "Objects can be public";
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
}

export interface S3ObjectSummary {
  key: string;
  name: string;
  size: number;
  lastModified: string;
  storageClass: string;
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
  metadata: Record<string, string>;
}
