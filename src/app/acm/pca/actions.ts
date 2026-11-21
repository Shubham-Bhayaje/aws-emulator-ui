/**
 * src/app/acm/pca/actions.ts – Server Actions for AWS Private CA.
 * 100% backed by the live AWS emulator client (@aws-sdk/client-acm-pca & @aws-sdk/client-s3).
 * Zero emojis, Cloudscape enterprise standard.
 */

"use server";

import { revalidatePath } from "next/cache";
import { acmPca, s3 } from "@/lib/aws";
import {
  ACMPCAClient,
  ListCertificateAuthoritiesCommand,
  DescribeCertificateAuthorityCommand,
  CreateCertificateAuthorityCommand,
  GetCertificateAuthorityCsrCommand,
  GetCertificateAuthorityCertificateCommand,
  ImportCertificateAuthorityCertificateCommand,
  IssueCertificateCommand,
  GetCertificateCommand,
  RevokeCertificateCommand,
  UpdateCertificateAuthorityCommand,
  DeleteCertificateAuthorityCommand,
  RestoreCertificateAuthorityCommand,
  ListTagsCommand,
  TagCertificateAuthorityCommand,
  UntagCertificateAuthorityCommand,
  PutPolicyCommand,
  GetPolicyCommand,
  DeletePolicyCommand,
} from "@aws-sdk/client-acm-pca";
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import {
  CertificateAuthoritySummary,
  CertificateAuthorityDetail,
  CreateCertificateAuthorityInput,
  IssueCertificateInput,
  RevocationReason,
  SigningAlgorithm,
  S3BucketOption,
} from "./types";

const ENDPOINT = "https://127.0.0.1:9297";
const DEFAULT_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

function getAcmPcaClient(): ACMPCAClient {
  if (acmPca && typeof (acmPca as any).send === "function") return acmPca;
  return new ACMPCAClient({ endpoint: ENDPOINT, region: DEFAULT_REGION });
}

function getS3Client(): S3Client {
  if (s3 && typeof (s3 as any).send === "function") return s3;
  return new S3Client({ endpoint: ENDPOINT, region: DEFAULT_REGION });
}

function formatDate(d?: Date | string): string | undefined {
  if (!d) return undefined;
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return undefined;
  return dt.toISOString().replace("T", " ").substring(0, 19) + " UTC";
}

/**
 * Fetch all private certificate authorities.
 */
export async function listCertificateAuthoritiesAction(): Promise<{
  success: boolean;
  certificateAuthorities: CertificateAuthoritySummary[];
  error?: string;
}> {
  try {
    const res = await getAcmPcaClient().send(new ListCertificateAuthoritiesCommand({}));
    const rawList = res.CertificateAuthorities || [];

    const summaries: CertificateAuthoritySummary[] = rawList.map((ca) => {
      const arn = ca.Arn || "";
      const caId = arn.split("/").pop() || arn;
      const subj = ca.CertificateAuthorityConfiguration?.Subject;

      return {
        arn,
        id: caId,
        ownerAccount: ca.OwnerAccount,
        createdAt: formatDate(ca.CreatedAt),
        lastStateChangeAt: formatDate(ca.LastStateChangeAt),
        type: (ca.Type as any) || "ROOT",
        status: (ca.Status as any) || "PENDING_CERTIFICATE",
        serial: ca.Serial,
        keyAlgorithm: ca.CertificateAuthorityConfiguration?.KeyAlgorithm,
        signingAlgorithm: ca.CertificateAuthorityConfiguration?.SigningAlgorithm,
        commonName: subj?.CommonName || caId,
        organization: subj?.Organization,
        organizationalUnit: subj?.OrganizationalUnit,
        country: subj?.Country,
        state: subj?.State,
        locality: subj?.Locality,
        notBefore: formatDate(ca.NotBefore),
        notAfter: formatDate(ca.NotAfter),
        failureReason: ca.FailureReason as any,
      };
    });

    return {
      success: true,
      certificateAuthorities: summaries,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      certificateAuthorities: [],
      error: msg,
    };
  }
}

/**
 * Fetch full details for a single certificate authority.
 */
export async function describeCertificateAuthorityAction(arn: string): Promise<{
  success: boolean;
  certificateAuthority: CertificateAuthorityDetail | null;
  error?: string;
}> {
  try {
    const client = getAcmPcaClient();

    const [descRes, tagsRes, policyRes] = await Promise.all([
      client.send(new DescribeCertificateAuthorityCommand({ CertificateAuthorityArn: arn })),
      client.send(new ListTagsCommand({ CertificateAuthorityArn: arn })).catch(() => ({ Tags: [] })),
      client.send(new GetPolicyCommand({ ResourceArn: arn })).catch(() => ({ Policy: undefined })),
    ]);

    const ca = descRes.CertificateAuthority;
    if (!ca) {
      return { success: false, certificateAuthority: null, error: "Certificate Authority not found" };
    }

    const caId = (ca.Arn || arn).split("/").pop() || arn;
    const subj = ca.CertificateAuthorityConfiguration?.Subject;

    // Retrieve CSR
    let csrPem: string | undefined = undefined;
    try {
      const csrRes = await client.send(
        new GetCertificateAuthorityCsrCommand({ CertificateAuthorityArn: arn })
      );
      csrPem = csrRes.Csr;
    } catch {
      // CSR may not be available if deleted or failed
    }

    // Retrieve Certificate & Chain if Active
    let certPem: string | undefined = undefined;
    let chainPem: string | undefined = undefined;
    if (ca.Status === "ACTIVE" || ca.Status === "DISABLED") {
      try {
        const certRes = await client.send(
          new GetCertificateAuthorityCertificateCommand({ CertificateAuthorityArn: arn })
        );
        certPem = certRes.Certificate;
        chainPem = certRes.CertificateChain;
      } catch {
        // Ignored if certificate not yet installed
      }
    }

    const tags = (tagsRes.Tags || []).map((t) => ({
      key: t.Key || "",
      value: t.Value || "",
    }));

    const detail: CertificateAuthorityDetail = {
      arn: ca.Arn || arn,
      id: caId,
      ownerAccount: ca.OwnerAccount,
      createdAt: formatDate(ca.CreatedAt),
      lastStateChangeAt: formatDate(ca.LastStateChangeAt),
      type: (ca.Type as any) || "ROOT",
      status: (ca.Status as any) || "PENDING_CERTIFICATE",
      serial: ca.Serial,
      keyAlgorithm: ca.CertificateAuthorityConfiguration?.KeyAlgorithm,
      signingAlgorithm: ca.CertificateAuthorityConfiguration?.SigningAlgorithm,
      commonName: subj?.CommonName || caId,
      organization: subj?.Organization,
      organizationalUnit: subj?.OrganizationalUnit,
      country: subj?.Country,
      state: subj?.State,
      locality: subj?.Locality,
      notBefore: formatDate(ca.NotBefore),
      notAfter: formatDate(ca.NotAfter),
      failureReason: ca.FailureReason as any,
      revocationConfiguration: {
        crlConfiguration: ca.RevocationConfiguration?.CrlConfiguration
          ? {
              enabled: ca.RevocationConfiguration.CrlConfiguration.Enabled ?? false,
              expirationInDays: ca.RevocationConfiguration.CrlConfiguration.ExpirationInDays,
              customCname: ca.RevocationConfiguration.CrlConfiguration.CustomCname,
              s3BucketName: ca.RevocationConfiguration.CrlConfiguration.S3BucketName,
            }
          : undefined,
        ocspConfiguration: ca.RevocationConfiguration?.OcspConfiguration
          ? {
              enabled: ca.RevocationConfiguration.OcspConfiguration.Enabled ?? false,
              ocspCustomCname: ca.RevocationConfiguration.OcspConfiguration.OcspCustomCname,
            }
          : undefined,
      },
      keyStorageSecurityStandard: ca.KeyStorageSecurityStandard,
      usageMode: ca.UsageMode,
      csr: csrPem,
      certificate: certPem,
      certificateChain: chainPem,
      tags,
      policy: policyRes.Policy,
    };

    return {
      success: true,
      certificateAuthority: detail,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      certificateAuthority: null,
      error: msg,
    };
  }
}

/**
 * Create a new Certificate Authority (Root or Subordinate).
 */
export async function createCertificateAuthorityAction(input: CreateCertificateAuthorityInput): Promise<{
  success: boolean;
  certificateAuthorityArn?: string;
  error?: string;
}> {
  try {
    const client = getAcmPcaClient();

    const tags = (input.tags || [])
      .filter((t) => t.key.trim().length > 0)
      .map((t) => ({ Key: t.key.trim(), Value: t.value.trim() }));

    const res = await client.send(
      new CreateCertificateAuthorityCommand({
        CertificateAuthorityType: input.type,
        CertificateAuthorityConfiguration: {
          KeyAlgorithm: input.keyAlgorithm,
          SigningAlgorithm: input.signingAlgorithm,
          Subject: {
            CommonName: input.subject.commonName.trim(),
            Organization: input.subject.organization?.trim() || undefined,
            OrganizationalUnit: input.subject.organizationalUnit?.trim() || undefined,
            Country: input.subject.country?.trim() || undefined,
            State: input.subject.state?.trim() || undefined,
            Locality: input.subject.locality?.trim() || undefined,
          },
        },
        RevocationConfiguration: input.crlConfiguration?.enabled
          ? {
              CrlConfiguration: {
                Enabled: true,
                ExpirationInDays: input.crlConfiguration.expirationInDays || 7,
                CustomCname: input.crlConfiguration.customCname?.trim() || undefined,
                S3BucketName: input.crlConfiguration.s3BucketName?.trim() || undefined,
              },
            }
          : {
              CrlConfiguration: { Enabled: false },
            },
        Tags: tags.length > 0 ? tags : undefined,
      })
    );

    revalidatePath("/acm/pca");
    revalidatePath("/pca");

    return {
      success: true,
      certificateAuthorityArn: res.CertificateAuthorityArn,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Install a self-signed Root CA certificate automatically.
 * Issues self-signed certificate using RootCACertificate/V1 template and imports it.
 */
export async function installRootCaCertificateAction(
  arn: string,
  validityYears: number = 10,
  signingAlgorithm: SigningAlgorithm = "SHA256WITHRSA"
): Promise<{
  success: boolean;
  certificateArn?: string;
  error?: string;
}> {
  try {
    const client = getAcmPcaClient();

    // 1. Get CSR
    const csrRes = await client.send(
      new GetCertificateAuthorityCsrCommand({ CertificateAuthorityArn: arn })
    );
    if (!csrRes.Csr) {
      return { success: false, error: "Failed to retrieve CA CSR" };
    }

    // 2. Issue self-signed Root certificate
    const csrBytes = Buffer.from(csrRes.Csr, "utf-8");
    const issueRes = await client.send(
      new IssueCertificateCommand({
        CertificateAuthorityArn: arn,
        Csr: csrBytes,
        SigningAlgorithm: signingAlgorithm,
        TemplateArn: "arn:aws:acm-pca:::template/RootCACertificate/V1",
        Validity: {
          Value: validityYears * 365,
          Type: "DAYS",
        },
      })
    );

    const certArn = issueRes.CertificateArn;
    if (!certArn) {
      return { success: false, error: "Failed to issue Root certificate" };
    }

    // 3. Get issued certificate body
    const getCertRes = await client.send(
      new GetCertificateCommand({
        CertificateAuthorityArn: arn,
        CertificateArn: certArn,
      })
    );

    if (!getCertRes.Certificate) {
      return { success: false, error: "Failed to retrieve issued certificate body" };
    }

    // 4. Import certificate to activate the CA
    const certBytes = Buffer.from(getCertRes.Certificate, "utf-8");
    await client.send(
      new ImportCertificateAuthorityCertificateCommand({
        CertificateAuthorityArn: arn,
        Certificate: certBytes,
      })
    );

    revalidatePath("/acm/pca");
    revalidatePath("/pca");

    return {
      success: true,
      certificateArn: certArn,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Import a custom CA certificate (and optional chain) to activate the CA.
 */
export async function importCaCertificateAction(
  arn: string,
  certificatePem: string,
  certificateChainPem?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getAcmPcaClient();
    const certBytes = Buffer.from(certificatePem.trim(), "utf-8");
    const chainBytes = certificateChainPem?.trim()
      ? Buffer.from(certificateChainPem.trim(), "utf-8")
      : undefined;

    await client.send(
      new ImportCertificateAuthorityCertificateCommand({
        CertificateAuthorityArn: arn,
        Certificate: certBytes,
        CertificateChain: chainBytes,
      })
    );

    revalidatePath("/acm/pca");
    revalidatePath("/pca");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Issue an end-entity or subordinate certificate from this CA.
 */
export async function issueCertificateAction(input: IssueCertificateInput): Promise<{
  success: boolean;
  certificateArn?: string;
  certificatePem?: string;
  certificateChainPem?: string;
  error?: string;
}> {
  try {
    const client = getAcmPcaClient();
    const csrBytes = Buffer.from(input.csr.trim(), "utf-8");

    const issueRes = await client.send(
      new IssueCertificateCommand({
        CertificateAuthorityArn: input.certificateAuthorityArn,
        Csr: csrBytes,
        SigningAlgorithm: input.signingAlgorithm,
        TemplateArn: input.templateArn || "arn:aws:acm-pca:::template/EndEntityCertificate/V1",
        Validity: {
          Value: input.validityDays,
          Type: "DAYS",
        },
      })
    );

    const certArn = issueRes.CertificateArn;
    if (!certArn) {
      return { success: false, error: "Certificate ARN was not returned" };
    }

    // Retrieve the certificate
    const getRes = await client.send(
      new GetCertificateCommand({
        CertificateAuthorityArn: input.certificateAuthorityArn,
        CertificateArn: certArn,
      })
    );

    revalidatePath("/acm/pca");
    revalidatePath("/pca");

    return {
      success: true,
      certificateArn: certArn,
      certificatePem: getRes.Certificate,
      certificateChainPem: getRes.CertificateChain,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Revoke an issued certificate.
 */
export async function revokeCertificateAction(
  caArn: string,
  serial: string,
  reason: RevocationReason
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getAcmPcaClient();
    await client.send(
      new RevokeCertificateCommand({
        CertificateAuthorityArn: caArn,
        CertificateSerial: serial.trim(),
        RevocationReason: reason,
      })
    );

    revalidatePath("/acm/pca");
    revalidatePath("/pca");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Update Certificate Authority status (ACTIVE / DISABLED).
 */
export async function updateCertificateAuthorityStatusAction(
  arn: string,
  status: "ACTIVE" | "DISABLED"
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getAcmPcaClient();
    await client.send(
      new UpdateCertificateAuthorityCommand({
        CertificateAuthorityArn: arn,
        Status: status,
      })
    );

    revalidatePath("/acm/pca");
    revalidatePath("/pca");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Schedule CA for deletion with retention period (7 to 30 days).
 */
export async function deleteCertificateAuthorityAction(
  arn: string,
  retentionDays: number = 7
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getAcmPcaClient();

    // In AWS, CA should be disabled before deleting if it is active
    try {
      await client.send(
        new UpdateCertificateAuthorityCommand({
          CertificateAuthorityArn: arn,
          Status: "DISABLED",
        })
      );
    } catch {
      // Ignore if already disabled or pending
    }

    await client.send(
      new DeleteCertificateAuthorityCommand({
        CertificateAuthorityArn: arn,
        PermanentDeletionTimeInDays: retentionDays,
      })
    );

    revalidatePath("/acm/pca");
    revalidatePath("/pca");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Restore a deleted CA before its retention period expires.
 */
export async function restoreCertificateAuthorityAction(arn: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getAcmPcaClient();
    await client.send(
      new RestoreCertificateAuthorityCommand({
        CertificateAuthorityArn: arn,
      })
    );

    revalidatePath("/acm/pca");
    revalidatePath("/pca");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Attach or update resource policy.
 */
export async function putPolicyAction(
  arn: string,
  policyDoc: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getAcmPcaClient();
    await client.send(
      new PutPolicyCommand({
        ResourceArn: arn,
        Policy: policyDoc,
      })
    );

    revalidatePath("/acm/pca");
    revalidatePath("/pca");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Delete resource policy.
 */
export async function deletePolicyAction(arn: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getAcmPcaClient();
    await client.send(
      new DeletePolicyCommand({
        ResourceArn: arn,
      })
    );

    revalidatePath("/acm/pca");
    revalidatePath("/pca");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Add tags to CA.
 */
export async function tagCertificateAuthorityAction(
  arn: string,
  tags: { key: string; value: string }[]
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getAcmPcaClient();
    await client.send(
      new TagCertificateAuthorityCommand({
        CertificateAuthorityArn: arn,
        Tags: tags.map((t) => ({ Key: t.key.trim(), Value: t.value.trim() })),
      })
    );

    revalidatePath("/acm/pca");
    revalidatePath("/pca");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Untag CA.
 */
export async function untagCertificateAuthorityAction(
  arn: string,
  tagKeys: string[]
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getAcmPcaClient();
    await client.send(
      new UntagCertificateAuthorityCommand({
        CertificateAuthorityArn: arn,
        Tags: tagKeys.map((k) => ({ Key: k })),
      })
    );

    revalidatePath("/acm/pca");
    revalidatePath("/pca");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Fetch available S3 buckets for CRL configuration from the live S3 emulator.
 */
export async function fetchS3BucketsForCrlAction(): Promise<{
  success: boolean;
  buckets: S3BucketOption[];
  error?: string;
}> {
  try {
    const client = getS3Client();
    const res = await client.send(new ListBucketsCommand({}));
    const buckets: S3BucketOption[] = (res.Buckets || []).map((b) => ({
      name: b.Name || "",
      creationDate: formatDate(b.CreationDate),
    }));

    return {
      success: true,
      buckets,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      buckets: [],
      error: msg,
    };
  }
}
