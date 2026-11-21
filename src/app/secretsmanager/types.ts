/**
 * src/app/secretsmanager/types.ts – TypeScript Interfaces for AWS Secrets Manager.
 */

export interface SecretTag {
  key: string;
  value: string;
}

export interface SecretSummary {
  arn: string;
  name: string;
  description?: string;
  kmsKeyId?: string;
  rotationEnabled: boolean;
  rotationLambdaArn?: string;
  rotationRules?: {
    automaticallyAfterDays?: number;
  };
  lastRotatedDate?: string;
  lastChangedDate?: string;
  lastAccessedDate?: string;
  deletedDate?: string;
  tags: SecretTag[];
  secretVersionsToStages?: Record<string, string[]>;
  createdDate?: string;
  status: "Active" | "ScheduledForDeletion";
  daysUntilDeletion?: number;
}

export interface SecretDetail extends SecretSummary {
  resourcePolicy?: string;
  primaryRegion?: string;
}

export interface SecretVersionItem {
  versionId: string;
  versionStages: string[];
  createdDate?: string;
  lastAccessedDate?: string;
}

export interface CreateSecretInput {
  name: string;
  description?: string;
  secretString: string;
  kmsKeyId?: string;
  tags?: SecretTag[];
  rotationEnabled?: boolean;
  rotationDays?: number;
  rotationLambdaArn?: string;
}

export interface KmsKeyOption {
  keyId: string;
  keyArn: string;
  alias?: string;
  description?: string;
}
