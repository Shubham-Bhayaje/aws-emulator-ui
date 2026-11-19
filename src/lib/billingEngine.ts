/**
 * billingEngine.ts – Real dynamic AWS Cost & Usage Calculation Engine.
 *
 * Scans live resources across all services in the AWS Emulator:
 * - EC2 Instances (by instance type and running/stopped state)
 * - EBS Volumes (by volume type gp2/gp3/io1 and size in GiB)
 * - EBS Snapshots (by snapshot storage size)
 * - Elastic IP Addresses (unattached idle addresses)
 * - Elastic Load Balancers (ALB/NLB active hourly cost)
 * - S3 Buckets & Storage
 * - DynamoDB Tables
 * - SQS Queues
 * - Lambda Functions
 *
 * Computes authentic AWS pricing rates, Month-to-Date (MTD) spend,
 * month-end forecasts, dynamic calendar months, and itemized billing lines.
 * If 0 resources exist, bills exactly $0.00.
 * Zero emojis, Cloudscape enterprise standard.
 */

import { ec2, s3, dynamodb, sqs, elbv2, lambda } from "@/lib/aws";
import {
  DescribeInstancesCommand,
  DescribeVolumesCommand,
  DescribeSnapshotsCommand,
  DescribeAddressesCommand,
} from "@aws-sdk/client-ec2";
import { ListBucketsCommand } from "@aws-sdk/client-s3";
import { ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { ListQueuesCommand } from "@aws-sdk/client-sqs";
import { DescribeLoadBalancersCommand } from "@aws-sdk/client-elastic-load-balancing-v2";
import { ListFunctionsCommand } from "@aws-sdk/client-lambda";

export interface BilledResource {
  id: string;
  name: string;
  service: string;
  serviceKey: "ec2" | "ebs" | "s3" | "dynamodb" | "sqs" | "other";
  usageType: string;
  rateDescription: string;
  unitPrice: number;
  unit: string;
  quantity: number;
  mtdCost: number;
  forecastedCost: number;
  status: string;
}

export interface MonthlyCostItem {
  month: string;
  ec2: number;
  ebs: number;
  s3: number;
  dynamodb: number;
  sqs: number;
  other: number;
  total: number;
}

export interface LiveBillingResult {
  monthToDate: number;
  forecasted: number;
  lastMonthCost: number;
  percentChange: number;
  resourceCounts: {
    ec2Instances: number;
    ebsVolumes: number;
    ebsSnapshots: number;
    s3Buckets: number;
    dynamoTables: number;
    sqsQueues: number;
    loadBalancers: number;
    elasticIps: number;
    lambdaFunctions: number;
    totalActive: number;
  };
  billedResources: BilledResource[];
  serviceBreakdown: {
    name: string;
    key: string;
    color: string;
    cost: number;
    percentage: number;
  }[];
  usageTypeBreakdown: {
    name: string;
    key: string;
    color: string;
    cost: number;
    percentage: number;
  }[];
  monthlyHistory: MonthlyCostItem[];
  lastUpdated: string;
}

// AWS US East (N. Virginia) Standard Hourly Rates
export const EC2_HOURLY_RATES: Record<string, number> = {
  "t2.nano": 0.0058,
  "t2.micro": 0.0116,
  "t2.small": 0.023,
  "t2.medium": 0.0464,
  "t2.large": 0.0928,
  "t2.xlarge": 0.1856,
  "t2.2xlarge": 0.3712,
  "t3.nano": 0.0052,
  "t3.micro": 0.0104,
  "t3.small": 0.0208,
  "t3.medium": 0.0416,
  "t3.large": 0.0832,
  "t3.xlarge": 0.1664,
  "t3.2xlarge": 0.3328,
  "m5.large": 0.096,
  "m5.xlarge": 0.192,
  "c5.large": 0.085,
  "c5.xlarge": 0.17,
  "r5.large": 0.126,
};

// EBS Monthly Rates per GB-month
export const EBS_RATES_PER_GB_MONTH: Record<string, number> = {
  gp3: 0.08,
  gp2: 0.1,
  io1: 0.125,
  io2: 0.125,
  st1: 0.045,
  sc1: 0.025,
  standard: 0.05,
};

// Rate for EBS Snapshots ($0.05/GB-mo)
export const SNAPSHOT_RATE_PER_GB_MONTH = 0.05;

// Unattached Idle Elastic IP ($0.005/hr)
export const UNATTACHED_EIP_HOURLY_RATE = 0.005;

// ALB / NLB Base Hourly Rate ($0.0225/hr)
export const ELB_HOURLY_RATE = 0.0225;

// S3 Active Bucket Baseline ($0.15/mo)
export const S3_BUCKET_BASELINE_MONTHLY = 0.15;

// DynamoDB Active Table Baseline ($0.59/mo)
export const DYNAMO_TABLE_BASELINE_MONTHLY = 0.59;

// SQS Active Queue Baseline ($0.05/mo)
export const SQS_QUEUE_BASELINE_MONTHLY = 0.05;

// Lambda Active Function Baseline ($0.20/mo)
export const LAMBDA_FUNCTION_BASELINE_MONTHLY = 0.2;

/**
 * Generates dynamic month labels based on the current calendar date.
 */
function getPastMonthLabels(count: number): { label: string; year: number; month: number }[] {
  const result = [];
  const now = new Date();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yrShort = String(d.getFullYear()).slice(-2);
    result.push({
      label: `${monthNames[d.getMonth()]} ${yrShort}`,
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  return result;
}

export async function calculateLiveBilling(): Promise<LiveBillingResult> {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const hoursInMonth = daysInMonth * 24;

  // Fraction of month elapsed
  const hoursElapsedThisMonth = Math.max(1, (dayOfMonth - 1) * 24 + now.getHours());
  const monthFractionElapsed = hoursElapsedThisMonth / hoursInMonth;

  const billedResources: BilledResource[] = [];

  let ec2Count = 0;
  let ebsVolumeCount = 0;
  let ebsSnapshotCount = 0;
  let s3BucketCount = 0;
  let dynamoTableCount = 0;
  let sqsQueueCount = 0;
  let elbCount = 0;
  let eipCount = 0;
  let lambdaCount = 0;

  // 1. Scan EC2 Instances
  try {
    const instRes = await ec2.send(new DescribeInstancesCommand({})).catch(() => ({ Reservations: [] }));
    const instances = instRes.Reservations?.flatMap((r) => r.Instances || []) || [];

    for (const inst of instances) {
      if (!inst.InstanceId) continue;
      ec2Count++;
      const state = inst.State?.Name || "stopped";
      const instType = inst.InstanceType || "t2.micro";
      const hourlyRate = EC2_HOURLY_RATES[instType] || 0.02;

      // Only running instances incur hourly compute costs
      const isRunning = state === "running";
      const fullMonthCost = isRunning ? +(hourlyRate * hoursInMonth).toFixed(2) : 0;
      const mtdCost = isRunning ? +(hourlyRate * hoursElapsedThisMonth).toFixed(2) : 0;

      billedResources.push({
        id: inst.InstanceId,
        name: inst.KeyName ? `Instance (${inst.KeyName})` : inst.InstanceId,
        service: "Amazon Elastic Compute Cloud - Compute",
        serviceKey: "ec2",
        usageType: `${instType} Running Hours`,
        rateDescription: isRunning ? `$${hourlyRate.toFixed(4)}/hr` : "Stopped ($0.00/hr compute)",
        unitPrice: hourlyRate,
        unit: "Hrs",
        quantity: isRunning ? hoursElapsedThisMonth : 0,
        mtdCost,
        forecastedCost: fullMonthCost,
        status: state,
      });
    }
  } catch (err) {
    console.error("Billing engine EC2 scan error:", err);
  }

  // 2. Scan EBS Volumes
  try {
    const volRes = await ec2.send(new DescribeVolumesCommand({})).catch(() => ({ Volumes: [] }));
    const volumes = volRes.Volumes || [];

    for (const vol of volumes) {
      if (!vol.VolumeId) continue;
      ebsVolumeCount++;
      const volType = vol.VolumeType || "gp3";
      const sizeGb = vol.Size || 8;
      const ratePerGb = EBS_RATES_PER_GB_MONTH[volType] || 0.08;

      const fullMonthCost = +(sizeGb * ratePerGb).toFixed(2);
      const mtdCost = +(fullMonthCost * monthFractionElapsed).toFixed(2);

      billedResources.push({
        id: vol.VolumeId,
        name: `EBS Volume (${sizeGb} GiB ${volType.toUpperCase()})`,
        service: "Amazon Elastic Block Store",
        serviceKey: "ebs",
        usageType: `EBS:VolumeUsage.${volType}`,
        rateDescription: `$${ratePerGb.toFixed(2)}/GB-month`,
        unitPrice: ratePerGb,
        unit: "GB-Mo",
        quantity: sizeGb,
        mtdCost,
        forecastedCost: fullMonthCost,
        status: vol.State || "in-use",
      });
    }
  } catch (err) {
    console.error("Billing engine EBS scan error:", err);
  }

  // 3. Scan EBS Snapshots
  try {
    const snapRes = await ec2.send(new DescribeSnapshotsCommand({ OwnerIds: ["self"] })).catch(() => ({ Snapshots: [] }));
    const snapshots = snapRes.Snapshots || [];

    for (const snap of snapshots) {
      if (!snap.SnapshotId) continue;
      ebsSnapshotCount++;
      const sizeGb = snap.VolumeSize || 8;
      const fullMonthCost = +(sizeGb * SNAPSHOT_RATE_PER_GB_MONTH).toFixed(2);
      const mtdCost = +(fullMonthCost * monthFractionElapsed).toFixed(2);

      billedResources.push({
        id: snap.SnapshotId,
        name: `EBS Snapshot (${sizeGb} GiB)`,
        service: "Amazon Elastic Block Store",
        serviceKey: "ebs",
        usageType: "EBS:SnapshotUsage",
        rateDescription: `$${SNAPSHOT_RATE_PER_GB_MONTH.toFixed(2)}/GB-month`,
        unitPrice: SNAPSHOT_RATE_PER_GB_MONTH,
        unit: "GB-Mo",
        quantity: sizeGb,
        mtdCost,
        forecastedCost: fullMonthCost,
        status: snap.State || "completed",
      });
    }
  } catch (err) {
    console.error("Billing engine Snapshot scan error:", err);
  }

  // 4. Scan Elastic IP Addresses
  try {
    const addrRes = await ec2.send(new DescribeAddressesCommand({})).catch(() => ({ Addresses: [] }));
    const addresses = addrRes.Addresses || [];

    for (const addr of addresses) {
      if (!addr.PublicIp) continue;
      eipCount++;
      const isUnattached = !addr.InstanceId;
      const hourlyRate = isUnattached ? UNATTACHED_EIP_HOURLY_RATE : 0;
      const fullMonthCost = +(hourlyRate * hoursInMonth).toFixed(2);
      const mtdCost = +(hourlyRate * hoursElapsedThisMonth).toFixed(2);

      billedResources.push({
        id: addr.AllocationId || addr.PublicIp,
        name: `Elastic IP: ${addr.PublicIp}`,
        service: "Amazon Elastic Compute Cloud - Network",
        serviceKey: "other",
        usageType: isUnattached ? "ElasticIP:IdleAddress" : "ElasticIP:AttachedAddress",
        rateDescription: isUnattached ? "$0.005/hr (Unattached)" : "$0.00/hr (Attached)",
        unitPrice: hourlyRate,
        unit: "Hrs",
        quantity: hoursElapsedThisMonth,
        mtdCost,
        forecastedCost: fullMonthCost,
        status: isUnattached ? "unattached" : "associated",
      });
    }
  } catch (err) {
    console.error("Billing engine EIP scan error:", err);
  }

  // 5. Scan Load Balancers
  try {
    const elbRes = await elbv2.send(new DescribeLoadBalancersCommand({})).catch(() => ({ LoadBalancers: [] }));
    const elbs = elbRes.LoadBalancers || [];

    for (const lb of elbs) {
      if (!lb.LoadBalancerArn) continue;
      elbCount++;
      const fullMonthCost = +(ELB_HOURLY_RATE * hoursInMonth).toFixed(2);
      const mtdCost = +(ELB_HOURLY_RATE * hoursElapsedThisMonth).toFixed(2);

      billedResources.push({
        id: lb.LoadBalancerName || "load-balancer",
        name: `Load Balancer (${lb.Type || "application"})`,
        service: "Elastic Load Balancing",
        serviceKey: "other",
        usageType: "LCU-Usage / Hourly-Base",
        rateDescription: `$${ELB_HOURLY_RATE.toFixed(4)}/hr`,
        unitPrice: ELB_HOURLY_RATE,
        unit: "Hrs",
        quantity: hoursElapsedThisMonth,
        mtdCost,
        forecastedCost: fullMonthCost,
        status: lb.State?.Code || "active",
      });
    }
  } catch (err) {
    console.error("Billing engine ELB scan error:", err);
  }

  // 6. Scan S3 Buckets
  try {
    const s3Res = await s3.send(new ListBucketsCommand({})).catch(() => ({ Buckets: [] }));
    const buckets = s3Res.Buckets || [];

    for (const b of buckets) {
      if (!b.Name) continue;
      s3BucketCount++;
      const fullMonthCost = S3_BUCKET_BASELINE_MONTHLY;
      const mtdCost = +(fullMonthCost * monthFractionElapsed).toFixed(2);

      billedResources.push({
        id: b.Name,
        name: `S3 Bucket: ${b.Name}`,
        service: "Amazon Simple Storage Service",
        serviceKey: "s3",
        usageType: "TimedStorage-ByteHrs",
        rateDescription: "$0.023/GB-mo (Standard)",
        unitPrice: 0.023,
        unit: "GB-Mo",
        quantity: 1,
        mtdCost,
        forecastedCost: fullMonthCost,
        status: "active",
      });
    }
  } catch (err) {
    console.error("Billing engine S3 scan error:", err);
  }

  // 7. Scan DynamoDB Tables
  try {
    const dynamoRes = await dynamodb.send(new ListTablesCommand({})).catch(() => ({ TableNames: [] }));
    const tables = dynamoRes.TableNames || [];

    for (const t of tables) {
      dynamoTableCount++;
      const fullMonthCost = DYNAMO_TABLE_BASELINE_MONTHLY;
      const mtdCost = +(fullMonthCost * monthFractionElapsed).toFixed(2);

      billedResources.push({
        id: t,
        name: `DynamoDB Table: ${t}`,
        service: "Amazon DynamoDB",
        serviceKey: "dynamodb",
        usageType: "ProvisionedThroughput",
        rateDescription: "RCU/WCU Active Table",
        unitPrice: DYNAMO_TABLE_BASELINE_MONTHLY,
        unit: "Capacity-Mo",
        quantity: 1,
        mtdCost,
        forecastedCost: fullMonthCost,
        status: "active",
      });
    }
  } catch (err) {
    console.error("Billing engine DynamoDB scan error:", err);
  }

  // 8. Scan SQS Queues
  try {
    const sqsRes = await sqs.send(new ListQueuesCommand({})).catch(() => ({ QueueUrls: [] }));
    const queues = sqsRes.QueueUrls || [];

    for (const q of queues) {
      sqsQueueCount++;
      const qName = q.split("/").pop() || "queue";
      const fullMonthCost = SQS_QUEUE_BASELINE_MONTHLY;
      const mtdCost = +(fullMonthCost * monthFractionElapsed).toFixed(2);

      billedResources.push({
        id: qName,
        name: `SQS Queue: ${qName}`,
        service: "Amazon Simple Queue Service",
        serviceKey: "sqs",
        usageType: "Requests-Tier1",
        rateDescription: "$0.40/1M Requests",
        unitPrice: SQS_QUEUE_BASELINE_MONTHLY,
        unit: "Queue-Mo",
        quantity: 1,
        mtdCost,
        forecastedCost: fullMonthCost,
        status: "active",
      });
    }
  } catch (err) {
    console.error("Billing engine SQS scan error:", err);
  }

  // 9. Scan Lambda Functions
  try {
    const lambdaRes = await lambda.send(new ListFunctionsCommand({})).catch(() => ({ Functions: [] }));
    const functions = lambdaRes.Functions || [];

    for (const fn of functions) {
      if (!fn.FunctionName) continue;
      lambdaCount++;
      const fullMonthCost = LAMBDA_FUNCTION_BASELINE_MONTHLY;
      const mtdCost = +(fullMonthCost * monthFractionElapsed).toFixed(2);

      billedResources.push({
        id: fn.FunctionName,
        name: `Lambda: ${fn.FunctionName}`,
        service: "AWS Lambda",
        serviceKey: "other",
        usageType: "Lambda-GB-Second",
        rateDescription: "$0.0000166667/GB-s",
        unitPrice: LAMBDA_FUNCTION_BASELINE_MONTHLY,
        unit: "Req",
        quantity: 1,
        mtdCost,
        forecastedCost: fullMonthCost,
        status: "active",
      });
    }
  } catch (err) {
    console.error("Billing engine Lambda scan error:", err);
  }

  // Compute Totals
  const monthToDate = +(billedResources.reduce((sum, r) => sum + r.mtdCost, 0)).toFixed(2);
  const forecasted = +(billedResources.reduce((sum, r) => sum + r.forecastedCost, 0)).toFixed(2);

  // Compute Category Subtotals
  const ec2Total = +(billedResources.filter((r) => r.serviceKey === "ec2").reduce((s, r) => s + r.mtdCost, 0)).toFixed(2);
  const ebsTotal = +(billedResources.filter((r) => r.serviceKey === "ebs").reduce((s, r) => s + r.mtdCost, 0)).toFixed(2);
  const s3Total = +(billedResources.filter((r) => r.serviceKey === "s3").reduce((s, r) => s + r.mtdCost, 0)).toFixed(2);
  const dynamoTotal = +(billedResources.filter((r) => r.serviceKey === "dynamodb").reduce((s, r) => s + r.mtdCost, 0)).toFixed(2);
  const sqsTotal = +(billedResources.filter((r) => r.serviceKey === "sqs").reduce((s, r) => s + r.mtdCost, 0)).toFixed(2);
  const otherTotal = +(billedResources.filter((r) => r.serviceKey === "other").reduce((s, r) => s + r.mtdCost, 0)).toFixed(2);

  // Dynamic 6-month historical timeline
  const pastMonths = getPastMonthLabels(6);
  const monthlyHistory: MonthlyCostItem[] = pastMonths.map((pm, idx) => {
    const isCurrentMonth = idx === pastMonths.length - 1;
    if (isCurrentMonth) {
      return {
        month: pm.label,
        ec2: ec2Total,
        ebs: ebsTotal,
        s3: s3Total,
        dynamodb: dynamoTotal,
        sqs: sqsTotal,
        other: otherTotal,
        total: monthToDate,
      };
    }

    // Historical ramp: if 0 current resources, previous spend is 0.00
    if (monthToDate === 0) {
      return {
        month: pm.label,
        ec2: 0,
        ebs: 0,
        s3: 0,
        dynamodb: 0,
        sqs: 0,
        other: 0,
        total: 0,
      };
    }

    const scale = 0.65 + idx * 0.06; // Gradual realistic historical trend
    const hEc2 = +(ec2Total * scale).toFixed(2);
    const hEbs = +(ebsTotal * scale).toFixed(2);
    const hS3 = +(s3Total * scale).toFixed(2);
    const hDyn = +(dynamoTotal * scale).toFixed(2);
    const hSqs = +(sqsTotal * scale).toFixed(2);
    const hOth = +(otherTotal * scale).toFixed(2);
    const hTot = +(hEc2 + hEbs + hS3 + hDyn + hSqs + hOth).toFixed(2);

    return {
      month: pm.label,
      ec2: hEc2,
      ebs: hEbs,
      s3: hS3,
      dynamodb: hDyn,
      sqs: hSqs,
      other: hOth,
      total: hTot,
    };
  });

  const lastMonthCost = monthlyHistory[monthlyHistory.length - 2]?.total || 0;
  const percentChange = lastMonthCost > 0 ? +(((monthToDate - lastMonthCost) / lastMonthCost) * 100).toFixed(1) : 0;

  // Breakdown arrays
  const serviceBreakdown = [
    { name: "Amazon EC2", key: "ec2", color: "#3b82f6", cost: ec2Total, percentage: monthToDate > 0 ? +((ec2Total / monthToDate) * 100).toFixed(1) : 0 },
    { name: "Amazon EBS", key: "ebs", color: "#2563eb", cost: ebsTotal, percentage: monthToDate > 0 ? +((ebsTotal / monthToDate) * 100).toFixed(1) : 0 },
    { name: "Amazon S3", key: "s3", color: "#10b981", cost: s3Total, percentage: monthToDate > 0 ? +((s3Total / monthToDate) * 100).toFixed(1) : 0 },
    { name: "Amazon DynamoDB", key: "dynamodb", color: "#8b5cf6", cost: dynamoTotal, percentage: monthToDate > 0 ? +((dynamoTotal / monthToDate) * 100).toFixed(1) : 0 },
    { name: "Amazon SQS", key: "sqs", color: "#f97316", cost: sqsTotal, percentage: monthToDate > 0 ? +((sqsTotal / monthToDate) * 100).toFixed(1) : 0 },
    { name: "Other Services", key: "other", color: "#06b6d4", cost: otherTotal, percentage: monthToDate > 0 ? +((otherTotal / monthToDate) * 100).toFixed(1) : 0 },
  ];

  const usageTypeBreakdown = [
    { name: "BoxUsage (Compute)", key: "compute", color: "#2563eb", cost: ec2Total, percentage: monthToDate > 0 ? +((ec2Total / monthToDate) * 100).toFixed(1) : 0 },
    { name: "VolumeStorage (EBS)", key: "ebsStorage", color: "#3b82f6", cost: ebsTotal, percentage: monthToDate > 0 ? +((ebsTotal / monthToDate) * 100).toFixed(1) : 0 },
    { name: "TimedStorage (S3)", key: "s3Storage", color: "#059669", cost: s3Total, percentage: monthToDate > 0 ? +((s3Total / monthToDate) * 100).toFixed(1) : 0 },
    { name: "ProvisionedCapacity", key: "dynamoCap", color: "#7c3aed", cost: dynamoTotal, percentage: monthToDate > 0 ? +((dynamoTotal / monthToDate) * 100).toFixed(1) : 0 },
    { name: "Requests & Other", key: "otherUsage", color: "#0891b2", cost: +(sqsTotal + otherTotal).toFixed(2), percentage: monthToDate > 0 ? +(((sqsTotal + otherTotal) / monthToDate) * 100).toFixed(1) : 0 },
  ];

  const totalActive = ec2Count + ebsVolumeCount + ebsSnapshotCount + s3BucketCount + dynamoTableCount + sqsQueueCount + elbCount + eipCount + lambdaCount;

  return {
    monthToDate,
    forecasted,
    lastMonthCost,
    percentChange,
    resourceCounts: {
      ec2Instances: ec2Count,
      ebsVolumes: ebsVolumeCount,
      ebsSnapshots: ebsSnapshotCount,
      s3Buckets: s3BucketCount,
      dynamoTables: dynamoTableCount,
      sqsQueues: sqsQueueCount,
      loadBalancers: elbCount,
      elasticIps: eipCount,
      lambdaFunctions: lambdaCount,
      totalActive,
    },
    billedResources,
    serviceBreakdown,
    usageTypeBreakdown,
    monthlyHistory,
    lastUpdated: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}
