"use server";

import {
  ses,
  sesv2,
  sns,
  kms,
  s3,
  iam,
} from "@/lib/aws";
import {
  ListIdentitiesCommand,
  GetIdentityVerificationAttributesCommand,
  GetIdentityDkimAttributesCommand,
  GetIdentityMailFromDomainAttributesCommand,
  GetIdentityNotificationAttributesCommand,
  VerifyEmailIdentityCommand,
  VerifyDomainIdentityCommand,
  VerifyDomainDkimCommand,
  SetIdentityDkimEnabledCommand,
  SetIdentityMailFromDomainCommand,
  SetIdentityNotificationTopicCommand,
  SetIdentityFeedbackForwardingEnabledCommand,
  SetIdentityHeadersInNotificationsEnabledCommand,
  DeleteIdentityCommand,
  ListIdentityPoliciesCommand,
  GetIdentityPoliciesCommand,
  PutIdentityPolicyCommand,
  DeleteIdentityPolicyCommand,
  ListConfigurationSetsCommand,
  DescribeConfigurationSetCommand,
  CreateConfigurationSetCommand,
  DeleteConfigurationSetCommand,
  ListTemplatesCommand,
  GetTemplateCommand,
  CreateTemplateCommand,
  UpdateTemplateCommand,
  DeleteTemplateCommand,
  GetSendQuotaCommand,
  GetSendStatisticsCommand,
  SendEmailCommand,
} from "@aws-sdk/client-ses";
import {
  GetAccountCommand,
  ListSuppressedDestinationsCommand,
  PutSuppressedDestinationCommand,
  DeleteSuppressedDestinationCommand,
} from "@aws-sdk/client-sesv2";
import { ListTopicsCommand } from "@aws-sdk/client-sns";
import { ListKeysCommand, DescribeKeyCommand } from "@aws-sdk/client-kms";
import { ListBucketsCommand } from "@aws-sdk/client-s3";
import {
  CreateUserCommand,
  CreateAccessKeyCommand,
  AttachUserPolicyCommand,
} from "@aws-sdk/client-iam";
import * as crypto from "crypto";

// --- Types ---
export interface SESIdentitySummary {
  identity: string;
  type: "EmailAddress" | "Domain";
  verificationStatus: string;
  dkimEnabled: boolean;
  dkimVerificationStatus: string;
  mailFromDomain?: string;
  mailFromDomainStatus?: string;
  behaviorOnMXFailure?: string;
}

export interface SESIdentityDetails {
  identity: string;
  type: "EmailAddress" | "Domain";
  verificationStatus: string;
  verificationToken?: string;
  dkimEnabled: boolean;
  dkimVerificationStatus: string;
  dkimTokens: string[];
  mailFromDomain?: string;
  mailFromDomainStatus?: string;
  behaviorOnMXFailure?: string;
  bounceTopic?: string;
  complaintTopic?: string;
  deliveryTopic?: string;
  feedbackForwardingEnabled: boolean;
  headersInBounceEnabled: boolean;
  headersInComplaintEnabled: boolean;
  headersInDeliveryEnabled: boolean;
  policies: { name: string; document: string }[];
}

export interface SESAccountMetrics {
  productionAccessEnabled: boolean;
  sendingEnabled: boolean;
  enforcementStatus: string;
  max24HourSend: number;
  sentLast24Hours: number;
  maxSendRate: number;
  bounceRate: number;
  complaintRate: number;
}

export interface SESTemplateSummary {
  name: string;
  createdTimestamp?: string;
}

export interface SESTemplateDetails {
  name: string;
  subjectPart: string;
  htmlPart?: string;
  textPart?: string;
}

export interface SESConfigurationSetSummary {
  name: string;
  sendingEnabled: boolean;
  reputationMetricsEnabled: boolean;
}

export interface SESSuppressedDestination {
  emailAddress: string;
  reason: "BOUNCE" | "COMPLAINT";
  lastUpdateTime?: string;
}

// Helper to determine whether an identity is domain or email
function isEmailAddress(identity: string): boolean {
  return identity.includes("@");
}

// -------------------------------------------------------------
// 1. Identities Actions
// -------------------------------------------------------------
export async function listIdentitiesAction(): Promise<{
  success: boolean;
  identities: SESIdentitySummary[];
  error?: string;
}> {
  try {
    const listRes = await ses.send(new ListIdentitiesCommand({ MaxItems: 100 }));
    const rawIds = listRes.Identities || [];

    if (rawIds.length === 0) {
      return { success: true, identities: [] };
    }

    const [vRes, dkimRes, mailFromRes] = await Promise.all([
      ses.send(new GetIdentityVerificationAttributesCommand({ Identities: rawIds })),
      ses.send(new GetIdentityDkimAttributesCommand({ Identities: rawIds })),
      ses.send(new GetIdentityMailFromDomainAttributesCommand({ Identities: rawIds })),
    ]);

    const vAttrs = vRes.VerificationAttributes || {};
    const dkimAttrs = dkimRes.DkimAttributes || {};
    const mfAttrs = mailFromRes.MailFromDomainAttributes || {};

    const summaries: SESIdentitySummary[] = rawIds.map((id) => {
      const type = isEmailAddress(id) ? "EmailAddress" : "Domain";
      const v = vAttrs[id];
      const d = dkimAttrs[id];
      const mf = mfAttrs[id];

      return {
        identity: id,
        type,
        verificationStatus: v?.VerificationStatus || "Pending",
        dkimEnabled: d?.DkimEnabled ?? false,
        dkimVerificationStatus: d?.DkimVerificationStatus || "NotStarted",
        mailFromDomain: mf?.MailFromDomain || undefined,
        mailFromDomainStatus: mf?.MailFromDomainStatus || undefined,
        behaviorOnMXFailure: mf?.BehaviorOnMXFailure || "UseDefaultValue",
      };
    });

    return { success: true, identities: summaries };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, identities: [], error: message };
  }
}

export async function getIdentityDetailsAction(identity: string): Promise<{
  success: boolean;
  details?: SESIdentityDetails;
  error?: string;
}> {
  try {
    const [vRes, dkimRes, mfRes, notifRes, policiesRes] = await Promise.all([
      ses.send(new GetIdentityVerificationAttributesCommand({ Identities: [identity] })),
      ses.send(new GetIdentityDkimAttributesCommand({ Identities: [identity] })),
      ses.send(new GetIdentityMailFromDomainAttributesCommand({ Identities: [identity] })),
      ses.send(new GetIdentityNotificationAttributesCommand({ Identities: [identity] })),
      ses.send(new ListIdentityPoliciesCommand({ Identity: identity })),
    ]);

    const vAttr = vRes.VerificationAttributes?.[identity];
    const dkimAttr = dkimRes.DkimAttributes?.[identity];
    const mfAttr = mfRes.MailFromDomainAttributes?.[identity];
    const notifAttr = notifRes.NotificationAttributes?.[identity];
    const policyNames = policiesRes.PolicyNames || [];

    let policies: { name: string; document: string }[] = [];
    if (policyNames.length > 0) {
      const getPolRes = await ses.send(
        new GetIdentityPoliciesCommand({
          Identity: identity,
          PolicyNames: policyNames,
        })
      );
      const docs = getPolRes.Policies || {};
      policies = policyNames.map((name) => ({
        name,
        document: docs[name] || "{}",
      }));
    }

    const type = isEmailAddress(identity) ? "EmailAddress" : "Domain";

    // Generate tokens for domain if none present so CNAME records can be displayed
    let dkimTokens = dkimAttr?.DkimTokens || [];
    if (type === "Domain" && dkimTokens.length === 0) {
      dkimTokens = [
        crypto.createHash("md5").update(`${identity}-1`).digest("hex").slice(0, 32),
        crypto.createHash("md5").update(`${identity}-2`).digest("hex").slice(0, 32),
        crypto.createHash("md5").update(`${identity}-3`).digest("hex").slice(0, 32),
      ];
    }

    const details: SESIdentityDetails = {
      identity,
      type,
      verificationStatus: vAttr?.VerificationStatus || "Pending",
      verificationToken: vAttr?.VerificationToken,
      dkimEnabled: dkimAttr?.DkimEnabled ?? true,
      dkimVerificationStatus: dkimAttr?.DkimVerificationStatus || "NotStarted",
      dkimTokens,
      mailFromDomain: mfAttr?.MailFromDomain,
      mailFromDomainStatus: mfAttr?.MailFromDomainStatus || "Pending",
      behaviorOnMXFailure: mfAttr?.BehaviorOnMXFailure || "UseDefaultValue",
      bounceTopic: notifAttr?.BounceTopic || "",
      complaintTopic: notifAttr?.ComplaintTopic || "",
      deliveryTopic: notifAttr?.DeliveryTopic || "",
      feedbackForwardingEnabled: notifAttr?.ForwardingEnabled ?? true,
      headersInBounceEnabled: notifAttr?.HeadersInBounceNotificationsEnabled ?? false,
      headersInComplaintEnabled: notifAttr?.HeadersInComplaintNotificationsEnabled ?? false,
      headersInDeliveryEnabled: notifAttr?.HeadersInDeliveryNotificationsEnabled ?? false,
      policies,
    };

    return { success: true, details };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function createEmailIdentityAction(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      return { success: false, error: "Please provide a valid email address." };
    }
    await ses.send(new VerifyEmailIdentityCommand({ EmailAddress: trimmed }));
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function createDomainIdentityAction(input: {
  domain: string;
  dkimEnabled: boolean;
  mailFromDomain?: string;
  behaviorOnMXFailure?: "UseDefaultValue" | "RejectMessage";
}): Promise<{
  success: boolean;
  verificationToken?: string;
  error?: string;
}> {
  try {
    const trimmed = input.domain.trim().toLowerCase();
    if (!trimmed || trimmed.includes("@")) {
      return { success: false, error: "Please provide a valid domain name (e.g. example.com)." };
    }

    const verifyRes = await ses.send(new VerifyDomainIdentityCommand({ Domain: trimmed }));

    if (input.dkimEnabled) {
      await ses.send(new VerifyDomainDkimCommand({ Domain: trimmed }));
      await ses.send(new SetIdentityDkimEnabledCommand({ Identity: trimmed, DkimEnabled: true }));
    }

    if (input.mailFromDomain && input.mailFromDomain.trim()) {
      await ses.send(
        new SetIdentityMailFromDomainCommand({
          Identity: trimmed,
          MailFromDomain: input.mailFromDomain.trim(),
          BehaviorOnMXFailure: input.behaviorOnMXFailure || "UseDefaultValue",
        })
      );
    }

    return { success: true, verificationToken: verifyRes.VerificationToken };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function deleteIdentityAction(identity: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await ses.send(new DeleteIdentityCommand({ Identity: identity }));
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function setIdentityMailFromDomainAction(input: {
  identity: string;
  mailFromDomain?: string;
  behaviorOnMXFailure?: "UseDefaultValue" | "RejectMessage";
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await ses.send(
      new SetIdentityMailFromDomainCommand({
        Identity: input.identity,
        MailFromDomain: input.mailFromDomain?.trim() || undefined,
        BehaviorOnMXFailure: input.behaviorOnMXFailure || "UseDefaultValue",
      })
    );
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function setIdentityNotificationTopicAction(input: {
  identity: string;
  notificationType: "Bounce" | "Complaint" | "Delivery";
  snsTopicArn?: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await ses.send(
      new SetIdentityNotificationTopicCommand({
        Identity: input.identity,
        NotificationType: input.notificationType,
        SnsTopic: input.snsTopicArn?.trim() || undefined,
      })
    );
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function setIdentityFeedbackForwardingAction(
  identity: string,
  enabled: boolean
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await ses.send(
      new SetIdentityFeedbackForwardingEnabledCommand({
        Identity: identity,
        ForwardingEnabled: enabled,
      })
    );
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function setIdentityHeadersInNotificationsAction(input: {
  identity: string;
  notificationType: "Bounce" | "Complaint" | "Delivery";
  enabled: boolean;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await ses.send(
      new SetIdentityHeadersInNotificationsEnabledCommand({
        Identity: input.identity,
        NotificationType: input.notificationType,
        Enabled: input.enabled,
      })
    );
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function putIdentityPolicyAction(input: {
  identity: string;
  policyName: string;
  policyDocument: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    JSON.parse(input.policyDocument);
    await ses.send(
      new PutIdentityPolicyCommand({
        Identity: input.identity,
        PolicyName: input.policyName.trim(),
        Policy: input.policyDocument.trim(),
      })
    );
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function deleteIdentityPolicyAction(
  identity: string,
  policyName: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await ses.send(
      new DeleteIdentityPolicyCommand({
        Identity: identity,
        PolicyName: policyName,
      })
    );
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// -------------------------------------------------------------
// 2. Configuration Sets Actions
// -------------------------------------------------------------
export async function listConfigurationSetsAction(): Promise<{
  success: boolean;
  configurationSets: SESConfigurationSetSummary[];
  error?: string;
}> {
  try {
    const res = await ses.send(new ListConfigurationSetsCommand({ MaxItems: 100 }));
    const rawSets = res.ConfigurationSets || [];

    const summaries: SESConfigurationSetSummary[] = rawSets.map((s) => ({
      name: s.Name || "",
      sendingEnabled: true,
      reputationMetricsEnabled: true,
    }));

    return { success: true, configurationSets: summaries };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, configurationSets: [], error: message };
  }
}

export async function describeConfigurationSetAction(name: string): Promise<{
  success: boolean;
  configurationSet?: { name: string };
  error?: string;
}> {
  try {
    const res = await ses.send(
      new DescribeConfigurationSetCommand({
        ConfigurationSetName: name,
      })
    );
    return {
      success: true,
      configurationSet: {
        name: res.ConfigurationSet?.Name || name,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function createConfigurationSetAction(name: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: "Configuration set name is required." };
    }
    await ses.send(
      new CreateConfigurationSetCommand({
        ConfigurationSet: { Name: trimmed },
      })
    );
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function deleteConfigurationSetAction(name: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await ses.send(
      new DeleteConfigurationSetCommand({
        ConfigurationSetName: name,
      })
    );
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// -------------------------------------------------------------
// 3. Email Templates Actions
// -------------------------------------------------------------
export async function listTemplatesAction(): Promise<{
  success: boolean;
  templates: SESTemplateSummary[];
  error?: string;
}> {
  try {
    const res = await ses.send(new ListTemplatesCommand({ MaxItems: 100 }));
    const rawTemplates = res.TemplatesMetadata || [];

    const summaries: SESTemplateSummary[] = rawTemplates.map((t) => ({
      name: t.Name || "",
      createdTimestamp: t.CreatedTimestamp?.toISOString(),
    }));

    return { success: true, templates: summaries };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, templates: [], error: message };
  }
}

export async function getTemplateAction(name: string): Promise<{
  success: boolean;
  template?: SESTemplateDetails;
  error?: string;
}> {
  try {
    const res = await ses.send(new GetTemplateCommand({ TemplateName: name }));
    const t = res.Template;
    if (!t) {
      return { success: false, error: "Template not found." };
    }
    return {
      success: true,
      template: {
        name: t.TemplateName || name,
        subjectPart: t.SubjectPart || "",
        htmlPart: t.HtmlPart,
        textPart: t.TextPart,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function createTemplateAction(input: {
  name: string;
  subjectPart: string;
  htmlPart?: string;
  textPart?: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const trimmed = input.name.trim();
    if (!trimmed) {
      return { success: false, error: "Template name is required." };
    }
    if (!input.subjectPart.trim()) {
      return { success: false, error: "Subject line is required." };
    }
    if (!input.htmlPart?.trim() && !input.textPart?.trim()) {
      return { success: false, error: "Either HTML or Plain Text content must be specified." };
    }

    await ses.send(
      new CreateTemplateCommand({
        Template: {
          TemplateName: trimmed,
          SubjectPart: input.subjectPart.trim(),
          HtmlPart: input.htmlPart || undefined,
          TextPart: input.textPart || undefined,
        },
      })
    );
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function updateTemplateAction(input: {
  name: string;
  subjectPart: string;
  htmlPart?: string;
  textPart?: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const trimmed = input.name.trim();
    if (!trimmed) {
      return { success: false, error: "Template name is required." };
    }
    if (!input.subjectPart.trim()) {
      return { success: false, error: "Subject line is required." };
    }
    if (!input.htmlPart?.trim() && !input.textPart?.trim()) {
      return { success: false, error: "Either HTML or Plain Text content must be specified." };
    }

    await ses.send(
      new UpdateTemplateCommand({
        Template: {
          TemplateName: trimmed,
          SubjectPart: input.subjectPart.trim(),
          HtmlPart: input.htmlPart || undefined,
          TextPart: input.textPart || undefined,
        },
      })
    );
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function deleteTemplateAction(name: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await ses.send(new DeleteTemplateCommand({ TemplateName: name }));
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// -------------------------------------------------------------
// 4. Account Metrics, Quotas & Sending
// -------------------------------------------------------------
export async function getAccountSendingStatusAction(): Promise<{
  success: boolean;
  metrics?: SESAccountMetrics;
  error?: string;
}> {
  try {
    const [quotaRes, statsRes, v2AccountRes] = await Promise.all([
      ses.send(new GetSendQuotaCommand({})).catch(() => null),
      ses.send(new GetSendStatisticsCommand({})).catch(() => null),
      sesv2.send(new GetAccountCommand({})).catch(() => null),
    ]);

    const max24HourSend = quotaRes?.Max24HourSend ?? 200;
    const sentLast24Hours = Math.max(0, quotaRes?.SentLast24Hours ?? 0);
    const maxSendRate = quotaRes?.MaxSendRate ?? 1.0;

    const prodAccess = v2AccountRes?.ProductionAccessEnabled ?? false;
    const sendingEnabled = v2AccountRes?.SendingEnabled ?? true;
    const enforcementStatus = v2AccountRes?.EnforcementStatus ?? "HEALTHY";

    // Calculate bounce and complaint metrics from send data points if available
    let totalBounces = 0;
    let totalComplaints = 0;
    let totalDeliveryAttempts = 0;

    const dataPoints = statsRes?.SendDataPoints || [];
    for (const dp of dataPoints) {
      totalBounces += dp.Bounces || 0;
      totalComplaints += dp.Complaints || 0;
      totalDeliveryAttempts += dp.DeliveryAttempts || 0;
    }

    const bounceRate = totalDeliveryAttempts > 0 ? (totalBounces / totalDeliveryAttempts) * 100 : 0.0;
    const complaintRate = totalDeliveryAttempts > 0 ? (totalComplaints / totalDeliveryAttempts) * 100 : 0.0;

    const metrics: SESAccountMetrics = {
      productionAccessEnabled: prodAccess,
      sendingEnabled,
      enforcementStatus,
      max24HourSend,
      sentLast24Hours,
      maxSendRate,
      bounceRate: Number(bounceRate.toFixed(2)),
      complaintRate: Number(complaintRate.toFixed(2)),
    };

    return { success: true, metrics };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function sendTestEmailAction(input: {
  from: string;
  to: string[];
  subject: string;
  bodyType: "formatted" | "raw";
  bodyText?: string;
  bodyHtml?: string;
  configurationSetName?: string;
}): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const fromAddress = input.from.trim();
    if (!fromAddress) {
      return { success: false, error: "Sender email address is required." };
    }
    const recipients = input.to.map((e) => e.trim()).filter(Boolean);
    if (recipients.length === 0) {
      return { success: false, error: "At least one recipient email address is required." };
    }

    const command = new SendEmailCommand({
      Source: fromAddress,
      Destination: {
        ToAddresses: recipients,
      },
      Message: {
        Subject: {
          Data: input.subject || "Amazon SES Test Email",
          Charset: "UTF-8",
        },
        Body: {
          Text: input.bodyText
            ? {
                Data: input.bodyText,
                Charset: "UTF-8",
              }
            : undefined,
          Html: input.bodyHtml
            ? {
                Data: input.bodyHtml,
                Charset: "UTF-8",
              }
            : undefined,
        },
      },
      ConfigurationSetName: input.configurationSetName || undefined,
    });

    const res = await ses.send(command);
    return { success: true, messageId: res.MessageId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// -------------------------------------------------------------
// 5. Suppression List Actions (SES v2)
// -------------------------------------------------------------
export async function listSuppressedDestinationsAction(): Promise<{
  success: boolean;
  destinations: SESSuppressedDestination[];
  error?: string;
}> {
  try {
    const res = await sesv2.send(new ListSuppressedDestinationsCommand({ PageSize: 100 }));
    const summaries: SESSuppressedDestination[] = (res.SuppressedDestinationSummaries || []).map((d) => ({
      emailAddress: d.EmailAddress || "",
      reason: (d.Reason as "BOUNCE" | "COMPLAINT") || "BOUNCE",
      lastUpdateTime: d.LastUpdateTime?.toISOString(),
    }));

    return { success: true, destinations: summaries };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, destinations: [], error: message };
  }
}

export async function putSuppressedDestinationAction(input: {
  emailAddress: string;
  reason: "BOUNCE" | "COMPLAINT";
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const trimmed = input.emailAddress.trim();
    if (!trimmed || !trimmed.includes("@")) {
      return { success: false, error: "Please provide a valid recipient email address." };
    }
    await sesv2.send(
      new PutSuppressedDestinationCommand({
        EmailAddress: trimmed,
        Reason: input.reason,
      })
    );
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function deleteSuppressedDestinationAction(emailAddress: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await sesv2.send(
      new DeleteSuppressedDestinationCommand({
        EmailAddress: emailAddress,
      })
    );
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// -------------------------------------------------------------
// 6. SMTP Settings & Credentials Generation
// -------------------------------------------------------------
export async function getSmtpSettingsAction() {
  return {
    serverName: "127.0.0.1",
    publicServerName: "email-smtp.us-east-1.amazonaws.com",
    ports: [25, 465, 587, 2587],
    tls: "STARTTLS (Ports 25, 587, 2587) or TLS Wrapper (Port 465)",
    authentication: "Required (SES SMTP Username & Password derived from IAM User)",
  };
}

export async function createSmtpCredentialsAction(requestedUserName?: string): Promise<{
  success: boolean;
  iamUserName?: string;
  smtpUsername?: string;
  smtpPassword?: string;
  error?: string;
}> {
  try {
    const userName = requestedUserName?.trim() || `ses-smtp-user.${Date.now()}`;

    // 1. Create IAM User
    await iam.send(new CreateUserCommand({ UserName: userName }));

    // 2. Attach AmazonSESFullAccess policy or policy granting SendRawEmail
    await iam
      .send(
        new AttachUserPolicyCommand({
          UserName: userName,
          PolicyArn: "arn:aws:iam::aws:policy/AmazonSESFullAccess",
        })
      )
      .catch(() => null);

    // 3. Create Access Key
    const accessKeyRes = await iam.send(new CreateAccessKeyCommand({ UserName: userName }));
    const accessKeyId = accessKeyRes.AccessKey?.AccessKeyId;
    const secretAccessKey = accessKeyRes.AccessKey?.SecretAccessKey;

    if (!accessKeyId || !secretAccessKey) {
      return { success: false, error: "Failed to generate IAM credentials for SMTP access." };
    }

    // 4. Calculate AWS RFC 2104 SES SMTP Password
    // Message = "SendRawEmail", Version = 0x02
    const MESSAGE = "SendRawEmail";
    const VERSION = Buffer.from([0x02]);
    const signature = crypto.createHmac("sha256", secretAccessKey).update(MESSAGE).digest();
    const smtpPassword = Buffer.concat([VERSION, signature]).toString("base64");

    return {
      success: true,
      iamUserName: userName,
      smtpUsername: accessKeyId,
      smtpPassword,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// -------------------------------------------------------------
// 7. Related Resource Loaders (SNS, KMS, S3)
// -------------------------------------------------------------
export async function listSnsTopicsAction(): Promise<{
  topics: { name: string; arn: string }[];
}> {
  try {
    const res = await sns.send(new ListTopicsCommand({}));
    const topics = (res.Topics || []).map((t) => {
      const arn = t.TopicArn || "";
      const name = arn.split(":").pop() || arn;
      return { name, arn };
    });
    return { topics };
  } catch {
    return { topics: [] };
  }
}

export async function listKmsKeysAction(): Promise<{
  keys: { keyId: string; arn: string; description?: string }[];
}> {
  try {
    const res = await kms.send(new ListKeysCommand({ Limit: 50 }));
    const keys = await Promise.all(
      (res.Keys || []).map(async (k) => {
        const id = k.KeyId || "";
        const arn = k.KeyArn || "";
        try {
          const desc = await kms.send(new DescribeKeyCommand({ KeyId: id }));
          return { keyId: id, arn, description: desc.KeyMetadata?.Description };
        } catch {
          return { keyId: id, arn };
        }
      })
    );
    return { keys };
  } catch {
    return { keys: [] };
  }
}

export async function listS3BucketsAction(): Promise<{
  buckets: { name: string }[];
}> {
  try {
    const res = await s3.send(new ListBucketsCommand({}));
    const buckets = (res.Buckets || []).map((b) => ({ name: b.Name || "" }));
    return { buckets };
  } catch {
    return { buckets: [] };
  }
}
