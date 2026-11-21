export interface QueueSummary {
  url: string;
  name: string;
  arn: string;
  type: "Standard" | "FIFO";
  created: string;
  messagesAvailable: number;
  messagesInFlight: number;
  messagesDelayed: number;
  visibilityTimeout: number;
  retentionPeriod: number;
  delaySeconds: number;
  maxMessageSize: number;
  receiveWaitTime: number;
  serverSideEncryption?: string;
  kmsMasterKeyId?: string;
}

export interface QueueAttributesMap {
  [key: string]: string;
}

export interface SQSMessageAttribute {
  name: string;
  type: "String" | "Number" | "Binary";
  value: string;
}

export interface SQSMessageItem {
  messageId: string;
  body: string;
  receiptHandle: string;
  sentTimestamp: string;
  approximateReceiveCount?: number;
  approximateFirstReceiveTimestamp?: string;
  md5OfBody?: string;
  messageGroupId?: string;
  messageDeduplicationId?: string;
  sequenceNumber?: string;
  attributes?: Record<string, string>;
  messageAttributes?: Record<string, { DataType?: string; StringValue?: string }>;
}

export interface KmsKeyOption {
  keyId: string;
  keyArn: string;
  alias?: string;
}

export interface LambdaFunctionOption {
  functionName: string;
  functionArn: string;
  runtime?: string;
}
