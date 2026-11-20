export interface RAMTag {
  key: string;
  value: string;
}

export interface RAMResourceShare {
  arn: string;
  name: string;
  status: "ACTIVE" | "PENDING" | "FAILED" | "DELETING" | "DELETED";
  statusMessage?: string;
  owner: string;
  allowExternalPrincipals: boolean;
  creationTime?: string;
  lastUpdatedTime?: string;
  tags?: RAMTag[];
  resourceCount?: number;
  principalCount?: number;
  permissionCount?: number;
}

export interface RAMResource {
  arn: string;
  type: string;
  resourceShareArn: string;
  resourceShareName?: string;
  status: "ASSOCIATED" | "ASSOCIATING" | "DISASSOCIATING" | "DISASSOCIATED" | "FAILED";
  statusMessage?: string;
  lastUpdatedTime?: string;
  creationTime?: string;
}

export interface RAMPrincipal {
  id: string;
  resourceShareArn: string;
  resourceShareName?: string;
  status: "ASSOCIATED" | "ASSOCIATING" | "DISASSOCIATING" | "DISASSOCIATED" | "FAILED";
  statusMessage?: string;
  lastUpdatedTime?: string;
  creationTime?: string;
}

export interface RAMPermission {
  arn: string;
  name: string;
  version: string;
  resourceType: string;
  status: string;
  creationTime?: string;
  lastUpdatedTime?: string;
  isResourceTypeDefault?: boolean;
  permission?: string;
}

export interface RAMInvitation {
  resourceShareInvitationArn: string;
  resourceShareName: string;
  resourceShareArn: string;
  senderAccountId: string;
  receiverAccountId: string;
  invitationTimestamp?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
}

export interface AvailableShareableResource {
  arn: string;
  id: string;
  name: string;
  type: string;
  service: string;
  region: string;
}
