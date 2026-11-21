export interface LogGroupSummary {
  logGroupName: string;
  logGroupArn?: string;
  creationTime: number;
  retentionInDays?: number;
  metricFilterCount: number;
  storedBytes: number;
  kmsKeyId?: string;
  logGroupClass?: string;
  dataProtectionStatus?: string;
  inheritedProperties?: string[];
}

export interface LogStreamSummary {
  logStreamName: string;
  arn?: string;
  creationTime: number;
  firstEventTimestamp?: number;
  lastEventTimestamp?: number;
  lastIngestionTime?: number;
  storedBytes?: number;
}

export interface LogEventItem {
  timestamp: number;
  message: string;
  ingestionTime?: number;
}

export interface FilteredLogEventItem {
  eventId?: string;
  logStreamName?: string;
  timestamp: number;
  message: string;
  ingestionTime?: number;
}

export interface MetricTransformation {
  metricName: string;
  metricNamespace: string;
  metricValue: string;
  defaultValue?: number;
  unit?: string;
  dimensions?: Record<string, string>;
}

export interface MetricFilterSummary {
  filterName: string;
  filterPattern?: string;
  metricTransformations: MetricTransformation[];
  creationTime?: number;
  logGroupName: string;
}

export interface SubscriptionFilterSummary {
  filterName: string;
  logGroupName: string;
  filterPattern: string;
  destinationArn: string;
  roleArn?: string;
  distribution?: "Random" | "ByLogStream";
  creationTime?: number;
}

export interface KmsKeyOption {
  keyId: string;
  arn: string;
  aliasName?: string;
  description?: string;
}

export interface IamRoleOption {
  roleName: string;
  arn: string;
}

export interface KinesisStreamOption {
  streamName: string;
  streamArn: string;
}

export interface LambdaFunctionOption {
  functionName: string;
  functionArn: string;
}
