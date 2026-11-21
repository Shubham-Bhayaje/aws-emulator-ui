export interface AccountInfo {
  accountId: string;
  accountName: string;
  accountCreatedDate?: string;
  accountState?: string;
}

export interface ContactInfo {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateOrRegion: string;
  postalCode: string;
  countryCode: string;
  phoneNumber: string;
  websiteUrl?: string;
  verificationStatus?: string;
}

export type AlternateContactType = "BILLING" | "OPERATIONS" | "SECURITY";

export interface AlternateContact {
  alternateContactType: AlternateContactType;
  name: string;
  title: string;
  emailAddress: string;
  phoneNumber: string;
}

export interface RegionInfo {
  regionName: string;
  regionOptStatus: "ENABLED" | "DISABLED" | "ENABLED_BY_DEFAULT" | "ENABLING" | "DISABLING";
}
