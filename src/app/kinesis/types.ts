export interface StreamSummaryItem {
  StreamName: string;
  StreamARN: string;
  StreamStatus: "CREATING" | "DELETING" | "ACTIVE" | "UPDATING" | string;
  StreamMode: "PROVISIONED" | "ON_DEMAND";
  OpenShardCount: number;
  RetentionPeriodHours: number;
  EncryptionType: "NONE" | "KMS" | string;
  KeyId?: string;
  StreamCreationTimestamp?: string;
  ConsumerCount?: number;
}

export interface StreamDetail {
  StreamName: string;
  StreamARN: string;
  StreamStatus: "CREATING" | "DELETING" | "ACTIVE" | "UPDATING" | string;
  StreamMode: "PROVISIONED" | "ON_DEMAND";
  OpenShardCount: number;
  RetentionPeriodHours: number;
  EncryptionType: "NONE" | "KMS" | string;
  KeyId?: string;
  StreamCreationTimestamp?: string;
  ConsumerCount: number;
  EnhancedMonitoring: string[];
  WarmThroughput?: {
    TargetMiBps?: number;
    CurrentMiBps?: number;
  };
  MaxRecordSizeInKiB?: number;
  Tags: { Key: string; Value: string }[];
}

export interface ShardItem {
  ShardId: string;
  StartingHashKey: string;
  EndingHashKey: string;
  StartingSequenceNumber: string;
  EndingSequenceNumber?: string;
  ParentShardId?: string;
  AdjacentParentShardId?: string;
}

export interface ConsumerItem {
  ConsumerName: string;
  ConsumerARN: string;
  ConsumerStatus: "CREATING" | "DELETING" | "ACTIVE" | string;
  ConsumerCreationTimestamp?: string;
}

export interface RecordItem {
  SequenceNumber: string;
  ApproximateArrivalTimestamp?: string;
  Data: string; // Base64
  DataText: string; // Decoded UTF-8
  PartitionKey: string;
  EncryptionType?: string;
}

export interface KmsKeyOption {
  KeyId: string;
  Arn: string;
  AliasName?: string;
  Description?: string;
}
