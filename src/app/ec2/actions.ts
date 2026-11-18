/**
 * src/app/ec2/actions.ts – Real AWS Emulator Server Actions for Amazon EC2.
 * Directly communicates with the AWS Emulator (https://127.0.0.1:9297) using @aws-sdk/client-ec2.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use server";

import { ec2 } from "@/lib/aws";
import {
  DescribeInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  RebootInstancesCommand,
  TerminateInstancesCommand,
  RunInstancesCommand,
  DescribeSecurityGroupsCommand,
  CreateSecurityGroupCommand,
  DeleteSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
  RevokeSecurityGroupIngressCommand,
  AuthorizeSecurityGroupEgressCommand,
  RevokeSecurityGroupEgressCommand,
  DescribeKeyPairsCommand,
  CreateKeyPairCommand,
  DeleteKeyPairCommand,
  DescribeAddressesCommand,
  AllocateAddressCommand,
  ReleaseAddressCommand,
  DescribeVolumesCommand,
  CreateVolumeCommand,
  DeleteVolumeCommand,
  DescribeNetworkInterfacesCommand,
  DescribeImagesCommand,
  DescribeInstanceTypesCommand,
  DescribeLaunchTemplatesCommand,
  DescribeSnapshotsCommand,
  DescribePlacementGroupsCommand,
  DescribeSpotInstanceRequestsCommand,
  DescribeReservedInstancesCommand,
  DescribeHostsCommand,
  DescribeCapacityReservationsCommand,
  CreateSnapshotCommand,
  DeleteSnapshotCommand,
  CreatePlacementGroupCommand,
  DeletePlacementGroupCommand,
  CreateLaunchTemplateCommand,
  DeleteLaunchTemplateCommand,
  CreateNetworkInterfaceCommand,
  DeleteNetworkInterfaceCommand,
} from "@aws-sdk/client-ec2";
import { revalidatePath } from "next/cache";
import {
  EC2Instance,
  SecurityGroup,
  KeyPair,
  ElasticIp,
  DEFAULT_INSTANCES,
  DEFAULT_SECURITY_GROUPS,
  DEFAULT_KEY_PAIRS,
  DEFAULT_ELASTIC_IPS,
  SecurityGroupRule,
} from "@/lib/ec2-data";

// -------------------------------------------------------------
// Mappers: Convert AWS SDK responses to UI Models
// -------------------------------------------------------------

function mapAwsInstanceToModel(inst: any): EC2Instance {
  const nameTag = inst.Tags?.find((t: any) => t.Key === "Name")?.Value;
  const id = inst.InstanceId || "i-unknown";
  const name = nameTag || id;
  const stateRaw = inst.State?.Name || "stopped";
  let state: EC2Instance["state"] = "stopped";
  if (stateRaw === "running") state = "running";
  else if (stateRaw === "pending") state = "pending";
  else if (stateRaw === "stopping") state = "stopping";
  else if (stateRaw === "terminated" || stateRaw === "shutting-down") state = "terminated";

  let statusCheck: EC2Instance["statusCheck"] = "0/2 checks passed";
  if (state === "running") statusCheck = "2/2 checks passed";
  else if (state === "pending") statusCheck = "Initializing";

  const publicIp = inst.PublicIpAddress || "";
  const privateIp = inst.PrivateIpAddress || "";
  const publicDns = inst.PublicDnsName || (publicIp ? `ec2-${publicIp.replace(/\./g, "-")}.compute-1.amazonaws.com` : "");
  const privateDns = inst.PrivateDnsName || (privateIp ? `ip-${privateIp.replace(/\./g, "-")}.ec2.internal` : "");

  const sg = inst.SecurityGroups?.[0];
  const tagsObj: Record<string, string> = {};
  inst.Tags?.forEach((t: any) => {
    if (t.Key && t.Value) tagsObj[t.Key] = t.Value;
  });

  return {
    id,
    name,
    state,
    instanceType: inst.InstanceType || "t3.micro",
    statusCheck,
    availabilityZone: inst.Placement?.AvailabilityZone || "us-east-1a",
    publicIp,
    privateIp,
    publicDns,
    privateDns,
    amiId: inst.ImageId || "ami-0c7217cdde317cfec",
    amiName: "Amazon Linux 2023 AMI",
    platform: inst.PlatformDetails || "Linux/UNIX",
    architecture: (inst.Architecture as any) || "x86_64",
    securityGroupId: sg?.GroupId || "sg-0000000000000000d",
    securityGroupName: sg?.GroupName || "default",
    keyName: inst.KeyName || "test-key",
    vpcId: inst.VpcId || "vpc-00000000000000001",
    subnetId: inst.SubnetId || "subnet-00000000000000007",
    iamRole: "EC2-SSM-Instance-Role",
    launchTime: inst.LaunchTime ? new Date(inst.LaunchTime).toLocaleString() : new Date().toLocaleString(),
    rootDeviceType: "ebs",
    rootDeviceName: "/dev/xvda",
    volumeSizeGb: 20,
    tags: tagsObj,
  };
}

function mapAwsSecurityGroupToModel(sg: any): SecurityGroup {
  const inboundRules: SecurityGroupRule[] = (sg.IpPermissions || []).map((p: any) => {
    const port = p.FromPort === p.ToPort ? String(p.FromPort) : `${p.FromPort}-${p.ToPort}`;
    let type = "Custom TCP";
    if (p.IpProtocol === "-1") type = "All traffic";
    else if (p.FromPort === 22) type = "SSH";
    else if (p.FromPort === 80) type = "HTTP";
    else if (p.FromPort === 443) type = "HTTPS";

    return {
      type,
      protocol: p.IpProtocol === "-1" ? "All" : (p.IpProtocol || "tcp").toUpperCase(),
      portRange: p.IpProtocol === "-1" ? "All" : (p.FromPort ? port : "All"),
      source: p.IpRanges?.[0]?.CidrIp || p.UserIdGroupPairs?.[0]?.GroupId || "0.0.0.0/0",
      description: p.IpRanges?.[0]?.Description || sg.Description || "Managed rule",
    };
  });

  const outboundRules: SecurityGroupRule[] = (sg.IpPermissionsEgress || []).map((p: any) => {
    const port = p.FromPort === p.ToPort ? String(p.FromPort) : `${p.FromPort}-${p.ToPort}`;
    let type = "Custom TCP";
    if (p.IpProtocol === "-1") type = "All traffic";
    else if (p.FromPort === 22) type = "SSH";
    else if (p.FromPort === 80) type = "HTTP";
    else if (p.FromPort === 443) type = "HTTPS";

    return {
      type,
      protocol: p.IpProtocol === "-1" ? "All" : (p.IpProtocol || "tcp").toUpperCase(),
      portRange: p.IpProtocol === "-1" ? "All" : (p.FromPort ? port : "All"),
      source: p.IpRanges?.[0]?.CidrIp || p.UserIdGroupPairs?.[0]?.GroupId || "0.0.0.0/0",
      description: p.IpRanges?.[0]?.Description || "Allow outbound traffic",
    };
  });

  return {
    id: sg.GroupId || "sg-unknown",
    name: sg.GroupName || "default",
    description: sg.Description || "Default security group",
    vpcId: sg.VpcId || "vpc-00000000000000001",
    ownerId: sg.OwnerId || "000000000000",
    arn: sg.SecurityGroupArn || `arn:aws:ec2:us-east-1:000000000000:security-group/${sg.GroupId}`,
    tags: {},
    inboundRules,
    outboundRules,
  };
}

function mapAwsKeyPairToModel(kp: any): KeyPair {
  return {
    id: kp.KeyPairId || kp.KeyName || "key-id",
    name: kp.KeyName || "key-pair",
    type: (kp.KeyType?.toUpperCase() === "ED25519" ? "ED25519" : "RSA") as any,
    format: "pem",
    fingerprint: kp.KeyFingerprint || "—",
    createTime: kp.CreateTime ? new Date(kp.CreateTime).toLocaleDateString() : "Just now",
  };
}

// -------------------------------------------------------------
// Instances: Real Emulator Actions
// -------------------------------------------------------------

export async function fetchLiveEC2Instances(): Promise<{ instances: EC2Instance[]; isLive: boolean; error?: string }> {
  try {
    const res = await ec2.send(new DescribeInstancesCommand({}));
    const rawList = res.Reservations?.flatMap((r) => r.Instances || []) || [];
    if (rawList.length > 0) {
      return { instances: rawList.map(mapAwsInstanceToModel), isLive: true };
    }
    // If no instances yet in emulator, return empty array
    return { instances: [], isLive: true };
  } catch (err: any) {
    console.warn("[EC2 Action] Failed to fetch live instances from emulator:", err.message);
    return { instances: DEFAULT_INSTANCES, isLive: false, error: err.message };
  }
}

export interface LiveInstanceDetail extends EC2Instance {
  networkInterfacesList: Array<{
    id: string;
    mac: string;
    privateIp: string;
    publicIp?: string;
    status: string;
    subnetId: string;
    vpcId: string;
  }>;
  blockDevicesList: Array<{
    deviceName: string;
    volumeId: string;
    status: string;
    attachTime: string;
    deleteOnTermination: boolean;
  }>;
  securityGroupRulesList: SecurityGroupRule[];
}

export async function fetchLiveInstanceDetail(instanceId: string): Promise<{
  instance: LiveInstanceDetail | null;
  isLive: boolean;
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
    const inst = res.Reservations?.[0]?.Instances?.[0];
    if (!inst) {
      return { instance: null, isLive: true, error: `Instance ${instanceId} was not found in AWS Emulator.` };
    }

    const baseModel = mapAwsInstanceToModel(inst);

    // Fetch real attached security group rules
    let sgRules: SecurityGroupRule[] = [];
    if (inst.SecurityGroups?.[0]?.GroupId) {
      try {
        const sgRes = await ec2.send(
          new DescribeSecurityGroupsCommand({ GroupIds: [inst.SecurityGroups[0].GroupId] })
        );
        const realSg = sgRes.SecurityGroups?.[0];
        if (realSg) {
          sgRules = (realSg.IpPermissions || []).map((p) => {
            const port = p.FromPort === p.ToPort ? String(p.FromPort) : `${p.FromPort}-${p.ToPort}`;
            return {
              type: p.IpProtocol === "-1" ? "All traffic" : p.FromPort === 22 ? "SSH" : p.FromPort === 80 ? "HTTP" : p.FromPort === 443 ? "HTTPS" : "Custom TCP",
              protocol: p.IpProtocol === "-1" ? "All" : (p.IpProtocol || "tcp").toUpperCase(),
              portRange: p.IpProtocol === "-1" ? "All" : (p.FromPort ? port : "All"),
              source: p.IpRanges?.[0]?.CidrIp || p.UserIdGroupPairs?.[0]?.GroupId || "0.0.0.0/0",
              description: p.IpRanges?.[0]?.Description || realSg.Description || "Traffic rule",
            };
          });
        }
      } catch { /* ignore */ }
    }

    const networkInterfacesList = (inst.NetworkInterfaces || []).map((eni) => ({
      id: eni.NetworkInterfaceId || "eni-unknown",
      mac: eni.MacAddress || "—",
      privateIp: eni.PrivateIpAddress || "—",
      publicIp: eni.Association?.PublicIp,
      status: eni.Status || "in-use",
      subnetId: eni.SubnetId || inst.SubnetId || "",
      vpcId: eni.VpcId || inst.VpcId || "",
    }));

    const blockDevicesList = (inst.BlockDeviceMappings || []).map((bdm) => ({
      deviceName: bdm.DeviceName || "/dev/xvda",
      volumeId: bdm.Ebs?.VolumeId || "vol-unknown",
      status: bdm.Ebs?.Status || "attached",
      attachTime: bdm.Ebs?.AttachTime ? new Date(bdm.Ebs.AttachTime).toLocaleString() : "—",
      deleteOnTermination: bdm.Ebs?.DeleteOnTermination ?? true,
    }));

    return {
      instance: {
        ...baseModel,
        networkInterfacesList,
        blockDevicesList,
        securityGroupRulesList: sgRules,
      },
      isLive: true,
    };
  } catch (err: any) {
    return { instance: null, isLive: false, error: err.message };
  }
}

export async function startLiveInstance(instanceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new StartInstancesCommand({ InstanceIds: [instanceId] }));
    revalidatePath("/ec2");
    revalidatePath("/ec2/instances");
    revalidatePath(`/ec2/instances/${instanceId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function stopLiveInstance(instanceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new StopInstancesCommand({ InstanceIds: [instanceId] }));
    revalidatePath("/ec2");
    revalidatePath("/ec2/instances");
    revalidatePath(`/ec2/instances/${instanceId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function rebootLiveInstance(instanceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new RebootInstancesCommand({ InstanceIds: [instanceId] }));
    revalidatePath("/ec2");
    revalidatePath("/ec2/instances");
    revalidatePath(`/ec2/instances/${instanceId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function terminateLiveInstance(instanceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new TerminateInstancesCommand({ InstanceIds: [instanceId] }));
    revalidatePath("/ec2");
    revalidatePath("/ec2/instances");
    revalidatePath(`/ec2/instances/${instanceId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function launchLiveInstance(params: {
  name: string;
  imageId: string;
  instanceType: string;
  keyName?: string;
  securityGroupId?: string;
}): Promise<{ success: boolean; instance?: EC2Instance; error?: string }> {
  try {
    const res = await ec2.send(
      new RunInstancesCommand({
        ImageId: params.imageId || "ami-0c7217cdde317cfec",
        InstanceType: (params.instanceType as any) || "t3.micro",
        MinCount: 1,
        MaxCount: 1,
        KeyName: params.keyName && params.keyName !== "none" ? params.keyName : undefined,
        SecurityGroupIds: params.securityGroupId ? [params.securityGroupId] : undefined,
        TagSpecifications: [
          {
            ResourceType: "instance",
            Tags: [{ Key: "Name", Value: params.name || "live-ec2-instance" }],
          },
        ],
      })
    );

    const raw = res.Instances?.[0];
    if (raw) {
      revalidatePath("/ec2");
      revalidatePath("/ec2/instances");
      return { success: true, instance: mapAwsInstanceToModel(raw) };
    }
    return { success: false, error: "No instance returned from emulator" };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// Security Groups: Real Emulator Actions
// -------------------------------------------------------------

export async function fetchLiveSecurityGroups(): Promise<{ securityGroups: SecurityGroup[]; isLive: boolean; error?: string }> {
  try {
    const res = await ec2.send(new DescribeSecurityGroupsCommand({}));
    const rawList = res.SecurityGroups || [];
    if (rawList.length > 0) {
      return { securityGroups: rawList.map(mapAwsSecurityGroupToModel), isLive: true };
    }
    return { securityGroups: [], isLive: true };
  } catch (err: any) {
    console.warn("[EC2 Action] Failed to fetch live security groups:", err.message);
    return { securityGroups: DEFAULT_SECURITY_GROUPS, isLive: false, error: err.message };
  }
}

export async function createLiveSecurityGroup(
  groupName: string,
  description: string
): Promise<{ success: boolean; securityGroup?: SecurityGroup; error?: string }> {
  try {
    const res = await ec2.send(
      new CreateSecurityGroupCommand({
        GroupName: groupName,
        Description: description || "Managed by AWS Console UI",
      })
    );
    revalidatePath("/ec2/security-groups");
    return {
      success: true,
      securityGroup: {
        id: res.GroupId || "sg-new",
        name: groupName,
        description: description || "Managed by AWS Console UI",
        vpcId: "vpc-00000000000000001",
        inboundRules: [
          { type: "SSH", protocol: "TCP", portRange: "22", source: "0.0.0.0/0", description: "SSH access" },
        ],
        outboundRules: [
          { type: "All traffic", protocol: "All", portRange: "All", source: "0.0.0.0/0", description: "Allow all" },
        ],
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteLiveSecurityGroup(groupId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new DeleteSecurityGroupCommand({ GroupId: groupId }));
    revalidatePath("/ec2/security-groups");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateLiveSecurityGroupRules(
  groupId: string,
  rules: SecurityGroupRule[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Fetch current permissions
    const desc = await ec2.send(
      new DescribeSecurityGroupsCommand({ GroupIds: [groupId] })
    );
    const currentPerms = desc.SecurityGroups?.[0]?.IpPermissions || [];

    // 2. Revoke all existing inbound rules to allow deletion and replacement
    if (currentPerms.length > 0) {
      await ec2.send(
        new RevokeSecurityGroupIngressCommand({
          GroupId: groupId,
          IpPermissions: currentPerms,
        })
      );
    }

    // 3. Format desired rules
    const ipPerms = rules.map((r) => {
      const isAll = r.protocol === "All" || r.portRange === "All" || r.type === "All traffic";
      if (isAll) {
        return {
          IpProtocol: "-1",
          IpRanges: [{ CidrIp: r.source || "0.0.0.0/0", Description: r.description || "All traffic" }],
        };
      }

      let fromPort = 80;
      let toPort = 80;
      if (r.portRange && r.portRange.includes("-")) {
        const [f, t] = r.portRange.split("-");
        fromPort = parseInt(f, 10) || 0;
        toPort = parseInt(t, 10) || fromPort;
      } else if (r.portRange) {
        fromPort = parseInt(r.portRange, 10) || 80;
        toPort = fromPort;
      }

      return {
        IpProtocol: (r.protocol || "tcp").toLowerCase(),
        FromPort: fromPort,
        ToPort: toPort,
        IpRanges: [{ CidrIp: r.source || "0.0.0.0/0", Description: r.description || "Inbound port rule" }],
      };
    });

    // 4. Authorize desired rules if any
    if (ipPerms.length > 0) {
      await ec2.send(
        new AuthorizeSecurityGroupIngressCommand({
          GroupId: groupId,
          IpPermissions: ipPerms,
        })
      );
    }

    revalidatePath("/ec2/security-groups");
    revalidatePath("/ec2/instances");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateLiveSecurityGroupOutboundRules(
  groupId: string,
  rules: SecurityGroupRule[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Fetch current egress permissions
    const desc = await ec2.send(
      new DescribeSecurityGroupsCommand({ GroupIds: [groupId] })
    );
    const currentEgress = desc.SecurityGroups?.[0]?.IpPermissionsEgress || [];

    // 2. Revoke all existing egress rules to allow deletion and replacement
    if (currentEgress.length > 0) {
      await ec2.send(
        new RevokeSecurityGroupEgressCommand({
          GroupId: groupId,
          IpPermissions: currentEgress,
        })
      );
    }

    // 3. Format desired outbound rules
    const ipPerms = rules.map((r) => {
      const isAll = r.protocol === "All" || r.portRange === "All" || r.type === "All traffic";
      if (isAll) {
        return {
          IpProtocol: "-1",
          IpRanges: [{ CidrIp: r.source || "0.0.0.0/0", Description: r.description || "All outbound traffic" }],
        };
      }

      let fromPort = 80;
      let toPort = 80;
      if (r.portRange && r.portRange.includes("-")) {
        const [f, t] = r.portRange.split("-");
        fromPort = parseInt(f, 10) || 0;
        toPort = parseInt(t, 10) || fromPort;
      } else if (r.portRange) {
        fromPort = parseInt(r.portRange, 10) || 80;
        toPort = fromPort;
      }

      return {
        IpProtocol: (r.protocol || "tcp").toLowerCase(),
        FromPort: fromPort,
        ToPort: toPort,
        IpRanges: [{ CidrIp: r.source || "0.0.0.0/0", Description: r.description || "Outbound port rule" }],
      };
    });

    // 4. Authorize desired egress rules if any
    if (ipPerms.length > 0) {
      await ec2.send(
        new AuthorizeSecurityGroupEgressCommand({
          GroupId: groupId,
          IpPermissions: ipPerms,
        })
      );
    }

    revalidatePath("/ec2/security-groups");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// Key Pairs: Real Emulator Actions
// -------------------------------------------------------------

export async function fetchLiveKeyPairs(): Promise<{ keyPairs: KeyPair[]; isLive: boolean; error?: string }> {
  try {
    const res = await ec2.send(new DescribeKeyPairsCommand({}));
    const rawList = res.KeyPairs || [];
    if (rawList.length > 0) {
      return { keyPairs: rawList.map(mapAwsKeyPairToModel), isLive: true };
    }
    return { keyPairs: [], isLive: true };
  } catch (err: any) {
    console.warn("[EC2 Action] Failed to fetch live key pairs:", err.message);
    return { keyPairs: DEFAULT_KEY_PAIRS, isLive: false, error: err.message };
  }
}

export async function createLiveKeyPair(
  keyName: string
): Promise<{ success: boolean; keyPair?: KeyPair; keyMaterial?: string; error?: string }> {
  try {
    const res = await ec2.send(
      new CreateKeyPairCommand({
        KeyName: keyName,
        KeyType: "rsa",
      })
    );
    revalidatePath("/ec2/key-pairs");
    return {
      success: true,
      keyMaterial: res.KeyMaterial,
      keyPair: {
        id: res.KeyPairId || keyName,
        name: keyName,
        type: "RSA",
        format: "pem",
        fingerprint: res.KeyFingerprint || "—",
        createTime: "Just now",
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteLiveKeyPair(keyName: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new DeleteKeyPairCommand({ KeyName: keyName }));
    revalidatePath("/ec2/key-pairs");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// Elastic IPs: Real Emulator Actions
// -------------------------------------------------------------

export async function fetchLiveElasticIps(): Promise<{ elasticIps: ElasticIp[]; isLive: boolean; error?: string }> {
  try {
    const res = await ec2.send(new DescribeAddressesCommand({}));
    const rawList = res.Addresses || [];
    const mapped: ElasticIp[] = rawList.map((a) => ({
      allocationId: a.AllocationId || a.PublicIp || "eipalloc-0",
      publicIp: a.PublicIp || "",
      associatedInstanceId: a.InstanceId,
      networkInterfaceId: a.NetworkInterfaceId,
      domain: "vpc",
    }));
    return { elasticIps: mapped, isLive: true };
  } catch (err: any) {
    console.warn("[EC2 Action] Failed to fetch live Elastic IPs:", err.message);
    return { elasticIps: DEFAULT_ELASTIC_IPS, isLive: false, error: err.message };
  }
}

export async function allocateLiveElasticIp(): Promise<{ success: boolean; elasticIp?: ElasticIp; error?: string }> {
  try {
    const res = await ec2.send(new AllocateAddressCommand({ Domain: "vpc" }));
    revalidatePath("/ec2/elastic-ips");
    return {
      success: true,
      elasticIp: {
        allocationId: res.AllocationId || "eipalloc-new",
        publicIp: res.PublicIp || "",
        domain: "vpc",
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function releaseLiveElasticIp(allocationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new ReleaseAddressCommand({ AllocationId: allocationId }));
    revalidatePath("/ec2/elastic-ips");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// EBS Volumes: Real Emulator Actions
// -------------------------------------------------------------

export interface EBSVolume {
  id: string;
  sizeGb: number;
  volumeType: string;
  iops?: number;
  snapshotId?: string;
  availabilityZone: string;
  state: string;
  createTime: string;
  attachmentInstanceId?: string;
  attachmentDevice?: string;
  encrypted: boolean;
}

export async function fetchLiveVolumes(): Promise<{ volumes: EBSVolume[]; isLive: boolean; error?: string }> {
  try {
    const res = await ec2.send(new DescribeVolumesCommand({}));
    const rawList = res.Volumes || [];
    const mapped: EBSVolume[] = rawList.map((v) => ({
      id: v.VolumeId || "vol-unknown",
      sizeGb: v.Size || 20,
      volumeType: v.VolumeType || "gp3",
      iops: v.Iops || 3000,
      snapshotId: v.SnapshotId || "—",
      availabilityZone: v.AvailabilityZone || "us-east-1a",
      state: v.State || "available",
      createTime: v.CreateTime ? new Date(v.CreateTime).toLocaleString() : new Date().toLocaleString(),
      attachmentInstanceId: v.Attachments?.[0]?.InstanceId,
      attachmentDevice: v.Attachments?.[0]?.Device,
      encrypted: Boolean(v.Encrypted),
    }));

    return { volumes: mapped, isLive: true };
  } catch (err: any) {
    console.warn("[EC2 Action] Failed to fetch live volumes:", err.message);
    return {
      volumes: [
        {
          id: "vol-0000000000000008e",
          sizeGb: 20,
          volumeType: "gp3",
          iops: 3000,
          snapshotId: "—",
          availabilityZone: "us-east-1a",
          state: "in-use",
          createTime: new Date().toLocaleString(),
          attachmentInstanceId: "i-00000000000000001",
          attachmentDevice: "/dev/xvda",
          encrypted: false,
        },
      ],
      isLive: false,
      error: err.message,
    };
  }
}

export async function createLiveVolume(params: {
  sizeGb: number;
  availabilityZone: string;
  volumeType?: string;
}): Promise<{ success: boolean; volume?: EBSVolume; error?: string }> {
  try {
    const res = await ec2.send(
      new CreateVolumeCommand({
        Size: params.sizeGb || 20,
        AvailabilityZone: params.availabilityZone || "us-east-1a",
        VolumeType: (params.volumeType as any) || "gp3",
      })
    );

    revalidatePath("/ec2/volumes");
    return {
      success: true,
      volume: {
        id: res.VolumeId || "vol-new",
        sizeGb: res.Size || params.sizeGb,
        volumeType: res.VolumeType || "gp3",
        availabilityZone: res.AvailabilityZone || params.availabilityZone,
        state: res.State || "creating",
        createTime: new Date().toLocaleString(),
        encrypted: Boolean(res.Encrypted),
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteLiveVolume(volumeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new DeleteVolumeCommand({ VolumeId: volumeId }));
    revalidatePath("/ec2/volumes");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// Network Interfaces: Real Emulator Actions
// -------------------------------------------------------------

export interface NetworkInterfaceModel {
  id: string;
  subnetId: string;
  vpcId: string;
  status: string;
  privateIp: string;
  publicIp?: string;
  macAddress: string;
  instanceId?: string;
  description?: string;
}

export async function fetchLiveNetworkInterfaces(): Promise<{
  interfaces: NetworkInterfaceModel[];
  isLive: boolean;
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeNetworkInterfacesCommand({}));
    const rawList = res.NetworkInterfaces || [];
    const mapped: NetworkInterfaceModel[] = rawList.map((eni) => ({
      id: eni.NetworkInterfaceId || "eni-unknown",
      subnetId: eni.SubnetId || "",
      vpcId: eni.VpcId || "",
      status: eni.Status || "in-use",
      privateIp: eni.PrivateIpAddress || "—",
      publicIp: eni.Association?.PublicIp,
      macAddress: eni.MacAddress || "—",
      instanceId: eni.Attachment?.InstanceId,
      description: eni.Description || "Primary network interface",
    }));

    return { interfaces: mapped, isLive: true };
  } catch (err: any) {
    console.warn("[EC2 Action] Failed to fetch live ENIs:", err.message);
    return {
      interfaces: [],
      isLive: false,
      error: err.message,
    };
  }
}

// -------------------------------------------------------------
// Live Emulator Queries: AMIs, Launch Templates, Types, Snapshots, etc.
// -------------------------------------------------------------

export async function fetchLiveAmis(): Promise<{
  amis: Array<{
    id: string;
    name: string;
    owner: string;
    state: string;
    platform: string;
    architecture: string;
    creationDate: string;
    description: string;
  }>;
  isLive: boolean;
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeImagesCommand({ Owners: ["self"] }));
    const raw = res.Images || [];
    const mapped = raw.map((img) => ({
      id: img.ImageId || "ami-unknown",
      name: img.Name || "Unnamed AMI",
      owner: img.OwnerId || "self",
      state: img.State || "available",
      platform: img.PlatformDetails || "Linux/UNIX",
      architecture: img.Architecture || "x86_64",
      creationDate: img.CreationDate ? new Date(img.CreationDate).toLocaleDateString() : "—",
      description: img.Description || "—",
    }));
    return { amis: mapped, isLive: true };
  } catch (err: any) {
    return { amis: [], isLive: false, error: err.message };
  }
}

export async function fetchLiveInstanceTypes(): Promise<{
  types: Array<{
    name: string;
    vCpu: number;
    memoryGib: number;
    arch: string;
    networkPerf: string;
    currentGeneration: boolean;
  }>;
  isLive: boolean;
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeInstanceTypesCommand({ MaxResults: 100 }));
    const raw = res.InstanceTypes || [];
    const mapped = raw.map((t) => ({
      name: t.InstanceType || "t3.micro",
      vCpu: t.VCpuInfo?.DefaultVCpus || 1,
      memoryGib: ((t.MemoryInfo?.SizeInMiB || 1024) / 1024),
      arch: t.ProcessorInfo?.SupportedArchitectures?.join(", ") || "x86_64",
      networkPerf: t.NetworkInfo?.NetworkPerformance || "Up to 5 Gbps",
      currentGeneration: Boolean(t.CurrentGeneration),
    }));
    return { types: mapped, isLive: true };
  } catch (err: any) {
    return { types: [], isLive: false, error: err.message };
  }
}

export async function fetchLiveLaunchTemplates(): Promise<{
  templates: Array<{
    id: string;
    name: string;
    defaultVersion: number;
    latestVersion: number;
    createTime: string;
    createdBy: string;
  }>;
  isLive: boolean;
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeLaunchTemplatesCommand({}));
    const raw = res.LaunchTemplates || [];
    const mapped = raw.map((lt) => ({
      id: lt.LaunchTemplateId || "lt-unknown",
      name: lt.LaunchTemplateName || "Unnamed Template",
      defaultVersion: lt.DefaultVersionNumber || 1,
      latestVersion: lt.LatestVersionNumber || 1,
      createTime: lt.CreateTime ? new Date(lt.CreateTime).toLocaleString() : "—",
      createdBy: lt.CreatedBy || "arn:aws:iam::000000000000:root",
    }));
    return { templates: mapped, isLive: true };
  } catch (err: any) {
    return { templates: [], isLive: false, error: err.message };
  }
}

export async function fetchLiveSnapshots(): Promise<{
  snapshots: Array<{
    id: string;
    volumeId: string;
    sizeGb: number;
    state: string;
    progress: string;
    startTime: string;
    description: string;
  }>;
  isLive: boolean;
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeSnapshotsCommand({ OwnerIds: ["self"] }));
    const raw = res.Snapshots || [];
    const mapped = raw.map((s) => ({
      id: s.SnapshotId || "snap-unknown",
      volumeId: s.VolumeId || "—",
      sizeGb: s.VolumeSize || 0,
      state: s.State || "completed",
      progress: s.Progress || "100%",
      startTime: s.StartTime ? new Date(s.StartTime).toLocaleString() : "—",
      description: s.Description || "—",
    }));
    return { snapshots: mapped, isLive: true };
  } catch (err: any) {
    return { snapshots: [], isLive: false, error: err.message };
  }
}

export async function fetchLivePlacementGroups(): Promise<{
  placementGroups: Array<{
    groupName: string;
    strategy: string;
    state: string;
    groupId: string;
  }>;
  isLive: boolean;
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribePlacementGroupsCommand({}));
    const raw = res.PlacementGroups || [];
    const mapped = raw.map((pg) => ({
      groupName: pg.GroupName || "pg-default",
      strategy: pg.Strategy || "cluster",
      state: pg.State || "available",
      groupId: pg.GroupId || "—",
    }));
    return { placementGroups: mapped, isLive: true };
  } catch (err: any) {
    return { placementGroups: [], isLive: false, error: err.message };
  }
}

export async function fetchLiveSpotRequests(): Promise<{
  spotRequests: Array<{
    id: string;
    type: string;
    status: string;
    instanceType: string;
    createTime: string;
  }>;
  isLive: boolean;
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeSpotInstanceRequestsCommand({}));
    const raw = res.SpotInstanceRequests || [];
    const mapped = raw.map((sr) => ({
      id: sr.SpotInstanceRequestId || "sir-unknown",
      type: sr.Type || "one-time",
      status: sr.Status?.Code || "pending-evaluation",
      instanceType: sr.LaunchSpecification?.InstanceType || "t3.micro",
      createTime: sr.CreateTime ? new Date(sr.CreateTime).toLocaleString() : "—",
    }));
    return { spotRequests: mapped, isLive: true };
  } catch (err: any) {
    return { spotRequests: [], isLive: false, error: err.message };
  }
}

export async function fetchLiveReservedInstances(): Promise<{
  reservedInstances: Array<{
    id: string;
    instanceType: string;
    availabilityZone: string;
    state: string;
    instanceCount: number;
    duration: number;
  }>;
  isLive: boolean;
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeReservedInstancesCommand({}));
    const raw = res.ReservedInstances || [];
    const mapped = raw.map((ri) => ({
      id: ri.ReservedInstancesId || "ri-unknown",
      instanceType: ri.InstanceType || "t3.micro",
      availabilityZone: ri.AvailabilityZone || "us-east-1a",
      state: ri.State || "active",
      instanceCount: ri.InstanceCount || 1,
      duration: ri.Duration || 31536000,
    }));
    return { reservedInstances: mapped, isLive: true };
  } catch (err: any) {
    return { reservedInstances: [], isLive: false, error: err.message };
  }
}

export async function fetchLiveDedicatedHosts(): Promise<{
  hosts: Array<{
    hostId: string;
    instanceType: string;
    state: string;
    availabilityZone: string;
    cores: number;
    totalVCpus: number;
  }>;
  isLive: boolean;
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeHostsCommand({}));
    const raw = res.Hosts || [];
    const mapped = raw.map((h) => ({
      hostId: h.HostId || "h-unknown",
      instanceType: h.HostProperties?.InstanceType || "m5.large",
      state: h.State || "available",
      availabilityZone: h.AvailabilityZone || "us-east-1a",
      cores: h.HostProperties?.Cores || 48,
      totalVCpus: h.HostProperties?.TotalVCpus || 96,
    }));
    return { hosts: mapped, isLive: true };
  } catch (err: any) {
    return { hosts: [], isLive: false, error: err.message };
  }
}

export async function fetchLiveCapacityReservations(): Promise<{
  reservations: Array<{
    id: string;
    instanceType: string;
    availabilityZone: string;
    totalInstanceCount: number;
    availableInstanceCount: number;
    state: string;
  }>;
  isLive: boolean;
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeCapacityReservationsCommand({}));
    const raw = res.CapacityReservations || [];
    const mapped = raw.map((cr) => ({
      id: cr.CapacityReservationId || "cr-unknown",
      instanceType: cr.InstanceType || "t3.micro",
      availabilityZone: cr.AvailabilityZone || "us-east-1a",
      totalInstanceCount: cr.TotalInstanceCount || 1,
      availableInstanceCount: cr.AvailableInstanceCount || 1,
      state: cr.State || "active",
    }));
    return { reservations: mapped, isLive: true };
  } catch (err: any) {
    return { reservations: [], isLive: false, error: err.message };
  }
}

// -------------------------------------------------------------
// Live CRUD: Snapshots, Launch Templates, Placement Groups, ENIs
// -------------------------------------------------------------

export async function createLiveSnapshot(
  volumeId: string,
  description?: string
): Promise<{ success: boolean; snapshotId?: string; error?: string }> {
  try {
    const res = await ec2.send(
      new CreateSnapshotCommand({
        VolumeId: volumeId,
        Description: description || "Created via AWS Console UI",
      })
    );
    revalidatePath("/ec2/snapshots");
    return { success: true, snapshotId: res.SnapshotId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteLiveSnapshot(snapshotId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new DeleteSnapshotCommand({ SnapshotId: snapshotId }));
    revalidatePath("/ec2/snapshots");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createLiveLaunchTemplate(params: {
  name: string;
  imageId: string;
  instanceType: string;
}): Promise<{ success: boolean; templateId?: string; error?: string }> {
  try {
    const res = await ec2.send(
      new CreateLaunchTemplateCommand({
        LaunchTemplateName: params.name,
        LaunchTemplateData: {
          ImageId: params.imageId || "ami-0c7217cdde317cfec",
          InstanceType: (params.instanceType as any) || "t3.micro",
        },
      })
    );
    revalidatePath("/ec2/launch-templates");
    return { success: true, templateId: res.LaunchTemplate?.LaunchTemplateId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteLiveLaunchTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new DeleteLaunchTemplateCommand({ LaunchTemplateId: templateId }));
    revalidatePath("/ec2/launch-templates");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createLivePlacementGroup(
  groupName: string,
  strategy: string = "cluster"
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new CreatePlacementGroupCommand({
        GroupName: groupName,
        Strategy: strategy as any,
      })
    );
    revalidatePath("/ec2/placement-groups");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteLivePlacementGroup(groupName: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new DeletePlacementGroupCommand({ GroupName: groupName }));
    revalidatePath("/ec2/placement-groups");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createLiveNetworkInterface(
  subnetId: string,
  description?: string
): Promise<{ success: boolean; interfaceId?: string; error?: string }> {
  try {
    const res = await ec2.send(
      new CreateNetworkInterfaceCommand({
        SubnetId: subnetId,
        Description: description || "Created via AWS Console UI",
      })
    );
    revalidatePath("/ec2/network-interfaces");
    return { success: true, interfaceId: res.NetworkInterface?.NetworkInterfaceId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteLiveNetworkInterface(
  networkInterfaceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new DeleteNetworkInterfaceCommand({ NetworkInterfaceId: networkInterfaceId }));
    revalidatePath("/ec2/network-interfaces");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
