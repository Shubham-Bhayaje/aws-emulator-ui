export interface GlacierVaultSummary {
  VaultARN: string;
  VaultName: string;
  CreationDate: string;
  LastInventoryDate?: string;
  NumberOfArchives: number;
  SizeInBytes: number;
}

export interface GlacierJob {
  JobId: string;
  JobDescription?: string;
  Action: "ArchiveRetrieval" | "InventoryRetrieval" | string;
  ArchiveId?: string;
  VaultARN: string;
  CreationDate: string;
  Completed: boolean;
  StatusCode: "InProgress" | "Succeeded" | "Failed" | string;
  StatusMessage?: string;
  ArchiveSizeInBytes?: number;
  InventorySizeInBytes?: number;
  CompletionDate?: string;
  Tier?: string;
  ArchiveSHA256TreeHash?: string;
  RetrievalByteRange?: string;
  SHA256TreeHash?: string;
}

export interface GlacierArchive {
  ArchiveId: string;
  ArchiveDescription?: string;
  CreationDate: string;
  Size: number;
  SHA256TreeHash: string;
}

export interface SnsTopicOption {
  TopicArn: string;
  TopicName: string;
}

export interface DataRetrievalPolicy {
  Strategy: "FreeTier" | "MaxRetrievalRate" | "None";
  BytesPerHour?: number;
}
