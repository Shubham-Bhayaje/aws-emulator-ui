export interface DomainValidationOptionItem {
  domainName: string;
  validationEmails?: string[];
  validationDomain?: string;
  validationStatus?: "PENDING_VALIDATION" | "SUCCESS" | "FAILED";
  resourceRecord?: {
    name: string;
    type: string;
    value: string;
  };
  validationMethod?: "DNS" | "EMAIL";
}

export interface ACMCertificateSummary {
  certificateArn: string;
  domainName: string;
  subjectAlternativeNameSummaries?: string[];
  status: "PENDING_VALIDATION" | "ISSUED" | "INACTIVE" | "EXPIRED" | "VALIDATION_TIMED_OUT" | "REVOKED" | "FAILED";
  type: "AMAZON_ISSUED" | "IMPORTED" | "PRIVATE";
  keyAlgorithm: string;
  inUse: boolean;
  exported: boolean;
  renewalEligibility?: "ELIGIBLE" | "INELIGIBLE";
  notBefore?: string;
  notAfter?: string;
  createdAt?: string;
  certificateId: string;
}

export interface ACMCertificateDetail extends ACMCertificateSummary {
  subject?: string;
  issuer?: string;
  serial?: string;
  signatureAlgorithm?: string;
  inUseBy?: string[];
  importedAt?: string;
  issuedAt?: string;
  revocationDate?: string;
  revocationReason?: string;
  failureReason?: string;
  domainValidationOptions: DomainValidationOptionItem[];
  options?: {
    certificateTransparencyLoggingPreference?: "ENABLED" | "DISABLED";
    export?: "ENABLED" | "DISABLED";
  };
  tags?: Array<{ key: string; value: string }>;
  certificatePem?: string;
  certificateChainPem?: string;
}

export interface RequestCertificateInput {
  domainName: string;
  subjectAlternativeNames?: string[];
  validationMethod: "DNS" | "EMAIL";
  keyAlgorithm: "RSA_2048" | "RSA_3072" | "RSA_4096" | "ECDSA_P256" | "ECDSA_P384" | "ECDSA_P521";
  options?: {
    certificateTransparencyLoggingPreference?: "ENABLED" | "DISABLED";
  };
  tags?: Array<{ key: string; value: string }>;
}

export interface ImportCertificateInput {
  certificatePem: string;
  privateKeyPem: string;
  certificateChainPem?: string;
  tags?: Array<{ key: string; value: string }>;
}

export interface HostedZoneItem {
  id: string;
  name: string;
  callerReference?: string;
  recordSetCount?: number;
  isPrivateZone?: boolean;
}
