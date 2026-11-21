/**
 * src/app/systems-manager/parameter-store/types.ts – TypeScript Interfaces for AWS Systems Manager Parameter Store.
 */

export interface SSMParameterTag {
  key: string;
  value: string;
}

export interface SSMParameterSummary {
  name: string;
  type: "String" | "StringList" | "SecureString";
  keyId?: string;
  lastModifiedDate?: string;
  lastModifiedUser?: string;
  description?: string;
  version: number;
  tier: "Standard" | "Advanced" | "Intelligent-Tiering";
  dataType: string;
}

export interface SSMParameterDetail extends SSMParameterSummary {
  arn: string;
  value: string;
  labels: string[];
  tags: SSMParameterTag[];
}

export interface SSMParameterHistoryItem {
  name: string;
  type: "String" | "StringList" | "SecureString";
  keyId?: string;
  lastModifiedDate?: string;
  lastModifiedUser?: string;
  description?: string;
  value: string;
  version: number;
  labels: string[];
  tier: string;
  dataType: string;
}

export interface PutParameterInput {
  name: string;
  description?: string;
  value: string;
  type: "String" | "StringList" | "SecureString";
  keyId?: string;
  overwrite?: boolean;
  tier?: "Standard" | "Advanced";
  dataType?: string;
  tags?: SSMParameterTag[];
}

export interface KmsKeyOption {
  keyId: string;
  keyArn: string;
  alias?: string;
  description?: string;
}
