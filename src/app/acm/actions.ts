/**
 * src/app/acm/actions.ts – Server Actions for AWS Certificate Manager (ACM).
 * 100% backed by the live AWS emulator client (@aws-sdk/client-acm & @aws-sdk/client-route-53).
 */

"use server";

import { revalidatePath } from "next/cache";
import { acm, route53 } from "@/lib/aws";
import {
  ListCertificatesCommand,
  DescribeCertificateCommand,
  RequestCertificateCommand,
  ImportCertificateCommand,
  DeleteCertificateCommand,
  GetCertificateCommand,
  ListTagsForCertificateCommand,
  AddTagsToCertificateCommand,
  RemoveTagsFromCertificateCommand,
  UpdateCertificateOptionsCommand,
  ResendValidationEmailCommand,
} from "@aws-sdk/client-acm";
import {
  ListHostedZonesCommand,
  ChangeResourceRecordSetsCommand,
} from "@aws-sdk/client-route-53";
import {
  ACMCertificateSummary,
  ACMCertificateDetail,
  DomainValidationOptionItem,
  RequestCertificateInput,
  ImportCertificateInput,
  HostedZoneItem,
} from "./types";
import { formatAcmDate } from "./dateUtils";

/**
 * Fetch list of all certificates.
 */
export async function fetchCertificatesAction(): Promise<{
  success: boolean;
  certificates: ACMCertificateSummary[];
  error?: string;
}> {
  try {
    const listRes = await acm.send(new ListCertificatesCommand({}));
    const rawList = listRes.CertificateSummaryList || [];

    const summaries: ACMCertificateSummary[] = [];

    for (const item of rawList) {
      if (!item.CertificateArn) continue;
      const certId = item.CertificateArn.split("/").pop() || item.CertificateArn;

      summaries.push({
        certificateArn: item.CertificateArn,
        certificateId: certId,
        domainName: item.DomainName || "-",
        subjectAlternativeNameSummaries: item.SubjectAlternativeNameSummaries || [],
        status: (item.Status as any) || "PENDING_VALIDATION",
        type: (item.Type as any) || "AMAZON_ISSUED",
        keyAlgorithm: item.KeyAlgorithm || "RSA-2048",
        inUse: item.InUse ?? false,
        exported: item.Exported ?? false,
        renewalEligibility: (item.RenewalEligibility as any) || "INELIGIBLE",
        createdAt: item.CreatedAt ? formatAcmDate(item.CreatedAt) : undefined,
      });
    }

    return {
      success: true,
      certificates: summaries,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      certificates: [],
      error: msg,
    };
  }
}

/**
 * Fetch full details for a certificate by ID or ARN.
 */
export async function fetchCertificateDetailAction(idOrArn: string): Promise<{
  success: boolean;
  certificate: ACMCertificateDetail | null;
  error?: string;
}> {
  try {
    let arn = idOrArn;
    if (!arn.startsWith("arn:aws:acm:")) {
      arn = `arn:aws:acm:us-east-1:000000000000:certificate/${idOrArn}`;
    }

    const [descRes, tagsRes] = await Promise.all([
      acm.send(new DescribeCertificateCommand({ CertificateArn: arn })),
      acm.send(new ListTagsForCertificateCommand({ CertificateArn: arn })).catch(() => ({ Tags: [] })),
    ]);

    const cert = descRes.Certificate;
    if (!cert) {
      return { success: false, certificate: null, error: "Certificate not found." };
    }

    let certificatePem = "";
    let certificateChainPem = "";

    if (cert.Status === "ISSUED") {
      try {
        const getRes = await acm.send(new GetCertificateCommand({ CertificateArn: arn }));
        certificatePem = getRes.Certificate || "";
        certificateChainPem = getRes.CertificateChain || "";
      } catch {
        // Ignored if not yet available
      }
    }

    const domainValidationOptions: DomainValidationOptionItem[] = (
      cert.DomainValidationOptions || []
    ).map((d) => ({
      domainName: d.DomainName || "",
      validationEmails: d.ValidationEmails || [],
      validationDomain: d.ValidationDomain || "",
      validationStatus: d.ValidationStatus as any,
      validationMethod: d.ValidationMethod as any,
      resourceRecord: d.ResourceRecord
        ? {
            name: d.ResourceRecord.Name || "",
            type: d.ResourceRecord.Type || "CNAME",
            value: d.ResourceRecord.Value || "",
          }
        : undefined,
    }));

    const tags = (tagsRes.Tags || []).map((t) => ({
      key: t.Key || "",
      value: t.Value || "",
    }));

    const certId = cert.CertificateArn?.split("/").pop() || idOrArn;

    const detail: ACMCertificateDetail = {
      certificateArn: cert.CertificateArn || arn,
      certificateId: certId,
      domainName: cert.DomainName || "-",
      subjectAlternativeNameSummaries: cert.SubjectAlternativeNames || [],
      status: (cert.Status as any) || "PENDING_VALIDATION",
      type: (cert.Type as any) || "AMAZON_ISSUED",
      keyAlgorithm: cert.KeyAlgorithm || "RSA-2048",
      signatureAlgorithm: cert.SignatureAlgorithm,
      inUse: (cert.InUseBy && cert.InUseBy.length > 0) || false,
      inUseBy: cert.InUseBy || [],
      exported: (cert.Options?.Export === "ENABLED") ?? false,
      renewalEligibility: (cert.RenewalEligibility as any) || "INELIGIBLE",
      notBefore: cert.NotBefore ? formatAcmDate(cert.NotBefore) : undefined,
      notAfter: cert.NotAfter ? formatAcmDate(cert.NotAfter) : undefined,
      createdAt: cert.CreatedAt ? formatAcmDate(cert.CreatedAt) : undefined,
      issuedAt: cert.IssuedAt ? formatAcmDate(cert.IssuedAt) : undefined,
      importedAt: cert.ImportedAt ? formatAcmDate(cert.ImportedAt) : undefined,
      revocationDate: cert.RevocationDate ? formatAcmDate(cert.RevocationDate) : undefined,
      revocationReason: cert.RevocationReason,
      failureReason: cert.FailureReason,
      subject: cert.Subject,
      issuer: cert.Issuer,
      serial: cert.Serial,
      domainValidationOptions,
      options: {
        certificateTransparencyLoggingPreference: cert.Options
          ?.CertificateTransparencyLoggingPreference as any,
        export: cert.Options?.Export as any,
      },
      tags,
      certificatePem,
      certificateChainPem,
    };

    return {
      success: true,
      certificate: detail,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      certificate: null,
      error: msg,
    };
  }
}

/**
 * Request a new public certificate.
 */
export async function requestCertificateAction(input: RequestCertificateInput): Promise<{
  success: boolean;
  certificateArn?: string;
  error?: string;
}> {
  try {
    const tagList = (input.tags || [])
      .filter((t) => t.key.trim().length > 0)
      .map((t) => ({ Key: t.key.trim(), Value: t.value.trim() }));

    const res = await acm.send(
      new RequestCertificateCommand({
        DomainName: input.domainName.trim(),
        SubjectAlternativeNames:
          input.subjectAlternativeNames && input.subjectAlternativeNames.length > 0
            ? input.subjectAlternativeNames.map((s) => s.trim()).filter(Boolean)
            : undefined,
        ValidationMethod: input.validationMethod,
        KeyAlgorithm: input.keyAlgorithm,
        Options: input.options
          ? {
              CertificateTransparencyLoggingPreference:
                input.options.certificateTransparencyLoggingPreference,
            }
          : undefined,
        Tags: tagList.length > 0 ? tagList : undefined,
      })
    );

    revalidatePath("/acm");
    return {
      success: true,
      certificateArn: res.CertificateArn,
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
 * Import a 3rd-party certificate into ACM.
 */
export async function importCertificateAction(input: ImportCertificateInput): Promise<{
  success: boolean;
  certificateArn?: string;
  error?: string;
}> {
  try {
    if (!input.certificatePem.trim()) {
      return { success: false, error: "Certificate body is required." };
    }
    if (!input.privateKeyPem.trim()) {
      return { success: false, error: "Certificate private key is required." };
    }

    const tagList = (input.tags || [])
      .filter((t) => t.key.trim().length > 0)
      .map((t) => ({ Key: t.key.trim(), Value: t.value.trim() }));

    const res = await acm.send(
      new ImportCertificateCommand({
        Certificate: Buffer.from(input.certificatePem.trim()),
        PrivateKey: Buffer.from(input.privateKeyPem.trim()),
        CertificateChain: input.certificateChainPem?.trim()
          ? Buffer.from(input.certificateChainPem.trim())
          : undefined,
        Tags: tagList.length > 0 ? tagList : undefined,
      })
    );

    revalidatePath("/acm");
    return {
      success: true,
      certificateArn: res.CertificateArn,
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
 * Delete a certificate by ARN.
 */
export async function deleteCertificateAction(certificateArn: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await acm.send(new DeleteCertificateCommand({ CertificateArn: certificateArn }));
    revalidatePath("/acm");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Add tags to a certificate.
 */
export async function addTagsAction(
  certificateArn: string,
  tags: Array<{ Key: string; Value: string }>
): Promise<{ success: boolean; error?: string }> {
  try {
    await acm.send(
      new AddTagsToCertificateCommand({
        CertificateArn: certificateArn,
        Tags: tags,
      })
    );
    revalidatePath("/acm");
    revalidatePath(`/acm/certificates/${certificateArn.split("/").pop()}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Remove tags from a certificate.
 */
export async function removeTagsAction(
  certificateArn: string,
  tagKeys: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await acm.send(
      new RemoveTagsFromCertificateCommand({
        CertificateArn: certificateArn,
        Tags: tagKeys.map((k) => ({ Key: k })),
      })
    );
    revalidatePath("/acm");
    revalidatePath(`/acm/certificates/${certificateArn.split("/").pop()}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Update certificate options (e.g. transparency logging).
 */
export async function updateCertificateOptionsAction(
  certificateArn: string,
  loggingPreference: "ENABLED" | "DISABLED"
): Promise<{ success: boolean; error?: string }> {
  try {
    await acm.send(
      new UpdateCertificateOptionsCommand({
        CertificateArn: certificateArn,
        Options: {
          CertificateTransparencyLoggingPreference: loggingPreference,
        },
      })
    );
    revalidatePath(`/acm/certificates/${certificateArn.split("/").pop()}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Resend validation email.
 */
export async function resendValidationEmailAction(
  certificateArn: string,
  domain: string,
  validationDomain: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await acm.send(
      new ResendValidationEmailCommand({
        CertificateArn: certificateArn,
        Domain: domain,
        ValidationDomain: validationDomain,
      })
    );
    revalidatePath(`/acm/certificates/${certificateArn.split("/").pop()}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Fetch Route 53 hosted zones live from the emulator.
 */
export async function fetchHostedZonesAction(): Promise<{
  success: boolean;
  hostedZones: HostedZoneItem[];
  error?: string;
}> {
  try {
    const res = await route53.send(new ListHostedZonesCommand({}));
    const rawList = res.HostedZones || [];

    const hostedZones: HostedZoneItem[] = rawList.map((z) => ({
      id: z.Id?.replace("/hostedzone/", "") || "",
      name: z.Name || "",
      callerReference: z.CallerReference,
      recordSetCount: z.ResourceRecordSetCount,
      isPrivateZone: z.Config?.PrivateZone ?? false,
    }));

    return {
      success: true,
      hostedZones,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      hostedZones: [],
      error: msg,
    };
  }
}

/**
 * Automatically create Route 53 CNAME validation records for a certificate.
 */
export async function createRoute53RecordsAction(
  certificateArn: string,
  hostedZoneId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const desc = await acm.send(new DescribeCertificateCommand({ CertificateArn: certificateArn }));
    const cert = desc.Certificate;
    if (!cert) return { success: false, error: "Certificate not found." };

    const dnsOptions = (cert.DomainValidationOptions || []).filter(
      (d) => d.ValidationMethod === "DNS" && d.ResourceRecord?.Name && d.ResourceRecord?.Value
    );

    if (dnsOptions.length === 0) {
      return { success: false, error: "No DNS validation records found for this certificate." };
    }

    const changes = dnsOptions.map((opt) => ({
      Action: "UPSERT" as const,
      ResourceRecordSet: {
        Name: opt.ResourceRecord!.Name!,
        Type: (opt.ResourceRecord!.Type as any) || "CNAME",
        TTL: 300,
        ResourceRecords: [{ Value: `"${opt.ResourceRecord!.Value!}"` }],
      },
    }));

    await route53.send(
      new ChangeResourceRecordSetsCommand({
        HostedZoneId: hostedZoneId,
        ChangeBatch: {
          Comment: `ACM DNS validation records for ${cert.DomainName}`,
          Changes: changes,
        },
      })
    );

    revalidatePath(`/acm/certificates/${certificateArn.split("/").pop()}`);
    return { success: true, count: changes.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
