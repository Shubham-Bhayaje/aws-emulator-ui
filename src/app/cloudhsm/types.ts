/**
 * src/app/cloudhsm/types.ts – TypeScript type definitions for AWS CloudHSM.
 * Zero emojis, Cloudscape enterprise standard.
 */

export type ClusterState =
  | "CREATE_IN_PROGRESS"
  | "UNINITIALIZED"
  | "INITIALIZE_IN_PROGRESS"
  | "INITIALIZED"
  | "ACTIVE"
  | "UPDATE_IN_PROGRESS"
  | "MODIFY_IN_PROGRESS"
  | "ROLLBACK_IN_PROGRESS"
  | "DEGRADED"
  | "DELETE_IN_PROGRESS"
  | "DELETED";

export type ClusterMode = "FIPS" | "NON_FIPS";

export type HsmState =
  | "CREATE_IN_PROGRESS"
  | "ACTIVE"
  | "DEGRADED"
  | "DELETE_IN_PROGRESS"
  | "DELETED";

export interface HsmSummary {
  hsmId: string;
  clusterId: string;
  state: HsmState | string;
  availabilityZone: string;
  subnetId?: string;
  eniId?: string;
  eniIp?: string;
  hsmType?: string;
}

export interface ClusterCertificates {
  clusterCsr?: string;
  hsmCertificate?: string;
  awsHardwareCertificate?: string;
  manufacturerHardwareCertificate?: string;
  clusterCertificate?: string;
}

export interface ClusterSummary {
  clusterId: string;
  state: ClusterState;
  hsmType: string;
  mode: ClusterMode;
  vpcId?: string;
  securityGroup?: string;
  backupPolicy?: string;
  backupRetentionPolicy?: {
    type?: string;
    value?: string;
  };
  createTimestamp?: string;
  subnetMapping: Record<string, string>;
  hsms: HsmSummary[];
  certificates?: ClusterCertificates;
  tagList?: Array<{ Key: string; Value: string }>;
}

export interface CreateClusterInput {
  hsmType: string;
  subnetIds: string[];
  mode?: ClusterMode;
  backupRetentionPolicyDays?: number;
  tagList?: Array<{ Key: string; Value: string }>;
}

export interface VpcOption {
  vpcId: string;
  cidrBlock?: string;
  isDefault?: boolean;
  name?: string;
}

export interface SubnetOption {
  subnetId: string;
  vpcId: string;
  availabilityZone: string;
  cidrBlock?: string;
  availableIpAddressCount?: number;
  name?: string;
}

export interface BackupSummary {
  backupId: string;
  backupState?: string;
  clusterId?: string;
  createTimestamp?: string;
  deleteTimestamp?: string;
  mode?: string;
  sourceBackup?: string;
  sourceCluster?: string;
  sourceRegion?: string;
}
