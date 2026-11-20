"use server";

import { serviceQuotas } from "@/lib/aws";
import {
  ListServicesCommand,
  ListServiceQuotasCommand,
  ListAWSDefaultServiceQuotasCommand,
  GetServiceQuotaCommand,
  GetAWSDefaultServiceQuotaCommand,
  RequestServiceQuotaIncreaseCommand,
  ListRequestedServiceQuotaChangeHistoryCommand,
  ListRequestedServiceQuotaChangeHistoryByQuotaCommand,
  GetAssociationForServiceQuotaTemplateCommand,
  AssociateServiceQuotaTemplateCommand,
  DisassociateServiceQuotaTemplateCommand,
  ListServiceQuotaIncreaseRequestsInTemplateCommand,
  PutServiceQuotaIncreaseRequestIntoTemplateCommand,
  DeleteServiceQuotaIncreaseRequestFromTemplateCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
  GetAutoManagementConfigurationCommand,
} from "@aws-sdk/client-service-quotas";
import {
  ServiceInfo,
  ServiceQuotaItem,
  RequestedServiceQuotaChange,
  ServiceQuotaTemplateItem,
  QuotaTag,
} from "./types";

/**
 * Fetch all available AWS services from Service Quotas
 */
export async function fetchServices(): Promise<{
  success: boolean;
  data: ServiceInfo[];
  error?: string;
}> {
  try {
    const res = await serviceQuotas.send(new ListServicesCommand({}));
    const services: ServiceInfo[] = (res.Services || []).map((s) => ({
      serviceCode: s.ServiceCode || "",
      serviceName: s.ServiceName || "",
    }));
    // Sort alphabetically by ServiceName
    services.sort((a, b) => a.serviceName.localeCompare(b.serviceName));
    return { success: true, data: services };
  } catch (err: any) {
    console.error("fetchServices error:", err);
    return { success: false, data: [], error: err.message || "Failed to fetch services" };
  }
}

/**
 * Fetch quotas for a specific AWS service, enriched with default values
 */
export async function fetchServiceQuotas(
  serviceCode: string
): Promise<{
  success: boolean;
  serviceName?: string;
  data: ServiceQuotaItem[];
  error?: string;
}> {
  try {
    const [appliedRes, defaultRes] = await Promise.all([
      serviceQuotas.send(new ListServiceQuotasCommand({ ServiceCode: serviceCode })),
      serviceQuotas
        .send(new ListAWSDefaultServiceQuotasCommand({ ServiceCode: serviceCode }))
        .catch(() => ({ Quotas: [] })),
    ]);

    const defaultMap = new Map<string, number>();
    (defaultRes.Quotas || []).forEach((q) => {
      if (q.QuotaCode && q.Value !== undefined) {
        defaultMap.set(q.QuotaCode, q.Value);
      }
    });

    const quotas: ServiceQuotaItem[] = (appliedRes.Quotas || []).map((q) => ({
      serviceCode: q.ServiceCode || serviceCode,
      serviceName: q.ServiceName || "",
      quotaArn: q.QuotaArn || "",
      quotaCode: q.QuotaCode || "",
      quotaName: q.QuotaName || "",
      value: q.Value ?? 0,
      unit: q.Unit || "None",
      adjustable: q.Adjustable ?? false,
      globalQuota: q.GlobalQuota ?? false,
      defaultValue: defaultMap.get(q.QuotaCode || ""),
      usageMetric: q.UsageMetric
        ? {
            metricNamespace: q.UsageMetric.MetricNamespace,
            metricName: q.UsageMetric.MetricName,
            metricDimensions: q.UsageMetric.MetricDimensions as any,
            metricStatisticRecommendation: q.UsageMetric.MetricStatisticRecommendation,
          }
        : undefined,
      period: q.Period
        ? {
            periodValue: q.Period.PeriodValue,
            periodUnit: q.Period.PeriodUnit,
          }
        : undefined,
      quotaAppliedAtLevel: q.QuotaAppliedAtLevel,
    }));

    const serviceName = quotas[0]?.serviceName || serviceCode;

    return { success: true, serviceName, data: quotas };
  } catch (err: any) {
    console.error("fetchServiceQuotas error:", err);
    return {
      success: false,
      data: [],
      error: err.message || `Failed to fetch quotas for service ${serviceCode}`,
    };
  }
}

/**
 * Fetch quota details, default baseline, request history, and tags
 */
export async function fetchQuotaDetail(
  serviceCode: string,
  quotaCode: string
): Promise<{
  success: boolean;
  quota?: ServiceQuotaItem;
  history: RequestedServiceQuotaChange[];
  tags: QuotaTag[];
  error?: string;
}> {
  try {
    const [quotaRes, defaultRes, historyRes] = await Promise.all([
      serviceQuotas.send(
        new GetServiceQuotaCommand({ ServiceCode: serviceCode, QuotaCode: quotaCode })
      ),
      serviceQuotas
        .send(
          new GetAWSDefaultServiceQuotaCommand({ ServiceCode: serviceCode, QuotaCode: quotaCode })
        )
        .catch(() => ({ Quota: undefined })),
      serviceQuotas
        .send(
          new ListRequestedServiceQuotaChangeHistoryByQuotaCommand({
            ServiceCode: serviceCode,
            QuotaCode: quotaCode,
          })
        )
        .catch(() => ({ RequestedQuotas: [] })),
    ]);

    const q = quotaRes.Quota;
    if (!q) {
      return { success: false, history: [], tags: [], error: "Quota not found" };
    }

    const quotaItem: ServiceQuotaItem = {
      serviceCode: q.ServiceCode || serviceCode,
      serviceName: q.ServiceName || "",
      quotaArn: q.QuotaArn || "",
      quotaCode: q.QuotaCode || quotaCode,
      quotaName: q.QuotaName || "",
      value: q.Value ?? 0,
      unit: q.Unit || "None",
      adjustable: q.Adjustable ?? false,
      globalQuota: q.GlobalQuota ?? false,
      defaultValue: defaultRes.Quota?.Value,
      usageMetric: q.UsageMetric
        ? {
            metricNamespace: q.UsageMetric.MetricNamespace,
            metricName: q.UsageMetric.MetricName,
            metricDimensions: q.UsageMetric.MetricDimensions as any,
            metricStatisticRecommendation: q.UsageMetric.MetricStatisticRecommendation,
          }
        : undefined,
      period: q.Period
        ? {
            periodValue: q.Period.PeriodValue,
            periodUnit: q.Period.PeriodUnit,
          }
        : undefined,
      quotaAppliedAtLevel: q.QuotaAppliedAtLevel,
    };

    // Parse history
    const history: RequestedServiceQuotaChange[] = (historyRes.RequestedQuotas || []).map((req) => ({
      id: req.Id || "",
      caseId: req.CaseId,
      serviceCode: req.ServiceCode || serviceCode,
      serviceName: req.ServiceName || quotaItem.serviceName,
      quotaCode: req.QuotaCode || quotaCode,
      quotaName: req.QuotaName || quotaItem.quotaName,
      desiredValue: req.DesiredValue ?? 0,
      status: (req.Status as any) || "PENDING",
      created: req.Created ? new Date(req.Created).toISOString() : undefined,
      lastUpdated: req.LastUpdated ? new Date(req.LastUpdated).toISOString() : undefined,
      requester: req.Requester,
      quotaArn: req.QuotaArn,
      globalQuota: req.GlobalQuota,
      unit: req.Unit,
      quotaRequestedAtLevel: req.QuotaRequestedAtLevel,
    }));

    // Fetch tags if QuotaArn is present
    let tags: QuotaTag[] = [];
    if (q.QuotaArn) {
      try {
        const tagRes = await serviceQuotas.send(
          new ListTagsForResourceCommand({ ResourceARN: q.QuotaArn })
        );
        tags = (tagRes.Tags || []).map((t) => ({ key: t.Key || "", value: t.Value || "" }));
      } catch (e) {
        console.warn("Could not fetch tags for quota:", e);
      }
    }

    return {
      success: true,
      quota: quotaItem,
      history,
      tags,
    };
  } catch (err: any) {
    console.error("fetchQuotaDetail error:", err);
    return {
      success: false,
      history: [],
      tags: [],
      error: err.message || "Failed to fetch quota details",
    };
  }
}

/**
 * Request an increase for a specific quota at account level
 */
export async function requestQuotaIncreaseAction(
  serviceCode: string,
  quotaCode: string,
  desiredValue: number
): Promise<{
  success: boolean;
  data?: RequestedServiceQuotaChange;
  error?: string;
}> {
  try {
    const res = await serviceQuotas.send(
      new RequestServiceQuotaIncreaseCommand({
        ServiceCode: serviceCode,
        QuotaCode: quotaCode,
        DesiredValue: desiredValue,
      })
    );

    const r = res.RequestedQuota;
    if (!r) {
      return { success: false, error: "No request response returned from Service Quotas" };
    }

    return {
      success: true,
      data: {
        id: r.Id || "",
        caseId: r.CaseId,
        serviceCode: r.ServiceCode || serviceCode,
        serviceName: r.ServiceName || "",
        quotaCode: r.QuotaCode || quotaCode,
        quotaName: r.QuotaName || "",
        desiredValue: r.DesiredValue ?? desiredValue,
        status: (r.Status as any) || "PENDING",
        created: r.Created ? new Date(r.Created).toISOString() : undefined,
        lastUpdated: r.LastUpdated ? new Date(r.LastUpdated).toISOString() : undefined,
        requester: r.Requester,
        quotaArn: r.QuotaArn,
        globalQuota: r.GlobalQuota,
        unit: r.Unit,
      },
    };
  } catch (err: any) {
    console.error("requestQuotaIncreaseAction error:", err);
    return { success: false, error: err.message || "Failed to request quota increase" };
  }
}

/**
 * Fetch all quota request change history across all services
 */
export async function fetchQuotaRequestHistory(): Promise<{
  success: boolean;
  data: RequestedServiceQuotaChange[];
  error?: string;
}> {
  try {
    const res = await serviceQuotas.send(
      new ListRequestedServiceQuotaChangeHistoryCommand({})
    );
    const history: RequestedServiceQuotaChange[] = (res.RequestedQuotas || []).map((req) => ({
      id: req.Id || "",
      caseId: req.CaseId,
      serviceCode: req.ServiceCode || "",
      serviceName: req.ServiceName || "",
      quotaCode: req.QuotaCode || "",
      quotaName: req.QuotaName || "",
      desiredValue: req.DesiredValue ?? 0,
      status: (req.Status as any) || "PENDING",
      created: req.Created ? new Date(req.Created).toISOString() : undefined,
      lastUpdated: req.LastUpdated ? new Date(req.LastUpdated).toISOString() : undefined,
      requester: req.Requester,
      quotaArn: req.QuotaArn,
      globalQuota: req.GlobalQuota,
      unit: req.Unit,
      quotaRequestedAtLevel: req.QuotaRequestedAtLevel,
    }));

    return { success: true, data: history };
  } catch (err: any) {
    console.error("fetchQuotaRequestHistory error:", err);
    return { success: false, data: [], error: err.message || "Failed to fetch request history" };
  }
}

/**
 * Fetch quota request template association status
 */
export async function fetchTemplateAssociation(): Promise<{
  success: boolean;
  associated: boolean;
  error?: string;
}> {
  try {
    const res = await serviceQuotas.send(
      new GetAssociationForServiceQuotaTemplateCommand({})
    );
    const associated = res.ServiceQuotaTemplateAssociationStatus === "ASSOCIATED";
    return { success: true, associated };
  } catch (err: any) {
    if (err.name === "ServiceQuotaTemplateNotInUseException" || err.message?.includes("not associated")) {
      return { success: true, associated: false };
    }
    console.error("fetchTemplateAssociation error:", err);
    return { success: false, associated: false, error: err.message };
  }
}

/**
 * Associate quota request template
 */
export async function associateTemplateAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await serviceQuotas.send(new AssociateServiceQuotaTemplateCommand({}));
    return { success: true };
  } catch (err: any) {
    console.error("associateTemplateAction error:", err);
    return { success: false, error: err.message || "Failed to associate template" };
  }
}

/**
 * Disassociate quota request template
 */
export async function disassociateTemplateAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await serviceQuotas.send(new DisassociateServiceQuotaTemplateCommand({}));
    return { success: true };
  } catch (err: any) {
    console.error("disassociateTemplateAction error:", err);
    return { success: false, error: err.message || "Failed to disassociate template" };
  }
}

/**
 * List all quota increase requests configured in template
 */
export async function fetchTemplateQuotas(): Promise<{
  success: boolean;
  data: ServiceQuotaTemplateItem[];
  error?: string;
}> {
  try {
    const res = await serviceQuotas.send(
      new ListServiceQuotaIncreaseRequestsInTemplateCommand({})
    );
    const list: ServiceQuotaTemplateItem[] = (
      res.ServiceQuotaIncreaseRequestInTemplateList || []
    ).map((item) => ({
      serviceCode: item.ServiceCode || "",
      serviceName: item.ServiceName || "",
      quotaCode: item.QuotaCode || "",
      quotaName: item.QuotaName || "",
      desiredValue: item.DesiredValue ?? 0,
      awsRegion: item.AwsRegion || "us-east-1",
      unit: item.Unit,
      globalQuota: item.GlobalQuota,
    }));
    return { success: true, data: list };
  } catch (err: any) {
    console.error("fetchTemplateQuotas error:", err);
    return { success: false, data: [], error: err.message || "Failed to fetch template quotas" };
  }
}

/**
 * Add or update quota increase request in template
 */
export async function addQuotaToTemplateAction(
  serviceCode: string,
  quotaCode: string,
  awsRegion: string,
  desiredValue: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await serviceQuotas.send(
      new PutServiceQuotaIncreaseRequestIntoTemplateCommand({
        ServiceCode: serviceCode,
        QuotaCode: quotaCode,
        AwsRegion: awsRegion,
        DesiredValue: desiredValue,
      })
    );
    return { success: true };
  } catch (err: any) {
    console.error("addQuotaToTemplateAction error:", err);
    return { success: false, error: err.message || "Failed to add quota to template" };
  }
}

/**
 * Delete quota increase request from template
 */
export async function deleteQuotaFromTemplateAction(
  serviceCode: string,
  quotaCode: string,
  awsRegion: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await serviceQuotas.send(
      new DeleteServiceQuotaIncreaseRequestFromTemplateCommand({
        ServiceCode: serviceCode,
        QuotaCode: quotaCode,
        AwsRegion: awsRegion,
      })
    );
    return { success: true };
  } catch (err: any) {
    console.error("deleteQuotaFromTemplateAction error:", err);
    return { success: false, error: err.message || "Failed to delete quota from template" };
  }
}

/**
 * Tag a quota resource
 */
export async function tagQuotaAction(
  resourceArn: string,
  tags: QuotaTag[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await serviceQuotas.send(
      new TagResourceCommand({
        ResourceARN: resourceArn,
        Tags: tags.map((t) => ({ Key: t.key, Value: t.value })),
      })
    );
    return { success: true };
  } catch (err: any) {
    console.error("tagQuotaAction error:", err);
    return { success: false, error: err.message || "Failed to tag quota" };
  }
}

/**
 * Untag a quota resource
 */
export async function untagQuotaAction(
  resourceArn: string,
  tagKeys: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await serviceQuotas.send(
      new UntagResourceCommand({
        ResourceARN: resourceArn,
        TagKeys: tagKeys,
      })
    );
    return { success: true };
  } catch (err: any) {
    console.error("untagQuotaAction error:", err);
    return { success: false, error: err.message || "Failed to untag quota" };
  }
}

/**
 * Fetch auto-management status
 */
export async function fetchAutoManagementConfig(): Promise<{
  success: boolean;
  optInStatus: string;
  error?: string;
}> {
  try {
    const res = await serviceQuotas.send(
      new GetAutoManagementConfigurationCommand({})
    );
    return { success: true, optInStatus: res.OptInStatus || "DISABLED" };
  } catch (err: any) {
    console.error("fetchAutoManagementConfig error:", err);
    return { success: false, optInStatus: "DISABLED", error: err.message };
  }
}
