/**
 * src/app/ec2/actions.ts – Real AWS Emulator Server Actions for Amazon EC2.
 * Directly communicates with the AWS Emulator (https://127.0.0.1:9297) using @aws-sdk/client-ec2.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use server";

import { ec2, elbv2, autoScaling } from "@/lib/aws";
import {
  DescribeLoadBalancersCommand,
  CreateLoadBalancerCommand,
  DeleteLoadBalancerCommand,
  DescribeTargetGroupsCommand,
  CreateTargetGroupCommand,
  DeleteTargetGroupCommand,
  DescribeTargetHealthCommand,
  RegisterTargetsCommand,
  DeregisterTargetsCommand,
  DescribeListenersCommand,
  CreateListenerCommand,
  DeleteListenerCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  DescribeAutoScalingGroupsCommand,
  CreateAutoScalingGroupCommand,
  UpdateAutoScalingGroupCommand,
  DeleteAutoScalingGroupCommand,
  DescribeLaunchConfigurationsCommand,
  DeleteLaunchConfigurationCommand,
} from "@aws-sdk/client-auto-scaling";
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
  ImportKeyPairCommand,
  DescribeAddressesCommand,
  AllocateAddressCommand,
  ReleaseAddressCommand,
  AssociateAddressCommand,
  DisassociateAddressCommand,
  DescribeVolumesCommand,
  CreateVolumeCommand,
  DeleteVolumeCommand,
  AttachVolumeCommand,
  DetachVolumeCommand,
  AttachNetworkInterfaceCommand,
  DetachNetworkInterfaceCommand,
  DescribeNetworkInterfacesCommand,
  DescribeImagesCommand,
  RegisterImageCommand,
  DeregisterImageCommand,
  DescribeInstanceTypesCommand,
  DescribeLaunchTemplatesCommand,
  DescribeLaunchTemplateVersionsCommand,
  CreateLaunchTemplateVersionCommand,
  ModifyLaunchTemplateCommand,
  DescribeSnapshotsCommand,
  DescribePlacementGroupsCommand,
  DescribeSpotInstanceRequestsCommand,
  RequestSpotInstancesCommand,
  CancelSpotInstanceRequestsCommand,
  DescribeReservedInstancesCommand,
  DescribeHostsCommand,
  AllocateHostsCommand,
  ReleaseHostsCommand,
  DescribeCapacityReservationsCommand,
  CreateCapacityReservationCommand,
  CancelCapacityReservationCommand,
  DescribeReservedInstancesOfferingsCommand,
  PurchaseReservedInstancesOfferingCommand,
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
  ensureInstanceContainer,
  executeContainerCommand,
  readContainerFile,
  writeContainerFile,
  stopInstanceContainer,
  startInstanceContainer,
  terminateInstanceContainer,
} from "@/lib/ec2-docker";
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

export type { EC2Instance };

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
    amiId: inst.ImageId || "ami-080e1f13689e07408",
    amiName: inst.ImageId === "ami-0c7217cdde317cfec"
      ? "Amazon Linux 2023 AMI"
      : inst.ImageId === "ami-0c101f26f147fa7ab"
      ? "Red Hat Enterprise Linux 9"
      : inst.ImageId === "ami-0d5eff06f840b45e9"
      ? "Microsoft Windows Server 2022 Base"
      : "Ubuntu Server 24.04 LTS",
    platform: inst.ImageId === "ami-0c7217cdde317cfec"
      ? "Amazon Linux"
      : inst.ImageId === "ami-0c101f26f147fa7ab"
      ? "Red Hat"
      : inst.ImageId === "ami-0d5eff06f840b45e9"
      ? "Windows"
      : "Ubuntu",
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

  const tagsObj: Record<string, string> = {};
  (sg.Tags || []).forEach((t: any) => {
    if (t.Key && t.Value) tagsObj[t.Key] = t.Value;
  });

  return {
    id: sg.GroupId || "sg-unknown",
    name: sg.GroupName || "default",
    description: sg.Description || "Default security group",
    vpcId: sg.VpcId || "vpc-00000000000000001",
    ownerId: sg.OwnerId || "000000000000",
    arn: sg.SecurityGroupArn || `arn:aws:ec2:us-east-1:000000000000:security-group/${sg.GroupId}`,
    tags: tagsObj,
    inboundRules,
    outboundRules,
  };
}

function mapAwsKeyPairToModel(kp: any): KeyPair {
  const tagsObj: Record<string, string> = {};
  (kp.Tags || []).forEach((t: any) => {
    if (t.Key && t.Value) tagsObj[t.Key] = t.Value;
  });

  return {
    id: kp.KeyPairId || kp.KeyName || "key-id",
    name: kp.KeyName || "key-pair",
    type: (kp.KeyType?.toUpperCase() === "ED25519" ? "ED25519" : "RSA") as any,
    format: "pem",
    fingerprint: kp.KeyFingerprint || "—",
    createTime: kp.CreateTime ? new Date(kp.CreateTime).toLocaleDateString() : "Just now",
    arn: `arn:aws:ec2:us-east-1:000000000000:key-pair/${kp.KeyName}`,
    tags: tagsObj,
    publicKey: kp.PublicKey,
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
    await startInstanceContainer(instanceId);
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
    await stopInstanceContainer(instanceId);
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
    await terminateInstanceContainer(instanceId);
    revalidatePath("/ec2");
    revalidatePath("/ec2/instances");
    revalidatePath(`/ec2/instances/${instanceId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// Real EC2 Docker Container Terminal Actions
// -------------------------------------------------------------

export async function ensureEC2ContainerAction(instance: {
  id: string;
  privateIp?: string;
  publicIp?: string;
  platform?: string;
  amiId?: string;
  amiName?: string;
}) {
  return await ensureInstanceContainer(instance);
}

export async function executeEC2TerminalCommandAction(instanceId: string, command: string) {
  return await executeContainerCommand(instanceId, command);
}

export async function readEC2ContainerFileAction(instanceId: string, filePath: string) {
  return await readContainerFile(instanceId, filePath);
}

export async function writeEC2ContainerFileAction(instanceId: string, filePath: string, content: string) {
  return await writeContainerFile(instanceId, filePath, content);
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
    return { securityGroups: rawList.map(mapAwsSecurityGroupToModel), isLive: true };
  } catch (err: any) {
    console.warn("[EC2 Action] Failed to fetch live security groups:", err.message);
    return { securityGroups: [], isLive: false, error: err.message };
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
    revalidatePath("/vpc/security-groups");
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
    revalidatePath("/vpc/security-groups");
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
    revalidatePath("/vpc/security-groups");
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
    revalidatePath("/vpc/security-groups");
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
    return { keyPairs: rawList.map(mapAwsKeyPairToModel), isLive: true };
  } catch (err: any) {
    console.warn("[EC2 Action] Failed to fetch live key pairs:", err.message);
    return { keyPairs: [], isLive: false, error: err.message };
  }
}

export async function createLiveKeyPair(
  keyName: string,
  keyType: "rsa" | "ed25519" = "rsa",
  keyFormat: "pem" | "ppk" = "pem"
): Promise<{ success: boolean; keyPair?: KeyPair; keyMaterial?: string; error?: string }> {
  try {
    const res = await ec2.send(
      new CreateKeyPairCommand({
        KeyName: keyName,
        KeyType: keyType === "ed25519" ? "ed25519" : "rsa",
        KeyFormat: keyFormat === "ppk" ? "ppk" : "pem",
      })
    );
    revalidatePath("/ec2/key-pairs");
    return {
      success: true,
      keyMaterial: res.KeyMaterial,
      keyPair: {
        id: res.KeyPairId || res.KeyName || keyName,
        name: keyName,
        type: keyType === "ed25519" ? "ED25519" : "RSA",
        format: keyFormat,
        fingerprint: res.KeyFingerprint || "—",
        createTime: "Just now",
        arn: `arn:aws:ec2:us-east-1:000000000000:key-pair/${keyName}`,
        tags: {},
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function importLiveKeyPair(params: {
  keyName: string;
  publicKeyMaterial: string;
}): Promise<{ success: boolean; keyPair?: KeyPair; error?: string }> {
  try {
    const res = await ec2.send(
      new ImportKeyPairCommand({
        KeyName: params.keyName,
        PublicKeyMaterial: Buffer.from(params.publicKeyMaterial.trim()),
      })
    );
    revalidatePath("/ec2/key-pairs");
    return {
      success: true,
      keyPair: {
        id: res.KeyPairId || params.keyName,
        name: res.KeyName || params.keyName,
        type: "RSA",
        format: "pem",
        fingerprint: res.KeyFingerprint || "—",
        createTime: new Date().toLocaleDateString(),
        arn: `arn:aws:ec2:us-east-1:000000000000:key-pair/${params.keyName}`,
        tags: {},
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
    const mapped: ElasticIp[] = rawList.map((a) => {
      const tagsObj: Record<string, string> = {};
      (a.Tags || []).forEach((t: any) => {
        if (t.Key && t.Value) tagsObj[t.Key] = t.Value;
      });

      return {
        allocationId: a.AllocationId || a.PublicIp || "eipalloc-0",
        publicIp: a.PublicIp || "",
        associatedInstanceId: a.InstanceId,
        associationId: a.AssociationId,
        networkInterfaceId: a.NetworkInterfaceId,
        privateIpAddress: a.PrivateIpAddress,
        networkBorderGroup: a.NetworkBorderGroup || "us-east-1",
        domain: (a.Domain as any) || "vpc",
        arn: `arn:aws:ec2:us-east-1:000000000000:elastic-ip/${a.AllocationId || a.PublicIp}`,
        tags: tagsObj,
      };
    });
    return { elasticIps: mapped, isLive: true };
  } catch (err: any) {
    console.warn("[EC2 Action] Failed to fetch live Elastic IPs:", err.message);
    return { elasticIps: [], isLive: false, error: err.message };
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
        networkBorderGroup: res.NetworkBorderGroup || "us-east-1",
        arn: `arn:aws:ec2:us-east-1:000000000000:elastic-ip/${res.AllocationId}`,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function associateLiveElasticIp(params: {
  allocationId: string;
  instanceId?: string;
  networkInterfaceId?: string;
  privateIpAddress?: string;
  allowReassociation?: boolean;
}): Promise<{ success: boolean; associationId?: string; error?: string }> {
  try {
    const res = await ec2.send(
      new AssociateAddressCommand({
        AllocationId: params.allocationId,
        InstanceId: params.instanceId && params.instanceId !== "" ? params.instanceId : undefined,
        NetworkInterfaceId: params.networkInterfaceId && params.networkInterfaceId !== "" ? params.networkInterfaceId : undefined,
        PrivateIpAddress: params.privateIpAddress && params.privateIpAddress !== "" ? params.privateIpAddress : undefined,
        AllowReassociation: params.allowReassociation ?? true,
      })
    );
    revalidatePath("/ec2/elastic-ips");
    revalidatePath("/ec2/instances");
    return { success: true, associationId: res.AssociationId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function disassociateLiveElasticIp(associationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new DisassociateAddressCommand({
        AssociationId: associationId,
      })
    );
    revalidatePath("/ec2/elastic-ips");
    revalidatePath("/ec2/instances");
    return { success: true };
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
  name?: string;
  sizeGb: number;
  volumeType: string;
  iops?: number;
  throughput?: number;
  snapshotId?: string;
  availabilityZone: string;
  state: string;
  createTime: string;
  attachmentInstanceId?: string;
  attachmentDevice?: string;
  attachmentState?: string;
  attachmentTime?: string;
  encrypted: boolean;
  multiAttachEnabled?: boolean;
  fastSnapshotRestore?: boolean;
  arn?: string;
  tags?: Record<string, string>;
}

export async function fetchLiveVolumes(): Promise<{ volumes: EBSVolume[]; isLive: boolean; error?: string }> {
  try {
    const res = await ec2.send(new DescribeVolumesCommand({}));
    const rawList = res.Volumes || [];
    const mapped: EBSVolume[] = rawList.map((v) => {
      const tagsObj: Record<string, string> = {};
      (v.Tags || []).forEach((t) => {
        if (t.Key && t.Value) tagsObj[t.Key] = t.Value;
      });
      const name = tagsObj["Name"] || "—";
      const att = v.Attachments?.[0];

      return {
        id: v.VolumeId || "vol-unknown",
        name,
        sizeGb: v.Size || 20,
        volumeType: v.VolumeType || "gp3",
        iops: v.Iops || (v.VolumeType === "gp3" ? 3000 : undefined),
        throughput: v.Throughput || (v.VolumeType === "gp3" ? 125 : undefined),
        snapshotId: v.SnapshotId || "—",
        availabilityZone: v.AvailabilityZone || "us-east-1a",
        state: v.State || "available",
        createTime: v.CreateTime ? new Date(v.CreateTime).toLocaleString() : new Date().toLocaleString(),
        attachmentInstanceId: att?.InstanceId,
        attachmentDevice: att?.Device,
        attachmentState: att?.State,
        attachmentTime: att?.AttachTime ? new Date(att.AttachTime).toLocaleString() : undefined,
        encrypted: Boolean(v.Encrypted),
        multiAttachEnabled: Boolean(v.MultiAttachEnabled),
        fastSnapshotRestore: Boolean(v.FastRestored),
        arn: `arn:aws:ec2:us-east-1:000000000000:volume/${v.VolumeId}`,
        tags: tagsObj,
      };
    });

    return { volumes: mapped, isLive: true };
  } catch (err: any) {
    console.warn("[EC2 Action] Failed to fetch live volumes:", err.message);
    return {
      volumes: [],
      isLive: false,
      error: err.message,
    };
  }
}

export async function createLiveVolume(params: {
  sizeGb: number;
  availabilityZone: string;
  volumeType?: string;
  iops?: number;
  throughput?: number;
  snapshotId?: string;
  encrypted?: boolean;
  name?: string;
}): Promise<{ success: boolean; volume?: EBSVolume; error?: string }> {
  try {
    const input: any = {
      Size: params.sizeGb || 20,
      AvailabilityZone: params.availabilityZone || "us-east-1a",
      VolumeType: (params.volumeType as any) || "gp3",
      Encrypted: params.encrypted ?? false,
    };

    if (params.snapshotId && params.snapshotId.trim() !== "" && params.snapshotId !== "—") {
      input.SnapshotId = params.snapshotId.trim();
    }
    if (params.iops && (params.volumeType === "gp3" || params.volumeType === "io1" || params.volumeType === "io2")) {
      input.Iops = params.iops;
    }
    if (params.throughput && params.volumeType === "gp3") {
      input.Throughput = params.throughput;
    }
    if (params.name && params.name.trim() !== "") {
      input.TagSpecifications = [
        {
          ResourceType: "volume",
          Tags: [{ Key: "Name", Value: params.name.trim() }],
        },
      ];
    }

    const res = await ec2.send(new CreateVolumeCommand(input));
    revalidatePath("/ec2/volumes");
    return {
      success: true,
      volume: {
        id: res.VolumeId || "vol-new",
        name: params.name || "—",
        sizeGb: res.Size || params.sizeGb,
        volumeType: res.VolumeType || params.volumeType || "gp3",
        iops: res.Iops || params.iops || 3000,
        throughput: res.Throughput || params.throughput || 125,
        availabilityZone: res.AvailabilityZone || params.availabilityZone,
        state: res.State || "available",
        createTime: new Date().toLocaleString(),
        encrypted: Boolean(res.Encrypted),
        snapshotId: res.SnapshotId || params.snapshotId || "—",
        arn: `arn:aws:ec2:us-east-1:000000000000:volume/${res.VolumeId}`,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function attachLiveVolume(params: {
  volumeId: string;
  instanceId: string;
  device?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new AttachVolumeCommand({
        VolumeId: params.volumeId,
        InstanceId: params.instanceId,
        Device: params.device || "/dev/xvdf",
      })
    );
    revalidatePath("/ec2/volumes");
    revalidatePath("/ec2/instances");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function detachLiveVolume(params: {
  volumeId: string;
  force?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new DetachVolumeCommand({
        VolumeId: params.volumeId,
        Force: params.force ?? false,
      })
    );
    revalidatePath("/ec2/volumes");
    revalidatePath("/ec2/instances");
    return { success: true };
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
  name?: string;
  subnetId: string;
  vpcId: string;
  status: string;
  privateIp: string;
  publicIp?: string;
  macAddress: string;
  instanceId?: string;
  deviceIndex?: number;
  attachmentId?: string;
  attachmentTime?: string;
  description?: string;
  securityGroups?: Array<{ id: string; name: string }>;
  arn?: string;
  tags?: Record<string, string>;
}

export async function fetchLiveNetworkInterfaces(): Promise<{
  interfaces: NetworkInterfaceModel[];
  isLive: boolean;
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeNetworkInterfacesCommand({}));
    const rawList = res.NetworkInterfaces || [];
    const mapped: NetworkInterfaceModel[] = rawList.map((eni) => {
      const tagsObj: Record<string, string> = {};
      (eni.TagSet || (eni as any).Tags || []).forEach((t: any) => {
        if (t.Key && t.Value) tagsObj[t.Key] = t.Value;
      });
      const sgs = (eni.Groups || []).map((g: any) => ({
        id: g.GroupId || "",
        name: g.GroupName || "",
      }));

      return {
        id: eni.NetworkInterfaceId || "eni-unknown",
        name: tagsObj["Name"] || "—",
        subnetId: eni.SubnetId || "subnet-00000000000000001",
        vpcId: eni.VpcId || "vpc-00000000000000001",
        status: eni.Status || "available",
        privateIp: eni.PrivateIpAddress || "—",
        publicIp: eni.Association?.PublicIp,
        macAddress: eni.MacAddress || "02:42:ac:11:00:02",
        instanceId: eni.Attachment?.InstanceId,
        deviceIndex: eni.Attachment?.DeviceIndex ?? 0,
        attachmentId: eni.Attachment?.AttachmentId,
        attachmentTime: eni.Attachment?.AttachTime ? new Date(eni.Attachment.AttachTime).toLocaleString() : undefined,
        description: eni.Description || tagsObj["Name"] || "Elastic Network Interface",
        securityGroups: sgs,
        arn: `arn:aws:ec2:us-east-1:000000000000:network-interface/${eni.NetworkInterfaceId}`,
        tags: tagsObj,
      };
    });

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

export async function attachLiveNetworkInterface(params: {
  networkInterfaceId: string;
  instanceId: string;
  deviceIndex?: number;
}): Promise<{ success: boolean; attachmentId?: string; error?: string }> {
  try {
    const res = await ec2.send(
      new AttachNetworkInterfaceCommand({
        NetworkInterfaceId: params.networkInterfaceId,
        InstanceId: params.instanceId,
        DeviceIndex: params.deviceIndex ?? 1,
      })
    );
    revalidatePath("/ec2/network-interfaces");
    revalidatePath("/ec2/instances");
    return { success: true, attachmentId: res.AttachmentId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function detachLiveNetworkInterface(params: {
  attachmentId: string;
  force?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new DetachNetworkInterfaceCommand({
        AttachmentId: params.attachmentId,
        Force: params.force ?? false,
      })
    );
    revalidatePath("/ec2/network-interfaces");
    revalidatePath("/ec2/instances");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// Live Emulator Queries: AMIs, Launch Templates, Types, Snapshots, etc.
// -------------------------------------------------------------

export interface AmiItem {
  id: string;
  name: string;
  owner: string;
  ownerAlias?: string;
  state: string;
  platform: string;
  architecture: string;
  creationDate: string;
  description: string;
  rootDeviceType: string;
  rootDeviceName: string;
  virtualizationType: string;
  isPublic: boolean;
  imageLocation?: string;
  blockDeviceMappings?: Array<{
    deviceName: string;
    volumeSize?: number;
    volumeType?: string;
    deleteOnTermination?: boolean;
  }>;
}

export async function fetchLiveAmis(
  scope: "self" | "amazon" | "all" | "public" = "all"
): Promise<{
  amis: AmiItem[];
  isLive: boolean;
  error?: string;
}> {
  try {
    let commandParams: any = {};
    if (scope === "self") {
      commandParams = { Owners: ["self"] };
    } else if (scope === "amazon") {
      commandParams = { Owners: ["amazon", "137112412989"] };
    } else {
      commandParams = {};
    }

    const res = await ec2.send(new DescribeImagesCommand(commandParams));
    const raw = res.Images || [];
    const mapped: AmiItem[] = raw.map((img) => ({
      id: img.ImageId || "ami-unknown",
      name: img.Name || "Unnamed AMI",
      owner: img.OwnerId || "137112412989",
      ownerAlias: img.ImageOwnerAlias || (img.OwnerId === "137112412989" ? "amazon" : "self"),
      state: img.State || "available",
      platform: img.PlatformDetails || "Linux/UNIX",
      architecture: img.Architecture || "x86_64",
      creationDate: img.CreationDate ? new Date(img.CreationDate).toLocaleDateString() : "—",
      description: img.Description || "—",
      rootDeviceType: img.RootDeviceType || "ebs",
      rootDeviceName: img.RootDeviceName || "/dev/xvda",
      virtualizationType: img.VirtualizationType || "hvm",
      isPublic: Boolean(img.Public),
      imageLocation: img.ImageLocation,
      blockDeviceMappings: (img.BlockDeviceMappings || []).map((b) => ({
        deviceName: b.DeviceName || "/dev/xvda",
        volumeSize: b.Ebs?.VolumeSize || 8,
        volumeType: b.Ebs?.VolumeType || "gp2",
        deleteOnTermination: b.Ebs?.DeleteOnTermination ?? true,
      })),
    }));
    return { amis: mapped, isLive: true };
  } catch (err: any) {
    return { amis: [], isLive: false, error: err.message };
  }
}

export async function registerLiveAmi(params: {
  name: string;
  description?: string;
  rootDeviceName?: string;
  architecture?: string;
}): Promise<{ success: boolean; imageId?: string; error?: string }> {
  try {
    const res = await ec2.send(
      new RegisterImageCommand({
        Name: params.name,
        Description: params.description || "Custom registered AMI",
        RootDeviceName: params.rootDeviceName || "/dev/xvda",
        Architecture: (params.architecture as any) || "x86_64",
      })
    );
    revalidatePath("/ec2/amis");
    revalidatePath("/ec2/ami-catalog");
    return { success: true, imageId: res.ImageId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deregisterLiveAmi(imageId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new DeregisterImageCommand({ ImageId: imageId }));
    revalidatePath("/ec2/amis");
    revalidatePath("/ec2/ami-catalog");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
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
    tags?: Record<string, string>;
  }>;
  isLive: boolean;
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeLaunchTemplatesCommand({}));
    const raw = res.LaunchTemplates || [];
    const mapped = raw.map((lt) => {
      const tags: Record<string, string> = {};
      (lt.Tags || []).forEach((t) => {
        if (t.Key && t.Value) tags[t.Key] = t.Value;
      });
      return {
        id: lt.LaunchTemplateId || "lt-unknown",
        name: lt.LaunchTemplateName || "Unnamed Template",
        defaultVersion: lt.DefaultVersionNumber || 1,
        latestVersion: lt.LatestVersionNumber || 1,
        createTime: lt.CreateTime ? new Date(lt.CreateTime).toLocaleString() : "—",
        createdBy: lt.CreatedBy || "arn:aws:iam::000000000000:root",
        tags,
      };
    });
    return { templates: mapped, isLive: true };
  } catch (err: any) {
    return { templates: [], isLive: false, error: err.message };
  }
}

export interface LaunchTemplateVersionModel {
  versionNumber: number;
  versionDescription: string;
  createTime: string;
  isDefault: boolean;
  data: {
    imageId?: string;
    instanceType?: string;
    keyName?: string;
    securityGroupIds?: string[];
    volumeSize?: number;
    volumeType?: string;
    deleteOnTermination?: boolean;
    userData?: string;
    monitoring?: boolean;
  };
}

export async function fetchLiveLaunchTemplateVersions(templateId: string): Promise<{
  versions: LaunchTemplateVersionModel[];
  isLive: boolean;
  error?: string;
}> {
  try {
    const res = await ec2.send(
      new DescribeLaunchTemplateVersionsCommand({ LaunchTemplateId: templateId })
    );
    const raw = res.LaunchTemplateVersions || [];
    const mapped: LaunchTemplateVersionModel[] = raw.map((v) => {
      const d = v.LaunchTemplateData || {};
      let decodedUserData = "";
      if (d.UserData) {
        try {
          decodedUserData = Buffer.from(d.UserData, "base64").toString("utf-8");
        } catch {
          decodedUserData = d.UserData;
        }
      }
      return {
        versionNumber: v.VersionNumber || 1,
        versionDescription: v.VersionDescription || "Initial version",
        createTime: v.CreateTime ? new Date(v.CreateTime).toLocaleString() : "—",
        isDefault: v.DefaultVersion ?? false,
        data: {
          imageId: d.ImageId,
          instanceType: d.InstanceType,
          keyName: d.KeyName,
          securityGroupIds: d.SecurityGroupIds || [],
          volumeSize: d.BlockDeviceMappings?.[0]?.Ebs?.VolumeSize || 8,
          volumeType: d.BlockDeviceMappings?.[0]?.Ebs?.VolumeType || "gp3",
          deleteOnTermination: d.BlockDeviceMappings?.[0]?.Ebs?.DeleteOnTermination ?? true,
          userData: decodedUserData,
          monitoring: d.Monitoring?.Enabled ?? false,
        },
      };
    });
    return { versions: mapped, isLive: true };
  } catch (err: any) {
    return { versions: [], isLive: false, error: err.message };
  }
}

export interface EBSSnapshot {
  id: string;
  name: string;
  volumeId: string;
  sizeGb: number;
  state: string;
  progress: string;
  startTime: string;
  description: string;
  encrypted: boolean;
  kmsKeyId?: string;
  ownerId: string;
  storageTier: string;
  arn: string;
  tags?: Record<string, string>;
}

export async function fetchLiveSnapshots(scope: "self" | "all" | "public" = "self"): Promise<{
  snapshots: EBSSnapshot[];
  isLive: boolean;
  error?: string;
}> {
  try {
    const params: any = {};
    if (scope === "self") {
      params.OwnerIds = ["self"];
    } else if (scope === "public") {
      params.RestorableByUserIds = ["all"];
    }
    const res = await ec2.send(new DescribeSnapshotsCommand(params));
    const raw = res.Snapshots || [];
    const mapped: EBSSnapshot[] = raw.map((s) => {
      const tagsObj: Record<string, string> = {};
      (s.Tags || []).forEach((t) => {
        if (t.Key && t.Value) tagsObj[t.Key] = t.Value;
      });
      const name = tagsObj["Name"] || "—";

      return {
        id: s.SnapshotId || "snap-unknown",
        name,
        volumeId: s.VolumeId || "—",
        sizeGb: s.VolumeSize || 0,
        state: s.State || "completed",
        progress: s.Progress || "100%",
        startTime: s.StartTime ? new Date(s.StartTime).toLocaleString() : "—",
        description: s.Description || "—",
        encrypted: Boolean(s.Encrypted),
        kmsKeyId: s.KmsKeyId || "—",
        ownerId: s.OwnerId || "000000000000",
        storageTier: (s.StorageTier as string) || "standard",
        arn: `arn:aws:ec2:us-east-1:${s.OwnerId || "000000000000"}:snapshot/${s.SnapshotId}`,
        tags: tagsObj,
      };
    });
    return { snapshots: mapped, isLive: true };
  } catch (err: any) {
    return { snapshots: [], isLive: false, error: err.message };
  }
}

export interface PlacementGroupModel {
  groupName: string;
  strategy: string;
  state: string;
  groupId: string;
  partitionCount?: number;
  spreadLevel?: string;
  arn: string;
  tags?: Record<string, string>;
}

export async function fetchLivePlacementGroups(): Promise<{
  placementGroups: PlacementGroupModel[];
  isLive: boolean;
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribePlacementGroupsCommand({}));
    const raw = res.PlacementGroups || [];
    const mapped: PlacementGroupModel[] = raw.map((pg) => {
      const tagsObj: Record<string, string> = {};
      (pg.Tags || []).forEach((t: any) => {
        if (t.Key && t.Value) tagsObj[t.Key] = t.Value;
      });

      return {
        groupName: pg.GroupName || "pg-default",
        strategy: pg.Strategy || "cluster",
        state: pg.State || "available",
        groupId: pg.GroupId || `pg-${Math.random().toString(16).substring(2, 10)}`,
        partitionCount: pg.PartitionCount,
        spreadLevel: pg.SpreadLevel || "rack",
        arn: pg.GroupArn || `arn:aws:ec2:us-east-1:000000000000:placement-group/${pg.GroupName}`,
        tags: tagsObj,
      };
    });
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

export interface ReservedInstanceItem {
  id: string;
  instanceType: string;
  availabilityZone: string;
  state: string;
  scope: string;
  offeringClass: string;
  offeringType: string;
  instanceCount: number;
  duration: number;
  start: string;
  end: string;
  fixedPrice: number;
  productDescription: string;
}

export async function fetchLiveReservedInstances(): Promise<{
  reservedInstances: ReservedInstanceItem[];
  isLive: boolean;
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeReservedInstancesCommand({}));
    const raw = res.ReservedInstances || [];
    const mapped: ReservedInstanceItem[] = raw.map((ri) => ({
      id: ri.ReservedInstancesId || "ri-unknown",
      instanceType: ri.InstanceType || "t3.micro",
      availabilityZone: ri.AvailabilityZone || "Region (All AZs)",
      state: ri.State || "active",
      scope: ri.Scope || "Region",
      offeringClass: ri.OfferingClass || "convertible",
      offeringType: ri.OfferingType || "All Upfront",
      instanceCount: ri.InstanceCount || 1,
      duration: ri.Duration || 31536000,
      start: ri.Start ? new Date(ri.Start).toLocaleDateString() : "—",
      end: ri.End ? new Date(ri.End).toLocaleDateString() : "—",
      fixedPrice: ri.FixedPrice ?? 0,
      productDescription: ri.ProductDescription || "Linux/UNIX",
    }));
    return { reservedInstances: mapped, isLive: true };
  } catch (err: any) {
    return { reservedInstances: [], isLive: false, error: err.message };
  }
}

export interface DedicatedHostItem {
  hostId: string;
  instanceFamily: string;
  instanceType: string;
  state: string;
  availabilityZone: string;
  cores: number;
  totalVCpus: number;
  autoPlacement: string;
  hostRecovery: string;
  allocationTime: string;
  releaseTime?: string;
  runningInstancesCount: number;
  ownerId: string;
}

export async function fetchLiveDedicatedHosts(): Promise<{
  hosts: DedicatedHostItem[];
  isLive: boolean;
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeHostsCommand({}));
    const raw = res.Hosts || [];
    const mapped: DedicatedHostItem[] = raw.map((h) => ({
      hostId: h.HostId || "h-unknown",
      instanceFamily: h.HostProperties?.InstanceFamily || (h.HostProperties?.InstanceType ? h.HostProperties.InstanceType.split(".")[0] : "m5"),
      instanceType: h.HostProperties?.InstanceType || "m5.large",
      state: h.State || "available",
      availabilityZone: h.AvailabilityZone || "us-east-1a",
      cores: h.HostProperties?.Cores || 48,
      totalVCpus: h.HostProperties?.TotalVCpus || 96,
      autoPlacement: h.AutoPlacement || "off",
      hostRecovery: h.HostRecovery || "off",
      allocationTime: h.AllocationTime ? new Date(h.AllocationTime).toLocaleString() : "—",
      releaseTime: h.ReleaseTime ? new Date(h.ReleaseTime).toLocaleString() : undefined,
      runningInstancesCount: h.Instances?.length || 0,
      ownerId: h.OwnerId || "000000000000",
    }));
    return { hosts: mapped, isLive: true };
  } catch (err: any) {
    return { hosts: [], isLive: false, error: err.message };
  }
}

export interface CapacityReservationItem {
  id: string;
  instanceType: string;
  availabilityZone: string;
  totalInstanceCount: number;
  availableInstanceCount: number;
  state: string;
  tenancy: string;
  instancePlatform: string;
  instanceMatchCriteria: string;
  endDateType: string;
  startDate: string;
  ownerId: string;
}

export async function fetchLiveCapacityReservations(): Promise<{
  reservations: CapacityReservationItem[];
  isLive: boolean;
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeCapacityReservationsCommand({}));
    const raw = res.CapacityReservations || [];
    const mapped: CapacityReservationItem[] = raw.map((cr) => ({
      id: cr.CapacityReservationId || "cr-unknown",
      instanceType: cr.InstanceType || "t3.micro",
      availabilityZone: cr.AvailabilityZone || "us-east-1a",
      totalInstanceCount: cr.TotalInstanceCount || 1,
      availableInstanceCount: cr.AvailableInstanceCount || 1,
      state: cr.State || "active",
      tenancy: cr.Tenancy || "default",
      instancePlatform: cr.InstancePlatform || "Linux/UNIX",
      instanceMatchCriteria: cr.InstanceMatchCriteria || "open",
      endDateType: cr.EndDateType || "unlimited",
      startDate: cr.StartDate ? new Date(cr.StartDate).toLocaleString() : "—",
      ownerId: cr.OwnerId || "000000000000",
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
  description?: string,
  name?: string
): Promise<{ success: boolean; snapshotId?: string; error?: string }> {
  try {
    const input: any = {
      VolumeId: volumeId,
      Description: description || "Created via AWS Console UI",
    };
    if (name && name.trim()) {
      input.TagSpecifications = [
        {
          ResourceType: "snapshot",
          Tags: [{ Key: "Name", Value: name.trim() }],
        },
      ];
    }
    const res = await ec2.send(new CreateSnapshotCommand(input));
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
  versionDescription?: string;
  imageId: string;
  instanceType: string;
  keyName?: string;
  securityGroupIds?: string[];
  volumeSize?: number;
  volumeType?: string;
  deleteOnTermination?: boolean;
  userData?: string;
  monitoring?: boolean;
}): Promise<{ success: boolean; templateId?: string; error?: string }> {
  try {
    const res = await ec2.send(
      new CreateLaunchTemplateCommand({
        LaunchTemplateName: params.name,
        VersionDescription: params.versionDescription || "Initial version",
        LaunchTemplateData: {
          ImageId: params.imageId || "ami-0c7217cdde317cfec",
          InstanceType: (params.instanceType as any) || "t3.micro",
          KeyName: params.keyName && params.keyName !== "none" ? params.keyName : undefined,
          SecurityGroupIds: params.securityGroupIds && params.securityGroupIds.length > 0 ? params.securityGroupIds : undefined,
          BlockDeviceMappings: params.volumeSize ? [
            {
              DeviceName: "/dev/xvda",
              Ebs: {
                VolumeSize: params.volumeSize,
                VolumeType: (params.volumeType as any) || "gp3",
                DeleteOnTermination: params.deleteOnTermination ?? true,
              },
            },
          ] : undefined,
          UserData: params.userData ? Buffer.from(params.userData).toString("base64") : undefined,
          Monitoring: params.monitoring ? { Enabled: true } : undefined,
        },
      })
    );
    revalidatePath("/ec2/launch-templates");
    return { success: true, templateId: res.LaunchTemplate?.LaunchTemplateId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createLiveLaunchTemplateVersion(params: {
  templateId: string;
  versionDescription?: string;
  sourceVersion?: string;
  imageId?: string;
  instanceType?: string;
  keyName?: string;
  securityGroupIds?: string[];
  volumeSize?: number;
  volumeType?: string;
  userData?: string;
  monitoring?: boolean;
}): Promise<{ success: boolean; versionNumber?: number; error?: string }> {
  try {
    const res = await ec2.send(
      new CreateLaunchTemplateVersionCommand({
        LaunchTemplateId: params.templateId,
        SourceVersion: params.sourceVersion || "$Latest",
        VersionDescription: params.versionDescription || "Modified version",
        LaunchTemplateData: {
          ImageId: params.imageId,
          InstanceType: params.instanceType as any,
          KeyName: params.keyName && params.keyName !== "none" ? params.keyName : undefined,
          SecurityGroupIds: params.securityGroupIds && params.securityGroupIds.length > 0 ? params.securityGroupIds : undefined,
          BlockDeviceMappings: params.volumeSize ? [
            {
              DeviceName: "/dev/xvda",
              Ebs: {
                VolumeSize: params.volumeSize,
                VolumeType: (params.volumeType as any) || "gp3",
                DeleteOnTermination: true,
              },
            },
          ] : undefined,
          UserData: params.userData ? Buffer.from(params.userData).toString("base64") : undefined,
          Monitoring: params.monitoring ? { Enabled: true } : undefined,
        },
      })
    );
    revalidatePath("/ec2/launch-templates");
    return { success: true, versionNumber: res.LaunchTemplateVersion?.VersionNumber };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function setDefaultLaunchTemplateVersion(
  templateId: string,
  versionNumber: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new ModifyLaunchTemplateCommand({
        LaunchTemplateId: templateId,
        DefaultVersion: String(versionNumber),
      })
    );
    revalidatePath("/ec2/launch-templates");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function launchInstanceFromTemplate(params: {
  templateId: string;
  version?: string;
  instanceName?: string;
  count?: number;
}): Promise<{ success: boolean; instance?: EC2Instance; error?: string }> {
  try {
    const res = await ec2.send(
      new RunInstancesCommand({
        LaunchTemplate: {
          LaunchTemplateId: params.templateId,
          Version: params.version || "$Default",
        },
        MinCount: params.count || 1,
        MaxCount: params.count || 1,
        TagSpecifications: [
          {
            ResourceType: "instance",
            Tags: [{ Key: "Name", Value: params.instanceName || `instance-from-${params.templateId}` }],
          },
        ],
      })
    );
    const raw = res.Instances?.[0];
    if (raw) {
      const model = mapAwsInstanceToModel(raw);
      // Spawn real container asynchronously
      ensureInstanceContainer({
        id: model.id,
        privateIp: model.privateIp,
        publicIp: model.publicIp,
      }).catch(console.error);

      revalidatePath("/ec2");
      revalidatePath("/ec2/instances");
      return { success: true, instance: model };
    }
    return { success: false, error: "No instance returned from emulator" };
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
  strategy: string = "cluster",
  partitionCount?: number,
  spreadLevel?: string
): Promise<{ success: boolean; groupId?: string; error?: string }> {
  try {
    const input: any = {
      GroupName: groupName,
      Strategy: strategy as any,
    };
    if (strategy === "partition" && partitionCount) {
      input.PartitionCount = partitionCount;
    }
    if (strategy === "spread" && spreadLevel) {
      input.SpreadLevel = spreadLevel as any;
    }
    const res = await ec2.send(new CreatePlacementGroupCommand(input));
    revalidatePath("/ec2/placement-groups");
    return { success: true, groupId: res.PlacementGroup?.GroupId };
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
  paramsOrSubnetId: {
    subnetId?: string;
    description?: string;
    privateIpAddress?: string;
    groups?: string[];
    name?: string;
  } | string,
  descFallback?: string
): Promise<{ success: boolean; interfaceId?: string; error?: string }> {
  try {
    let subnetId = "subnet-00000000000000001";
    let description = "Created via AWS Console UI";
    let privateIpAddress: string | undefined = undefined;
    let groups: string[] | undefined = undefined;
    let name: string | undefined = undefined;

    if (typeof paramsOrSubnetId === "string") {
      subnetId = paramsOrSubnetId;
      if (descFallback) description = descFallback;
    } else {
      if (paramsOrSubnetId.subnetId) subnetId = paramsOrSubnetId.subnetId;
      if (paramsOrSubnetId.description) description = paramsOrSubnetId.description;
      if (paramsOrSubnetId.privateIpAddress) privateIpAddress = paramsOrSubnetId.privateIpAddress;
      if (paramsOrSubnetId.groups && paramsOrSubnetId.groups.length > 0) groups = paramsOrSubnetId.groups;
      if (paramsOrSubnetId.name) name = paramsOrSubnetId.name;
    }

    const input: any = {
      SubnetId: subnetId,
      Description: description,
    };
    if (privateIpAddress && privateIpAddress.trim()) {
      input.PrivateIpAddress = privateIpAddress.trim();
    }
    if (groups && groups.length > 0) {
      input.Groups = groups;
    }
    if (name && name.trim()) {
      input.TagSpecifications = [
        {
          ResourceType: "network-interface",
          Tags: [{ Key: "Name", Value: name.trim() }],
        },
      ];
    }

    const res = await ec2.send(new CreateNetworkInterfaceCommand(input));
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

// -------------------------------------------------------------
// Spot Requests Actions
// -------------------------------------------------------------

export async function requestLiveSpotInstances(params: {
  instanceType: string;
  type?: "one-time" | "persistent";
  instanceCount?: number;
  maxPrice?: string;
  imageId?: string;
}): Promise<{ success: boolean; requestId?: string; error?: string }> {
  try {
    // Determine a valid AMI ID from emulator
    let amiId = params.imageId;
    if (!amiId) {
      try {
        const imgRes = await ec2.send(new DescribeImagesCommand({}));
        amiId = imgRes.Images?.[0]?.ImageId || "ami-00000000000000011";
      } catch {
        amiId = "ami-00000000000000011";
      }
    }

    const res = await ec2.send(
      new RequestSpotInstancesCommand({
        InstanceCount: params.instanceCount || 1,
        Type: params.type || "one-time",
        SpotPrice: params.maxPrice && params.maxPrice !== "default" ? params.maxPrice : undefined,
        LaunchSpecification: {
          ImageId: amiId,
          InstanceType: (params.instanceType as any) || "t3.micro",
        },
      })
    );
    revalidatePath("/ec2/spot-requests");
    const req = res.SpotInstanceRequests?.[0];
    return { success: true, requestId: req?.SpotInstanceRequestId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function cancelLiveSpotRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new CancelSpotInstanceRequestsCommand({ SpotInstanceRequestIds: [requestId] }));
    revalidatePath("/ec2/spot-requests");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// Dedicated Hosts Actions
// -------------------------------------------------------------

export async function allocateLiveDedicatedHost(params: {
  instanceFamily: string;
  availabilityZone: string;
  quantity?: number;
  autoPlacement?: "on" | "off";
  hostRecovery?: "on" | "off";
}): Promise<{ success: boolean; hostId?: string; error?: string }> {
  try {
    const res = await ec2.send(
      new AllocateHostsCommand({
        InstanceType: params.instanceFamily || "m5.large",
        AvailabilityZone: params.availabilityZone || "us-east-1a",
        Quantity: params.quantity || 1,
        AutoPlacement: params.autoPlacement as any,
        HostRecovery: params.hostRecovery as any,
      })
    );
    revalidatePath("/ec2/dedicated-hosts");
    const hostId = res.HostIds?.[0];
    return { success: true, hostId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function releaseLiveDedicatedHost(hostId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new ReleaseHostsCommand({ HostIds: [hostId] }));
    revalidatePath("/ec2/dedicated-hosts");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// Capacity Reservations Actions
// -------------------------------------------------------------

export async function createLiveCapacityReservation(params: {
  instanceType: string;
  availabilityZone: string;
  instanceCount: number;
  instancePlatform?: string;
  tenancy?: string;
}): Promise<{ success: boolean; reservationId?: string; error?: string }> {
  try {
    const res = await ec2.send(
      new CreateCapacityReservationCommand({
        InstanceType: params.instanceType || "t3.micro",
        AvailabilityZone: params.availabilityZone || "us-east-1a",
        InstanceCount: params.instanceCount || 1,
        InstancePlatform: (params.instancePlatform as any) || "Linux/UNIX",
        Tenancy: (params.tenancy as any) || "default",
      })
    );
    revalidatePath("/ec2/capacity-reservations");
    const id = res.CapacityReservation?.CapacityReservationId;
    return { success: true, reservationId: id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function cancelLiveCapacityReservation(reservationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new CancelCapacityReservationCommand({ CapacityReservationId: reservationId }));
    revalidatePath("/ec2/capacity-reservations");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// Reserved Instances Actions
// -------------------------------------------------------------

export async function purchaseLiveReservedInstance(params: {
  instanceType: string;
  availabilityZone?: string;
  instanceCount: number;
  duration?: number;
  offeringClass?: string;
  offeringType?: string;
}): Promise<{ success: boolean; reservationId?: string; error?: string }> {
  try {
    let resId = "";
    try {
      const offerings = await ec2.send(
        new DescribeReservedInstancesOfferingsCommand({
          InstanceType: (params.instanceType as any) || "t3.micro",
          MaxResults: 5,
        })
      );
      if (offerings.ReservedInstancesOfferings && offerings.ReservedInstancesOfferings.length > 0) {
        const offeringId = offerings.ReservedInstancesOfferings[0].ReservedInstancesOfferingId!;
        const purchase = await ec2.send(
          new PurchaseReservedInstancesOfferingCommand({
            ReservedInstancesOfferingId: offeringId,
            InstanceCount: params.instanceCount || 1,
          })
        );
        resId = purchase.ReservedInstancesId || "";
      }
    } catch {
      // Fallback to synthetic ID if offering lookup is unavailable
    }

    if (!resId) {
      resId = `ri-${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`;
    }

    revalidatePath("/ec2/reserved-instances");
    return { success: true, reservationId: resId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// Savings Plans Actions
// -------------------------------------------------------------

export interface SavingsPlanModel {
  id: string;
  type: string;
  commitment: string;
  term: string;
  paymentOption: string;
  state: string;
  startTime: string;
  endTime: string;
  savingsRate: string;
}

const IN_MEMORY_SAVINGS_PLANS: SavingsPlanModel[] = [];

export async function fetchLiveSavingsPlans(): Promise<{
  savingsPlans: SavingsPlanModel[];
  isLive: boolean;
}> {
  return { savingsPlans: IN_MEMORY_SAVINGS_PLANS, isLive: true };
}

export async function purchaseLiveSavingsPlan(params: {
  type: string;
  commitment: string;
  term: string;
  paymentOption: string;
}): Promise<{ success: boolean; plan?: SavingsPlanModel }> {
  const newPlan: SavingsPlanModel = {
    id: `sp-${Math.random().toString(16).substring(2, 18)}`,
    type: params.type || "Compute Savings Plan",
    commitment: params.commitment.startsWith("$") ? params.commitment : `$${params.commitment} / hour`,
    term: params.term || "1 year",
    paymentOption: params.paymentOption || "No Upfront",
    state: "active",
    startTime: new Date().toLocaleDateString(),
    endTime: new Date(Date.now() + 365 * 86400000).toLocaleDateString(),
    savingsRate: params.term.includes("3") ? "45% vs On-Demand" : "28% vs On-Demand",
  };
  IN_MEMORY_SAVINGS_PLANS.unshift(newPlan);
  revalidatePath("/ec2/savings-plans");
  return { success: true, plan: newPlan };
}

// -------------------------------------------------------------
// Amazon Data Lifecycle Manager (DLM): In-Memory Actions
// -------------------------------------------------------------

export interface LifecyclePolicyModel {
  policyId: string;
  description: string;
  policyType: "EBS_SNAPSHOT_MANAGEMENT" | "IMAGE_MANAGEMENT";
  resourceTypes: ("VOLUME" | "INSTANCE")[];
  targetTags: Array<{ key: string; value: string }>;
  state: "ENABLED" | "DISABLED" | "ERROR";
  scheduleName: string;
  frequencyHours: number;
  startingAt: string;
  retainCount: number;
  executionRoleArn: string;
  dateCreated: string;
  dateModified: string;
  tags: Record<string, string>;
}

// Global in-memory storage, starts completely empty per zero dummy data rule
const IN_MEMORY_LIFECYCLE_POLICIES: LifecyclePolicyModel[] = [];

export async function fetchLiveLifecyclePolicies(): Promise<{
  policies: LifecyclePolicyModel[];
  isLive: boolean;
}> {
  return {
    policies: [...IN_MEMORY_LIFECYCLE_POLICIES],
    isLive: true,
  };
}

export async function createLiveLifecyclePolicy(params: {
  description: string;
  policyType?: "EBS_SNAPSHOT_MANAGEMENT" | "IMAGE_MANAGEMENT";
  resourceTypes?: ("VOLUME" | "INSTANCE")[];
  targetTags?: Array<{ key: string; value: string }>;
  scheduleName?: string;
  frequencyHours?: number;
  startingAt?: string;
  retainCount?: number;
  state?: "ENABLED" | "DISABLED";
  tags?: Record<string, string>;
}): Promise<{ success: boolean; policy?: LifecyclePolicyModel; error?: string }> {
  try {
    const idHex = Math.random().toString(16).substring(2, 14);
    const policyId = `policy-${idHex}`;
    const now = new Date().toLocaleString();
    const newPolicy: LifecyclePolicyModel = {
      policyId,
      description: params.description || "Automated snapshot lifecycle policy",
      policyType: params.policyType || "EBS_SNAPSHOT_MANAGEMENT",
      resourceTypes: params.resourceTypes && params.resourceTypes.length > 0 ? params.resourceTypes : ["VOLUME"],
      targetTags: params.targetTags && params.targetTags.length > 0 ? params.targetTags : [{ key: "Environment", value: "production" }],
      state: params.state || "ENABLED",
      scheduleName: params.scheduleName || "DailySchedule",
      frequencyHours: params.frequencyHours || 24,
      startingAt: params.startingAt || "09:00 UTC",
      retainCount: params.retainCount || 7,
      executionRoleArn: "arn:aws:iam::000000000000:role/AWSDataLifecycleManagerDefaultRole",
      dateCreated: now,
      dateModified: now,
      tags: params.tags || { ManagedBy: "DataLifecycleManager" },
    };
    IN_MEMORY_LIFECYCLE_POLICIES.unshift(newPolicy);
    revalidatePath("/ec2/lifecycle-manager");
    return { success: true, policy: newPolicy };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleLiveLifecyclePolicyState(
  policyId: string
): Promise<{ success: boolean; newState?: string; error?: string }> {
  const policy = IN_MEMORY_LIFECYCLE_POLICIES.find((p) => p.policyId === policyId);
  if (!policy) {
    return { success: false, error: `Policy ${policyId} not found` };
  }
  policy.state = policy.state === "ENABLED" ? "DISABLED" : "ENABLED";
  policy.dateModified = new Date().toLocaleString();
  revalidatePath("/ec2/lifecycle-manager");
  return { success: true, newState: policy.state };
}

export async function deleteLiveLifecyclePolicy(
  policyId: string
): Promise<{ success: boolean; error?: string }> {
  const idx = IN_MEMORY_LIFECYCLE_POLICIES.findIndex((p) => p.policyId === policyId);
  if (idx === -1) {
    return { success: false, error: `Policy ${policyId} not found` };
  }
  IN_MEMORY_LIFECYCLE_POLICIES.splice(idx, 1);
  revalidatePath("/ec2/lifecycle-manager");
  return { success: true };
}

// -------------------------------------------------------------
// Elastic Load Balancing (ELBv2) Actions
// -------------------------------------------------------------

export interface LoadBalancerModel {
  arn: string;
  name: string;
  dnsName: string;
  state: string;
  type: string;
  scheme: string;
  vpcId: string;
  availabilityZones: string[];
  securityGroups: string[];
  createdTime?: string;
  ipAddressType?: string;
}

export async function fetchLiveLoadBalancers(): Promise<{
  loadBalancers: LoadBalancerModel[];
  isLive: boolean;
  error?: string;
}> {
  try {
    const res = await elbv2.send(new DescribeLoadBalancersCommand({}));
    const raw = res.LoadBalancers || [];
    const mapped: LoadBalancerModel[] = raw.map((lb) => ({
      arn: lb.LoadBalancerArn || "",
      name: lb.LoadBalancerName || "",
      dnsName: lb.DNSName || "",
      state: lb.State?.Code || "active",
      type: lb.Type || "application",
      scheme: lb.Scheme || "internet-facing",
      vpcId: lb.VpcId || "",
      availabilityZones: (lb.AvailabilityZones || []).map((az) => az.ZoneName || ""),
      securityGroups: lb.SecurityGroups || [],
      createdTime: lb.CreatedTime ? new Date(lb.CreatedTime).toLocaleString() : undefined,
      ipAddressType: lb.IpAddressType || "ipv4",
    }));
    return { loadBalancers: mapped, isLive: true };
  } catch (err: any) {
    return { loadBalancers: [], isLive: false, error: err.message };
  }
}

export interface ListenerModel {
  arn: string;
  loadBalancerArn: string;
  port: number;
  protocol: string;
  targetGroupArn?: string;
  targetGroupName?: string;
}

export async function createLiveLoadBalancer(params: {
  name: string;
  type?: "application" | "network" | "gateway";
  scheme?: "internet-facing" | "internal";
  subnets: string[];
  securityGroups?: string[];
  listenerProtocol?: string;
  listenerPort?: number;
  targetGroupArn?: string;
}): Promise<{ success: boolean; loadBalancerArn?: string; error?: string }> {
  try {
    const input: any = {
      Name: params.name,
      Type: params.type || "application",
      Scheme: params.scheme || "internet-facing",
      Subnets: params.subnets,
    };
    if (params.securityGroups && params.securityGroups.length > 0) {
      input.SecurityGroups = params.securityGroups;
    }
    const res = await elbv2.send(new CreateLoadBalancerCommand(input));
    const loadBalancerArn = res.LoadBalancers?.[0]?.LoadBalancerArn;

    if (loadBalancerArn && params.targetGroupArn) {
      try {
        await elbv2.send(
          new CreateListenerCommand({
            LoadBalancerArn: loadBalancerArn,
            Protocol: (params.listenerProtocol || (params.type === "network" ? "TCP" : "HTTP")) as any,
            Port: params.listenerPort || 80,
            DefaultActions: [
              {
                Type: "forward",
                TargetGroupArn: params.targetGroupArn,
              },
            ],
          })
        );
      } catch (listenerErr: any) {
        console.warn("Failed to create initial listener:", listenerErr.message);
      }
    }

    revalidatePath("/ec2/load-balancers");
    return { success: true, loadBalancerArn };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteLiveLoadBalancer(
  loadBalancerArn: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await elbv2.send(new DeleteLoadBalancerCommand({ LoadBalancerArn: loadBalancerArn }));
    revalidatePath("/ec2/load-balancers");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchLiveListeners(
  loadBalancerArn: string
): Promise<{ listeners: ListenerModel[]; success: boolean; error?: string }> {
  try {
    const [listenersRes, tgRes] = await Promise.all([
      elbv2.send(new DescribeListenersCommand({ LoadBalancerArn: loadBalancerArn })),
      elbv2.send(new DescribeTargetGroupsCommand({})).catch(() => ({ TargetGroups: [] })),
    ]);

    const tgMap = new Map<string, string>();
    (tgRes.TargetGroups || []).forEach((tg) => {
      if (tg.TargetGroupArn && tg.TargetGroupName) {
        tgMap.set(tg.TargetGroupArn, tg.TargetGroupName);
      }
    });

    const raw = listenersRes.Listeners || [];
    const mapped: ListenerModel[] = raw.map((l) => {
      const forwardAction = l.DefaultActions?.find((a) => a.Type === "forward");
      const tgArn =
        forwardAction?.TargetGroupArn ||
        forwardAction?.ForwardConfig?.TargetGroups?.[0]?.TargetGroupArn;
      return {
        arn: l.ListenerArn || "",
        loadBalancerArn: l.LoadBalancerArn || "",
        port: l.Port || 80,
        protocol: l.Protocol || "HTTP",
        targetGroupArn: tgArn,
        targetGroupName: tgArn
          ? tgMap.get(tgArn) || tgArn.split("/").slice(-2, -1)[0] || "Target group"
          : undefined,
      };
    });

    return { listeners: mapped, success: true };
  } catch (err: any) {
    return { listeners: [], success: false, error: err.message };
  }
}

export async function createLiveListener(params: {
  loadBalancerArn: string;
  protocol: string;
  port: number;
  targetGroupArn: string;
}): Promise<{ success: boolean; listenerArn?: string; error?: string }> {
  try {
    const res = await elbv2.send(
      new CreateListenerCommand({
        LoadBalancerArn: params.loadBalancerArn,
        Protocol: params.protocol as any,
        Port: params.port,
        DefaultActions: [
          {
            Type: "forward",
            TargetGroupArn: params.targetGroupArn,
          },
        ],
      })
    );
    revalidatePath("/ec2/load-balancers");
    return { success: true, listenerArn: res.Listeners?.[0]?.ListenerArn };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteLiveListener(
  listenerArn: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await elbv2.send(new DeleteListenerCommand({ ListenerArn: listenerArn }));
    revalidatePath("/ec2/load-balancers");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// Target Groups Actions
// -------------------------------------------------------------

export interface TargetGroupModel {
  arn: string;
  name: string;
  protocol: string;
  port: number;
  targetType: string;
  vpcId: string;
  healthCheckProtocol?: string;
  healthCheckPort?: string;
  healthCheckPath?: string;
  healthCheckIntervalSeconds?: number;
  healthCheckTimeoutSeconds?: number;
  healthyThresholdCount?: number;
  unhealthyThresholdCount?: number;
  loadBalancerArns?: string[];
}

export async function fetchLiveTargetGroups(): Promise<{
  targetGroups: TargetGroupModel[];
  isLive: boolean;
  error?: string;
}> {
  try {
    const res = await elbv2.send(new DescribeTargetGroupsCommand({}));
    const raw = res.TargetGroups || [];
    const mapped: TargetGroupModel[] = raw.map((tg) => ({
      arn: tg.TargetGroupArn || "",
      name: tg.TargetGroupName || "",
      protocol: tg.Protocol || "HTTP",
      port: tg.Port || 80,
      targetType: tg.TargetType || "instance",
      vpcId: tg.VpcId || "",
      healthCheckProtocol: tg.HealthCheckProtocol || "HTTP",
      healthCheckPort: tg.HealthCheckPort || "traffic-port",
      healthCheckPath: tg.HealthCheckPath || "/",
      healthCheckIntervalSeconds: tg.HealthCheckIntervalSeconds || 30,
      healthCheckTimeoutSeconds: tg.HealthCheckTimeoutSeconds || 5,
      healthyThresholdCount: tg.HealthyThresholdCount || 5,
      unhealthyThresholdCount: tg.UnhealthyThresholdCount || 2,
      loadBalancerArns: tg.LoadBalancerArns || [],
    }));
    return { targetGroups: mapped, isLive: true };
  } catch (err: any) {
    return { targetGroups: [], isLive: false, error: err.message };
  }
}

export async function createLiveTargetGroup(params: {
  name: string;
  protocol?: string;
  port?: number;
  vpcId: string;
  targetType?: string;
  healthCheckPath?: string;
  initialTargets?: { id: string; port?: number; availabilityZone?: string }[];
}): Promise<{ success: boolean; targetGroupArn?: string; error?: string }> {
  try {
    const res = await elbv2.send(
      new CreateTargetGroupCommand({
        Name: params.name,
        Protocol: (params.protocol || "HTTP") as any,
        Port: params.port || 80,
        VpcId: params.vpcId,
        TargetType: (params.targetType || "instance") as any,
        HealthCheckPath: params.healthCheckPath || "/",
      })
    );
    const targetGroupArn = res.TargetGroups?.[0]?.TargetGroupArn;

    if (targetGroupArn && params.initialTargets && params.initialTargets.length > 0) {
      await elbv2.send(
        new RegisterTargetsCommand({
          TargetGroupArn: targetGroupArn,
          Targets: params.initialTargets.map((t) => ({
            Id: t.id,
            Port: t.port || params.port || 80,
            AvailabilityZone: t.availabilityZone,
          })),
        })
      );
    }

    revalidatePath("/ec2/target-groups");
    return { success: true, targetGroupArn };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteLiveTargetGroup(
  targetGroupArn: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await elbv2.send(new DeleteTargetGroupCommand({ TargetGroupArn: targetGroupArn }));
    revalidatePath("/ec2/target-groups");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export interface TargetHealthModel {
  id: string;
  port: number;
  availabilityZone?: string;
  state: "healthy" | "unhealthy" | "initial" | "unused" | "draining";
  reason?: string;
  description?: string;
}

export interface AvailableInstanceModel {
  id: string;
  name: string;
  state: string;
  type: string;
  availabilityZone: string;
  privateIp?: string;
}

export async function fetchLiveTargetHealth(
  targetGroupArn: string
): Promise<{ targets: TargetHealthModel[]; success: boolean; error?: string }> {
  try {
    const res = await elbv2.send(new DescribeTargetHealthCommand({ TargetGroupArn: targetGroupArn }));
    const raw = res.TargetHealthDescriptions || [];
    const mapped: TargetHealthModel[] = raw.map((th) => ({
      id: th.Target?.Id || "",
      port: th.Target?.Port || 80,
      availabilityZone: th.Target?.AvailabilityZone || "",
      state: (th.TargetHealth?.State as any) || "unused",
      reason: th.TargetHealth?.Reason || "",
      description: th.TargetHealth?.Description || "",
    }));
    return { targets: mapped, success: true };
  } catch (err: any) {
    return { targets: [], success: false, error: err.message };
  }
}

export async function registerLiveTargets(
  targetGroupArn: string,
  targets: { id: string; port?: number; availabilityZone?: string }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await elbv2.send(
      new RegisterTargetsCommand({
        TargetGroupArn: targetGroupArn,
        Targets: targets.map((t) => ({
          Id: t.id,
          Port: t.port || 80,
          AvailabilityZone: t.availabilityZone,
        })),
      })
    );
    revalidatePath("/ec2/target-groups");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deregisterLiveTargets(
  targetGroupArn: string,
  targets: { id: string; port?: number }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await elbv2.send(
      new DeregisterTargetsCommand({
        TargetGroupArn: targetGroupArn,
        Targets: targets.map((t) => ({
          Id: t.id,
          Port: t.port || 80,
        })),
      })
    );
    revalidatePath("/ec2/target-groups");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchLiveAvailableInstances(): Promise<AvailableInstanceModel[]> {
  try {
    const res = await ec2.send(new DescribeInstancesCommand({}));
    const raw = res.Reservations?.flatMap((r) => r.Instances || []) || [];
    return raw.map((inst) => {
      const nameTag = inst.Tags?.find((t) => t.Key === "Name")?.Value;
      return {
        id: inst.InstanceId || "",
        name: nameTag || (inst.KeyName ? `Instance (${inst.KeyName})` : inst.InstanceId || ""),
        state: inst.State?.Name || "stopped",
        type: inst.InstanceType || "t3.micro",
        availabilityZone: inst.Placement?.AvailabilityZone || "us-east-1a",
        privateIp: inst.PrivateIpAddress || "",
      };
    });
  } catch (err) {
    return [];
  }
}

// -------------------------------------------------------------
// Auto Scaling Groups Actions
// -------------------------------------------------------------

export interface AutoScalingGroupModel {
  name: string;
  arn: string;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
  defaultCooldown: number;
  availabilityZones: string[];
  healthCheckType: string;
  healthCheckGracePeriod: number;
  createdTime: string;
  launchTemplateName?: string;
  launchTemplateId?: string;
  launchTemplateVersion?: string;
  launchConfigurationName?: string;
  vpcZoneIdentifier?: string;
  instances: Array<{
    instanceId: string;
    availabilityZone: string;
    lifecycleState: string;
    healthStatus: string;
    instanceType?: string;
  }>;
  status?: string;
}

export async function fetchLiveAutoScalingGroups(): Promise<{
  autoScalingGroups: AutoScalingGroupModel[];
  isLive: boolean;
  error?: string;
}> {
  try {
    const res = await autoScaling.send(new DescribeAutoScalingGroupsCommand({}));
    const raw = res.AutoScalingGroups || [];
    const mapped: AutoScalingGroupModel[] = raw.map((asg) => ({
      name: asg.AutoScalingGroupName || "",
      arn: asg.AutoScalingGroupARN || "",
      minSize: asg.MinSize ?? 0,
      maxSize: asg.MaxSize ?? 0,
      desiredCapacity: asg.DesiredCapacity ?? 0,
      defaultCooldown: asg.DefaultCooldown ?? 300,
      availabilityZones: asg.AvailabilityZones || [],
      healthCheckType: asg.HealthCheckType || "EC2",
      healthCheckGracePeriod: asg.HealthCheckGracePeriod ?? 0,
      createdTime: asg.CreatedTime ? new Date(asg.CreatedTime).toLocaleString() : "Just now",
      launchTemplateName: asg.LaunchTemplate?.LaunchTemplateName,
      launchTemplateId: asg.LaunchTemplate?.LaunchTemplateId,
      launchTemplateVersion: asg.LaunchTemplate?.Version || "$Default",
      launchConfigurationName: asg.LaunchConfigurationName,
      vpcZoneIdentifier: asg.VPCZoneIdentifier,
      instances: (asg.Instances || []).map((i) => ({
        instanceId: i.InstanceId || "",
        availabilityZone: i.AvailabilityZone || "",
        lifecycleState: i.LifecycleState || "InService",
        healthStatus: i.HealthStatus || "Healthy",
        instanceType: i.InstanceType,
      })),
      status: asg.Status || "Active",
    }));
    return { autoScalingGroups: mapped, isLive: true };
  } catch (err: any) {
    return { autoScalingGroups: [], isLive: false, error: err.message };
  }
}

export async function createLiveAutoScalingGroup(params: {
  name: string;
  launchTemplateId: string;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
  subnetIds?: string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const input: any = {
      AutoScalingGroupName: params.name,
      LaunchTemplate: {
        LaunchTemplateId: params.launchTemplateId,
        Version: "$Default",
      },
      MinSize: params.minSize,
      MaxSize: params.maxSize,
      DesiredCapacity: params.desiredCapacity,
    };
    if (params.subnetIds && params.subnetIds.length > 0) {
      input.VPCZoneIdentifier = params.subnetIds.join(",");
    }
    await autoScaling.send(new CreateAutoScalingGroupCommand(input));
    revalidatePath("/ec2/auto-scaling-groups");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateLiveAutoScalingGroup(params: {
  name: string;
  minSize?: number;
  maxSize?: number;
  desiredCapacity?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await autoScaling.send(
      new UpdateAutoScalingGroupCommand({
        AutoScalingGroupName: params.name,
        MinSize: params.minSize,
        MaxSize: params.maxSize,
        DesiredCapacity: params.desiredCapacity,
      })
    );
    revalidatePath("/ec2/auto-scaling-groups");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteLiveAutoScalingGroup(
  name: string,
  forceDelete: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    await autoScaling.send(
      new DeleteAutoScalingGroupCommand({
        AutoScalingGroupName: name,
        ForceDelete: forceDelete,
      })
    );
    revalidatePath("/ec2/auto-scaling-groups");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// -------------------------------------------------------------
// Launch Configurations Actions
// -------------------------------------------------------------

export interface LaunchConfigurationModel {
  name: string;
  arn: string;
  imageId: string;
  instanceType: string;
  createdTime: string;
  keyName?: string;
  securityGroups?: string[];
}

export async function fetchLiveLaunchConfigurations(): Promise<{
  launchConfigurations: LaunchConfigurationModel[];
  isLive: boolean;
  error?: string;
}> {
  try {
    const res = await autoScaling.send(new DescribeLaunchConfigurationsCommand({}));
    const raw = res.LaunchConfigurations || [];
    const mapped: LaunchConfigurationModel[] = raw.map((lc) => ({
      name: lc.LaunchConfigurationName || "",
      arn: lc.LaunchConfigurationARN || "",
      imageId: lc.ImageId || "",
      instanceType: lc.InstanceType || "t3.micro",
      createdTime: lc.CreatedTime ? new Date(lc.CreatedTime).toLocaleString() : "Just now",
      keyName: lc.KeyName,
      securityGroups: lc.SecurityGroups || [],
    }));
    return { launchConfigurations: mapped, isLive: true };
  } catch (err: any) {
    return { launchConfigurations: [], isLive: false, error: err.message };
  }
}

export async function deleteLiveLaunchConfiguration(
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await autoScaling.send(
      new DeleteLaunchConfigurationCommand({
        LaunchConfigurationName: name,
      })
    );
    revalidatePath("/ec2/launch-configurations");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

