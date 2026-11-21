/**
 * src/app/directoryservice/types.ts – TypeScript type definitions for AWS Directory Service.
 * Zero emojis, Cloudscape enterprise standard.
 */

export type DirectoryStage =
  | "Requested"
  | "Creating"
  | "Created"
  | "Active"
  | "Inoperable"
  | "Impaired"
  | "Restoring"
  | "RestoreFailed"
  | "Deleting"
  | "Deleted"
  | "Failed";

export type DirectoryType =
  | "SimpleAD"
  | "ADConnector"
  | "MicrosoftAD"
  | "SharedMicrosoftAD";

export type DirectorySize = "Small" | "Large";
export type DirectoryEdition = "Standard" | "Enterprise";

export interface DirectoryVpcSettings {
  vpcId?: string;
  subnetIds?: string[];
  securityGroupId?: string;
  availabilityZones?: string[];
}

export interface DirectorySummary {
  directoryId: string;
  name: string;
  shortName?: string;
  size?: DirectorySize | string;
  edition?: DirectoryEdition | string;
  alias?: string;
  accessUrl?: string;
  description?: string;
  dnsIpAddrs: string[];
  stage: DirectoryStage | string;
  type: DirectoryType | string;
  vpcSettings?: DirectoryVpcSettings;
  ssoEnabled: boolean;
  launchTime?: string;
  stageLastUpdatedDateTime?: string;
  desiredNumberOfDomainControllers?: number;
}

export interface DirectorySnapshot {
  snapshotId: string;
  directoryId: string;
  type?: "Auto" | "Manual" | string;
  name?: string;
  status?: "Creating" | "Completed" | "Failed" | string;
  startTime?: string;
}

export interface DirectoryTrust {
  directoryId: string;
  trustId: string;
  remoteDomainName: string;
  trustType?: string;
  trustDirection?: string;
  trustState?: string;
  createdDateTime?: string;
}

export interface ConditionalForwarder {
  remoteDomainName: string;
  dnsIpAddrs: string[];
  replicationScope?: string;
}

export interface DirectoryTag {
  Key: string;
  Value: string;
}

export interface CreateDirectoryInput {
  type: "SimpleAD" | "MicrosoftAD" | "ADConnector";
  name: string;
  shortName?: string;
  password?: string;
  description?: string;
  size?: "Small" | "Large";
  edition?: "Standard" | "Enterprise";
  vpcId: string;
  subnetIds: [string, string]; // exactly two subnets in 2 AZs
  tags?: DirectoryTag[];
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
