export interface KMSKeySummary {
  keyId: string;
  arn: string;
  aliases: string[];
  description: string;
  keyState: string;
  enabled: boolean;
  creationDate: string;
  keyUsage: string;
  keySpec: string;
  keyManager: "CUSTOMER" | "AWS";
  origin: string;
  deletionDate?: string;
  multiRegion: boolean;
  encryptionAlgorithms?: string[];
  signingAlgorithms?: string[];
  macAlgorithms?: string[];
}

export interface KMSKeyDetail extends KMSKeySummary {
  keyPolicy?: string;
  keyRotationEnabled?: boolean;
  nextRotationDate?: string;
  rotationPeriodInDays?: number;
  tags?: Array<{ key: string; value: string }>;
  cloudHsmClusterId?: string;
  customKeyStoreId?: string;
}

export interface CustomKeyStoreItem {
  customKeyStoreId?: string;
  customKeyStoreName?: string;
  cloudHsmClusterId?: string;
  trustAnchorCertificate?: string;
  connectionState?: "CONNECTED" | "CONNECTING" | "FAILED" | "DISCONNECTED" | "DISCONNECTING";
  connectionErrorCode?: string;
  creationDate?: string;
  customKeyStoreType?: "AWS_CLOUDHSM" | "EXTERNAL_KEY_STORE";
}

export interface IAMPrincipal {
  name: string;
  arn: string;
  type: "User" | "Role";
}

export interface CreateKeyInput {
  keyType: "SYMMETRIC" | "ASYMMETRIC" | "HMAC";
  keyUsage: "ENCRYPT_DECRYPT" | "SIGN_VERIFY" | "GENERATE_VERIFY_MAC";
  keySpec: string;
  multiRegion: boolean;
  alias: string;
  description: string;
  tags: Array<{ key: string; value: string }>;
  adminPrincipals: string[];
  allowAdminDelete: boolean;
  usagePrincipals: string[];
  customPolicy?: string;
}
