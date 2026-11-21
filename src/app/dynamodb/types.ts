export interface KeySchemaElement {
  AttributeName: string;
  KeyType: "HASH" | "RANGE";
  AttributeType?: string;
}

export interface AttributeDefinition {
  AttributeName: string;
  AttributeType: "S" | "N" | "B";
}

export interface ProvisionedThroughput {
  ReadCapacityUnits: number;
  WriteCapacityUnits: number;
  NumberOfDecreasesToday?: number;
  LastIncreaseDateTime?: string;
}

export interface GlobalSecondaryIndexSummary {
  IndexName: string;
  KeySchema: KeySchemaElement[];
  ProjectionType: "ALL" | "KEYS_ONLY" | "INCLUDE";
  NonKeyAttributes?: string[];
  IndexStatus: "CREATING" | "UPDATING" | "DELETING" | "ACTIVE";
  ItemCount?: number;
  IndexSizeBytes?: number;
  ProvisionedThroughput?: ProvisionedThroughput;
}

export interface LocalSecondaryIndexSummary {
  IndexName: string;
  KeySchema: KeySchemaElement[];
  ProjectionType: "ALL" | "KEYS_ONLY" | "INCLUDE";
  NonKeyAttributes?: string[];
  ItemCount?: number;
  IndexSizeBytes?: number;
}

export interface TableSummary {
  name: string;
  arn: string;
  status: "ACTIVE" | "CREATING" | "UPDATING" | "DELETING" | "ARCHIVED" | "INACCESSIBLE_ENCRYPTION_CREDENTIALS" | string;
  partitionKey: string;
  partitionKeyType: string;
  sortKey?: string;
  sortKeyType?: string;
  itemCount: number;
  sizeBytes: number;
  creationDateTime?: string;
  billingMode: "PAY_PER_REQUEST" | "PROVISIONED";
  readCapacityUnits?: number;
  writeCapacityUnits?: number;
  deletionProtection?: boolean;
}

export interface TimeToLiveDescription {
  TimeToLiveStatus: "ENABLING" | "DISABLING" | "ENABLED" | "DISABLED";
  AttributeName?: string;
}

export interface ContinuousBackupsDescription {
  ContinuousBackupsStatus: "ENABLED" | "DISABLED";
  PointInTimeRecoveryStatus?: "ENABLED" | "DISABLED";
  EarliestRestorableDateTime?: string;
  LatestRestorableDateTime?: string;
}

export interface StreamSpecification {
  StreamEnabled: boolean;
  StreamViewType?: "NEW_IMAGE" | "OLD_IMAGE" | "NEW_AND_OLD_IMAGES" | "KEYS_ONLY";
  LatestStreamArn?: string;
}

export interface TableDetail extends TableSummary {
  keySchema: KeySchemaElement[];
  attributeDefinitions: AttributeDefinition[];
  globalSecondaryIndexes: GlobalSecondaryIndexSummary[];
  localSecondaryIndexes: LocalSecondaryIndexSummary[];
  sseDescription?: {
    Status?: string;
    SSEType?: "AES256" | "KMS";
    KMSMasterKeyArn?: string;
  };
  timeToLive?: TimeToLiveDescription;
  continuousBackups?: ContinuousBackupsDescription;
  streamSpecification?: StreamSpecification;
  tags: { Key: string; Value: string }[];
}

export interface BackupSummary {
  BackupArn: string;
  BackupName: string;
  BackupSizeBytes: number;
  BackupStatus: "CREATING" | "DELETED" | "AVAILABLE";
  BackupType: "USER" | "SYSTEM" | "AWS_BACKUP";
  BackupCreationDateTime: string;
  TableName: string;
  TableArn: string;
  TableId?: string;
}

export interface ScannedItemAttribute {
  value: any;
  type: string;
}

export interface ScannedItem {
  [attributeName: string]: ScannedItemAttribute;
}

export interface KmsKeyOption {
  KeyId: string;
  Arn: string;
  AliasName?: string;
  Description?: string;
}

export interface LambdaFunctionOption {
  FunctionName: string;
  FunctionArn: string;
  Runtime?: string;
  Handler?: string;
}

export interface S3BucketOption {
  Name: string;
  CreationDate?: string;
}
