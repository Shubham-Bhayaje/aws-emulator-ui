export interface KeyspaceSummary {
  keyspaceName: string;
  resourceArn: string;
  replicationStrategy: "SINGLE_REGION" | "MULTI_REGION" | string;
  replicationRegions?: string[];
  isSystem?: boolean;
}

export interface KeyspaceDetail {
  keyspaceName: string;
  resourceArn: string;
  replicationStrategy: string;
  replicationRegions?: string[];
  tablesCount?: number;
  tags?: Record<string, string>;
  isSystem?: boolean;
}

export interface ColumnDefinition {
  name: string;
  type: string;
}

export interface PartitionKey {
  name: string;
}

export interface ClusteringKey {
  name: string;
  orderBy: "ASC" | "DESC";
}

export interface SchemaDefinition {
  allColumns: ColumnDefinition[];
  partitionKeys: PartitionKey[];
  clusteringKeys: ClusteringKey[];
  staticColumns?: { name: string }[];
}

export interface CapacitySpecification {
  throughputMode: "PAY_PER_REQUEST" | "PROVISIONED" | string;
  readCapacityUnits?: number;
  writeCapacityUnits?: number;
  lastUpdateToPayPerRequestTimestamp?: string;
}

export interface EncryptionSpecification {
  type: "AWS_OWNED_KMS_KEY" | "CUSTOMER_MANAGED_KMS_KEY" | string;
  kmsKeyIdentifier?: string;
}

export interface PointInTimeRecovery {
  status: "ENABLED" | "DISABLED" | string;
  earliestRestorableTimestamp?: string;
}

export interface TableSummary {
  keyspaceName: string;
  tableName: string;
  resourceArn: string;
}

export interface TableDetail {
  keyspaceName: string;
  tableName: string;
  resourceArn: string;
  creationTimestamp?: string;
  status: "ACTIVE" | "CREATING" | "UPDATING" | "DELETING" | "DELETED" | "RESTORING" | string;
  schemaDefinition: SchemaDefinition;
  capacitySpecification: CapacitySpecification;
  encryptionSpecification?: EncryptionSpecification;
  pointInTimeRecovery?: PointInTimeRecovery;
  defaultTimeToLive?: number;
  comment?: { message?: string };
  tags?: Record<string, string>;
}

export interface KmsKeyOption {
  KeyId: string;
  KeyArn: string;
  AliasName?: string;
}
