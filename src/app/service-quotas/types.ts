export interface ServiceInfo {
  serviceCode: string;
  serviceName: string;
}

export interface ServiceQuotaItem {
  serviceCode: string;
  serviceName: string;
  quotaArn: string;
  quotaCode: string;
  quotaName: string;
  value: number;
  unit: string;
  adjustable: boolean;
  globalQuota: boolean;
  defaultValue?: number;
  usageMetric?: {
    metricNamespace?: string;
    metricName?: string;
    metricDimensions?: Record<string, string>;
    metricStatisticRecommendation?: string;
  };
  period?: {
    periodValue?: number;
    periodUnit?: string;
  };
  quotaAppliedAtLevel?: string;
}

export interface RequestedServiceQuotaChange {
  id: string;
  caseId?: string;
  serviceCode: string;
  serviceName: string;
  quotaCode: string;
  quotaName: string;
  desiredValue: number;
  status:
    | "PENDING"
    | "CASE_OPENED"
    | "APPROVED"
    | "DENIED"
    | "CASE_CLOSED"
    | "NOT_APPROVED"
    | "INVALID_REQUEST";
  created?: string;
  lastUpdated?: string;
  requester?: string;
  quotaArn?: string;
  globalQuota?: boolean;
  unit?: string;
  quotaRequestedAtLevel?: string;
}

export interface ServiceQuotaTemplateItem {
  serviceCode: string;
  serviceName: string;
  quotaCode: string;
  quotaName: string;
  desiredValue: number;
  awsRegion: string;
  unit?: string;
  globalQuota?: boolean;
}

export interface QuotaTag {
  key: string;
  value: string;
}
