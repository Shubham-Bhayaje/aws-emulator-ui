"use server";

import { resourceGroupsTaggingApi, resourceGroups, s3 } from "@/lib/aws";
import {
  GetResourcesCommand,
  GetTagKeysCommand,
  GetTagValuesCommand,
  TagResourcesCommand,
  UntagResourcesCommand,
} from "@aws-sdk/client-resource-groups-tagging-api";
import {
  ListGroupsCommand,
  GetGroupCommand,
  GetGroupQueryCommand,
  ListGroupResourcesCommand,
  CreateGroupCommand,
  DeleteGroupCommand,
} from "@aws-sdk/client-resource-groups";
import { ListBucketsCommand } from "@aws-sdk/client-s3";
import {
  ResourceTagMapping,
  ResourceGroupItem,
  GroupResourceItem,
  SearchCriteria,
} from "./types";

/**
 * Parses ARN components into structured service, region, type, and friendly name.
 */
function parseArn(arn: string) {
  const parts = arn.split(":");
  const service = parts[2] || "";
  const region = parts[3] || "us-east-1";
  const rest = parts.slice(5).join(":");
  let type = `AWS::${service.toUpperCase()}::Resource`;
  let name = rest;

  if (service === "s3") {
    type = "AWS::S3::Bucket";
    name = parts[5] || arn;
  } else if (service === "ec2") {
    if (rest.startsWith("instance/")) {
      type = "AWS::EC2::Instance";
      name = rest.replace("instance/", "");
    } else if (rest.startsWith("volume/")) {
      type = "AWS::EC2::Volume";
      name = rest.replace("volume/", "");
    } else if (rest.startsWith("security-group/")) {
      type = "AWS::EC2::SecurityGroup";
      name = rest.replace("security-group/", "");
    }
  } else if (service === "lambda") {
    type = "AWS::Lambda::Function";
    name = rest.replace("function:", "");
  } else if (service === "dynamodb") {
    type = "AWS::DynamoDB::Table";
    name = rest.replace("table/", "");
  } else if (service === "kms") {
    type = "AWS::KMS::Key";
    name = rest.replace("key/", "");
  } else if (service === "sqs") {
    type = "AWS::SQS::Queue";
    name = rest;
  } else if (service === "sns") {
    type = "AWS::SNS::Topic";
    name = rest;
  } else if (service === "iam") {
    type = "AWS::IAM::Role";
    name = rest.replace("role/", "");
  } else if (service === "ram") {
    type = "AWS::RAM::ResourceShare";
    name = rest.replace("resource-share/", "");
  } else if (service === "resource-groups") {
    type = "AWS::ResourceGroups::Group";
    name = rest.replace("group/", "");
  }
  return { service, region, type, name: name || arn };
}

/**
 * Search tagged resources across regions and types using Resource Groups Tagging API
 */
export async function searchResources(criteria?: SearchCriteria): Promise<{
  success: boolean;
  data: ResourceTagMapping[];
  error?: string;
}> {
  try {
    const input: any = {};
    if (criteria?.resourceTypes && criteria.resourceTypes.length > 0 && !criteria.resourceTypes.includes("All")) {
      input.ResourceTypeFilters = criteria.resourceTypes;
    }
    if (criteria?.tagFilters && criteria.tagFilters.length > 0) {
      input.TagFilters = criteria.tagFilters
        .filter((tf) => tf.key.trim().length > 0)
        .map((tf) => ({
          Key: tf.key.trim(),
          Values: tf.value !== undefined && tf.value !== "" ? [tf.value] : undefined,
        }));
    }

    const res = await resourceGroupsTaggingApi.send(new GetResourcesCommand(input));
    const items: ResourceTagMapping[] = (res.ResourceTagMappingList || []).map((mapping) => {
      const arn = mapping.ResourceARN || "";
      const parsed = parseArn(arn);
      // If tag key "Name" is present, use it as friendly name
      const nameTag = (mapping.Tags || []).find((t) => t.Key?.toLowerCase() === "name");
      const friendlyName = nameTag?.Value || parsed.name;

      return {
        resourceArn: arn,
        resourceName: friendlyName,
        resourceType: parsed.type,
        region: parsed.region,
        service: parsed.service,
        tags: (mapping.Tags || []).map((t) => ({
          key: t.Key || "",
          value: t.Value || "",
        })),
      };
    });

    // Regional filter client-side if specific regions selected and not "All"
    let filtered = items;
    if (criteria?.regions && criteria.regions.length > 0 && !criteria.regions.includes("All")) {
      filtered = items.filter((item) => criteria.regions.includes(item.region));
    }

    return { success: true, data: filtered };
  } catch (err: any) {
    console.error("searchResources error:", err);
    return { success: false, data: [], error: err.message || "Failed to search tagged resources" };
  }
}

/**
 * Fetch all available Tag Keys
 */
export async function fetchTagKeys(): Promise<{
  success: boolean;
  data: string[];
  error?: string;
}> {
  try {
    const res = await resourceGroupsTaggingApi.send(new GetTagKeysCommand({}));
    return { success: true, data: res.TagKeys || [] };
  } catch (err: any) {
    console.error("fetchTagKeys error:", err);
    return { success: false, data: [], error: err.message || "Failed to fetch tag keys" };
  }
}

/**
 * Fetch all Tag Values for a given Key
 */
export async function fetchTagValues(key: string): Promise<{
  success: boolean;
  data: string[];
  error?: string;
}> {
  try {
    const res = await resourceGroupsTaggingApi.send(new GetTagValuesCommand({ Key: key }));
    return { success: true, data: res.TagValues || [] };
  } catch (err: any) {
    console.error("fetchTagValues error:", err);
    return { success: false, data: [], error: err.message || "Failed to fetch tag values" };
  }
}

/**
 * Apply or update tags on multiple resources
 */
export async function tagResourcesAction(
  resourceArns: string[],
  tags: { [key: string]: string }
): Promise<{
  success: boolean;
  failedMap?: { [key: string]: any };
  error?: string;
}> {
  try {
    const res = await resourceGroupsTaggingApi.send(
      new TagResourcesCommand({
        ResourceARNList: resourceArns,
        Tags: tags,
      })
    );
    const failed = res.FailedResourcesMap || {};
    const failedKeys = Object.keys(failed);
    if (failedKeys.length > 0) {
      return {
        success: false,
        failedMap: failed,
        error: `Failed to tag ${failedKeys.length} resource(s)`,
      };
    }
    return { success: true };
  } catch (err: any) {
    console.error("tagResourcesAction error:", err);
    return { success: false, error: err.message || "Failed to apply tags" };
  }
}

/**
 * Remove specified tag keys from multiple resources
 */
export async function untagResourcesAction(
  resourceArns: string[],
  tagKeys: string[]
): Promise<{
  success: boolean;
  failedMap?: { [key: string]: any };
  error?: string;
}> {
  try {
    const res = await resourceGroupsTaggingApi.send(
      new UntagResourcesCommand({
        ResourceARNList: resourceArns,
        TagKeys: tagKeys,
      })
    );
    const failed = res.FailedResourcesMap || {};
    const failedKeys = Object.keys(failed);
    if (failedKeys.length > 0) {
      return {
        success: false,
        failedMap: failed,
        error: `Failed to untag ${failedKeys.length} resource(s)`,
      };
    }
    return { success: true };
  } catch (err: any) {
    console.error("untagResourcesAction error:", err);
    return { success: false, error: err.message || "Failed to remove tags" };
  }
}

/**
 * List all saved Resource Groups
 */
export async function fetchGroups(): Promise<{
  success: boolean;
  data: ResourceGroupItem[];
  error?: string;
}> {
  try {
    const res = await resourceGroups.send(new ListGroupsCommand({}));
    const groups: ResourceGroupItem[] = (res.Groups || []).map((g) => ({
      groupArn: g.GroupArn || "",
      name: g.Name || "",
      description: g.Description || "",
    }));
    return { success: true, data: groups };
  } catch (err: any) {
    console.error("fetchGroups error:", err);
    return { success: false, data: [], error: err.message || "Failed to fetch resource groups" };
  }
}

/**
 * Fetch detail of a single Resource Group including query and count
 */
export async function fetchGroupDetail(groupName: string): Promise<{
  success: boolean;
  data?: ResourceGroupItem;
  resources?: GroupResourceItem[];
  error?: string;
}> {
  try {
    const groupRes = await resourceGroups.send(new GetGroupCommand({ Group: groupName }));
    const group = groupRes.Group;
    if (!group) {
      return { success: false, error: "Group not found" };
    }

    let queryType = "TAG_FILTERS_1_0";
    let queryStr = "";
    try {
      const qRes = await resourceGroups.send(new GetGroupQueryCommand({ Group: groupName }));
      queryType = qRes.GroupQuery?.ResourceQuery?.Type || "TAG_FILTERS_1_0";
      queryStr = qRes.GroupQuery?.ResourceQuery?.Query || "";
    } catch {
      // Query command might return empty if no query set
    }

    let resources: GroupResourceItem[] = [];
    try {
      const rRes = await resourceGroups.send(new ListGroupResourcesCommand({ Group: groupName }));
      resources = (rRes.Resources || []).map((r) => {
        const arn = r.ResourceArn || "";
        const parsed = parseArn(arn);
        return {
          arn,
          name: parsed.name,
          type: parsed.type,
          region: parsed.region,
          status: r.ResourceStatus?.Value || "ACTIVE",
        };
      });
    } catch {
      // Group resources listing
    }

    return {
      success: true,
      data: {
        groupArn: group.GroupArn || "",
        name: group.Name || "",
        description: group.Description || "",
        queryType,
        query: queryStr,
        resourceCount: resources.length,
      },
      resources,
    };
  } catch (err: any) {
    console.error("fetchGroupDetail error:", err);
    return { success: false, error: err.message || "Failed to fetch group details" };
  }
}

/**
 * Create a new Resource Group
 */
export async function createGroupAction(formData: {
  name: string;
  description?: string;
  resourceTypes?: string[];
  tagFilters?: { key: string; values: string[] }[];
}): Promise<{
  success: boolean;
  groupArn?: string;
  error?: string;
}> {
  try {
    const queryObj: any = {
      ResourceTypeFilters:
        formData.resourceTypes && formData.resourceTypes.length > 0 && !formData.resourceTypes.includes("All")
          ? formData.resourceTypes
          : ["AWS::AllSupported"],
      TagFilters: (formData.tagFilters || []).map((tf) => ({
        Key: tf.key,
        Values: tf.values,
      })),
    };

    const res = await resourceGroups.send(
      new CreateGroupCommand({
        Name: formData.name.trim(),
        Description: formData.description?.trim(),
        ResourceQuery: {
          Type: "TAG_FILTERS_1_0",
          Query: JSON.stringify(queryObj),
        },
      })
    );
    return { success: true, groupArn: res.Group?.GroupArn };
  } catch (err: any) {
    console.error("createGroupAction error:", err);
    return { success: false, error: err.message || "Failed to create resource group" };
  }
}

/**
 * Delete a Resource Group
 */
export async function deleteGroupAction(groupName: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await resourceGroups.send(new DeleteGroupCommand({ Group: groupName }));
    return { success: true };
  } catch (err: any) {
    console.error("deleteGroupAction error:", err);
    return { success: false, error: err.message || "Failed to delete resource group" };
  }
}

/**
 * Fetch available S3 buckets for the compliance report selector
 */
export async function fetchAvailableBuckets(): Promise<{
  success: boolean;
  data: string[];
  error?: string;
}> {
  try {
    const res = await s3.send(new ListBucketsCommand({}));
    const buckets = (res.Buckets || []).map((b) => b.Name || "").filter(Boolean);
    return { success: true, data: buckets };
  } catch (err: any) {
    console.error("fetchAvailableBuckets error:", err);
    return { success: false, data: [] };
  }
}
