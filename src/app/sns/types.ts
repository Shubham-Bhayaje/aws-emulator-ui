export interface TopicSummary {
  arn: string;
  name: string;
  type: "Standard" | "FIFO";
  displayName?: string;
  subscriptionsConfirmed: number;
  subscriptionsPending: number;
  subscriptionsDeleted: number;
}

export interface TopicDetail {
  arn: string;
  name: string;
  type: "Standard" | "FIFO";
  displayName?: string;
  owner: string;
  policy?: string;
  deliveryPolicy?: string;
  effectiveDeliveryPolicy?: string;
  kmsMasterKeyId?: string;
  contentBasedDeduplication?: boolean;
  subscriptionsConfirmed: number;
  subscriptionsPending: number;
  subscriptionsDeleted: number;
  tags: Record<string, string>;
}

export interface SubscriptionSummary {
  arn: string;
  protocol: string;
  endpoint: string;
  topicArn: string;
  topicName: string;
  status: "Confirmed" | "PendingConfirmation" | "Deleted";
  owner: string;
}

export interface SubscriptionDetail {
  arn: string;
  protocol: string;
  endpoint: string;
  topicArn: string;
  owner: string;
  status: "Confirmed" | "PendingConfirmation" | "Deleted";
  rawMessageDelivery?: boolean;
  filterPolicy?: string;
  filterPolicyScope?: "MessageAttributes" | "MessageBody";
  redrivePolicy?: { deadLetterTargetArn?: string };
  confirmationWasAuthenticated?: boolean;
  subscriptionPrincipal?: string;
}

export interface KmsKeyOption {
  keyId: string;
  keyArn: string;
  alias?: string;
}

export interface SqsQueueOption {
  name: string;
  url: string;
  arn: string;
  isFifo: boolean;
}

export interface LambdaFunctionOption {
  functionName: string;
  functionArn: string;
  runtime?: string;
}

export interface MessageAttribute {
  name: string;
  type: "String" | "Number" | "Binary";
  value: string;
}
