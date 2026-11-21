export interface RetentionProperties {
  MemoryStoreRetentionPeriodInHours: number;
  MagneticStoreRetentionPeriodInDays: number;
}

export interface MagneticStoreWriteProperties {
  EnableMagneticStoreWrites?: boolean;
  MagneticStoreRejectedDataLocation?: {
    S3Configuration?: {
      BucketName?: string;
      ObjectKeyPrefix?: string;
      EncryptionOption?: "SSE_S3" | "SSE_KMS";
      KmsKeyId?: string;
    };
  };
}

export interface DatabaseSummary {
  Arn: string;
  DatabaseName: string;
  TableCount: number;
  KmsKeyId: string;
  CreationTime?: string;
  LastUpdatedTime?: string;
}

export interface TableSummary {
  Arn: string;
  TableName: string;
  DatabaseName: string;
  TableStatus: "CREATING" | "UPDATING" | "ACTIVE" | "DELETING";
  RetentionProperties?: RetentionProperties;
  MagneticStoreWriteProperties?: MagneticStoreWriteProperties;
  CreationTime?: string;
  LastUpdatedTime?: string;
}

export interface KmsKeyOption {
  KeyId: string;
  KeyArn: string;
  AliasName?: string;
  Description?: string;
}

export interface DimensionInput {
  Name: string;
  Value: string;
  DimensionValueType?: "VARCHAR";
}

export interface RecordInput {
  MeasureName: string;
  MeasureValue: string;
  MeasureValueType: "DOUBLE" | "BIGINT" | "VARCHAR" | "BOOLEAN";
  Time?: string;
  TimeUnit?: "MILLISECONDS" | "SECONDS" | "MICROSECONDS" | "NANOSECONDS";
  Dimensions?: DimensionInput[];
}
