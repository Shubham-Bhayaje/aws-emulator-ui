/**
 * src/app/acm/pca/types.ts – TypeScript types for AWS Private CA.
 * Cloudscape enterprise standard, zero emojis.
 */

export type CertificateAuthorityType = "ROOT" | "SUBORDINATE";

export type CertificateAuthorityStatus =
  | "CREATING"
  | "PENDING_CERTIFICATE"
  | "ACTIVE"
  | "DELETED"
  | "DISABLED"
  | "EXPIRED"
  | "FAILED";

export type KeyAlgorithm =
  | "RSA_2048"
  | "RSA_4096"
  | "EC_prime256v1"
  | "EC_secp384r1";

export type SigningAlgorithm =
  | "SHA256WITHRSA"
  | "SHA384WITHRSA"
  | "SHA512WITHRSA"
  | "SHA256WITHECDSA"
  | "SHA384WITHECDSA"
  | "SHA512WITHECDSA";

export type RevocationReason =
  | "UNSPECIFIED"
  | "KEY_COMPROMISE"
  | "CA_COMPROMISE"
  | "AFFILIATION_CHANGED"
  | "SUPERSEDED"
  | "CESSATION_OF_OPERATION"
  | "PRIVILEGE_WITHDRAWN"
  | "A_A_COMPROMISE";

export interface ASN1Subject {
  country?: string;
  organization?: string;
  organizationalUnit?: string;
  state?: string;
  commonName: string;
  locality?: string;
}

export interface CrlConfiguration {
  enabled: boolean;
  expirationInDays?: number;
  customCname?: string;
  s3BucketName?: string;
}

export interface OcspConfiguration {
  enabled: boolean;
  ocspCustomCname?: string;
}

export interface RevocationConfiguration {
  crlConfiguration?: CrlConfiguration;
  ocspConfiguration?: OcspConfiguration;
}

export interface CertificateAuthoritySummary {
  arn: string;
  id: string;
  ownerAccount?: string;
  createdAt?: string;
  lastStateChangeAt?: string;
  type: CertificateAuthorityType;
  status: CertificateAuthorityStatus;
  serial?: string;
  keyAlgorithm?: string;
  signingAlgorithm?: string;
  commonName: string;
  organization?: string;
  organizationalUnit?: string;
  country?: string;
  state?: string;
  locality?: string;
  notBefore?: string;
  notAfter?: string;
  failureReason?: string;
}

export interface CertificateAuthorityDetail extends CertificateAuthoritySummary {
  revocationConfiguration?: RevocationConfiguration;
  keyStorageSecurityStandard?: string;
  usageMode?: string;
  csr?: string;
  certificate?: string;
  certificateChain?: string;
  tags?: { key: string; value: string }[];
  policy?: string;
}

export interface CreateCertificateAuthorityInput {
  type: CertificateAuthorityType;
  subject: ASN1Subject;
  keyAlgorithm: KeyAlgorithm;
  signingAlgorithm: SigningAlgorithm;
  crlConfiguration?: CrlConfiguration;
  ocspConfiguration?: OcspConfiguration;
  tags?: { key: string; value: string }[];
}

export interface InstallCaCertificateInput {
  certificateAuthorityArn: string;
  type: "SELF_SIGNED" | "EXTERNAL";
  validityDays?: number;
  signingAlgorithm?: SigningAlgorithm;
  certificateBody?: string;
  certificateChain?: string;
}

export interface IssueCertificateInput {
  certificateAuthorityArn: string;
  csr: string;
  templateArn?: string;
  signingAlgorithm: SigningAlgorithm;
  validityDays: number;
}

export interface S3BucketOption {
  name: string;
  creationDate?: string;
}
