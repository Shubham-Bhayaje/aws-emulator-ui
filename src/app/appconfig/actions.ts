"use server";

import {
  ListApplicationsCommand,
  GetApplicationCommand,
  CreateApplicationCommand,
  UpdateApplicationCommand,
  DeleteApplicationCommand,
  ListEnvironmentsCommand,
  GetEnvironmentCommand,
  CreateEnvironmentCommand,
  UpdateEnvironmentCommand,
  DeleteEnvironmentCommand,
  ListConfigurationProfilesCommand,
  GetConfigurationProfileCommand,
  CreateConfigurationProfileCommand,
  UpdateConfigurationProfileCommand,
  DeleteConfigurationProfileCommand,
  ListHostedConfigurationVersionsCommand,
  GetHostedConfigurationVersionCommand,
  CreateHostedConfigurationVersionCommand,
  DeleteHostedConfigurationVersionCommand,
  ListDeploymentStrategiesCommand,
  GetDeploymentStrategyCommand,
  CreateDeploymentStrategyCommand,
  DeleteDeploymentStrategyCommand,
  ListDeploymentsCommand,
  GetDeploymentCommand,
  StartDeploymentCommand,
  StopDeploymentCommand,
  GrowthType,
  ReplicateTo,
  ValidatorType,
} from "@aws-sdk/client-appconfig";
import {
  StartConfigurationSessionCommand,
  GetLatestConfigurationCommand,
} from "@aws-sdk/client-appconfigdata";
import { DescribeParametersCommand } from "@aws-sdk/client-ssm";
import { ListSecretsCommand } from "@aws-sdk/client-secrets-manager";
import { ListBucketsCommand } from "@aws-sdk/client-s3";
import { ListKeysCommand, DescribeKeyCommand } from "@aws-sdk/client-kms";
import { ListRolesCommand } from "@aws-sdk/client-iam";
import { appconfig, appconfigData, ssm, secretsManager, s3, kms, iam } from "@/lib/aws";
import { revalidatePath } from "next/cache";

// -------------------------------------------------------------
// Application Actions
// -------------------------------------------------------------

export async function listApplicationsAction() {
  try {
    const res = await appconfig.send(new ListApplicationsCommand({ MaxResults: 50 }));
    return {
      success: true,
      items: (res.Items || []).map((app) => ({
        id: app.Id || "",
        name: app.Name || "",
        description: app.Description || "",
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to list applications" };
  }
}

export async function getApplicationAction(applicationId: string) {
  try {
    const res = await appconfig.send(new GetApplicationCommand({ ApplicationId: applicationId }));
    return {
      success: true,
      application: {
        id: res.Id || "",
        name: res.Name || "",
        description: res.Description || "",
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get application" };
  }
}

export async function createApplicationAction(name: string, description?: string, tags?: Record<string, string>) {
  try {
    const res = await appconfig.send(
      new CreateApplicationCommand({
        Name: name,
        Description: description || undefined,
        Tags: tags || undefined,
      })
    );
    revalidatePath("/appconfig/applications");
    return {
      success: true,
      application: {
        id: res.Id || "",
        name: res.Name || "",
        description: res.Description || "",
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create application" };
  }
}

export async function updateApplicationAction(applicationId: string, name?: string, description?: string) {
  try {
    const res = await appconfig.send(
      new UpdateApplicationCommand({
        ApplicationId: applicationId,
        Name: name || undefined,
        Description: description !== undefined ? description : undefined,
      })
    );
    revalidatePath(`/appconfig/applications/${applicationId}`);
    return {
      success: true,
      application: {
        id: res.Id || "",
        name: res.Name || "",
        description: res.Description || "",
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update application" };
  }
}

export async function deleteApplicationAction(applicationId: string) {
  try {
    await appconfig.send(new DeleteApplicationCommand({ ApplicationId: applicationId }));
    revalidatePath("/appconfig/applications");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete application" };
  }
}

// -------------------------------------------------------------
// Environment Actions
// -------------------------------------------------------------

export async function listEnvironmentsAction(applicationId: string) {
  try {
    const res = await appconfig.send(new ListEnvironmentsCommand({ ApplicationId: applicationId, MaxResults: 50 }));
    return {
      success: true,
      items: (res.Items || []).map((env) => ({
        id: env.Id || "",
        applicationId: env.ApplicationId || "",
        name: env.Name || "",
        description: env.Description || "",
        state: env.State || "ReadyForDeployment",
        monitors: (env.Monitors || []).map((m) => ({
          alarmArn: m.AlarmArn || "",
          alarmRoleArn: m.AlarmRoleArn || "",
        })),
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to list environments" };
  }
}

export async function getEnvironmentAction(applicationId: string, environmentId: string) {
  try {
    const res = await appconfig.send(
      new GetEnvironmentCommand({
        ApplicationId: applicationId,
        EnvironmentId: environmentId,
      })
    );
    return {
      success: true,
      environment: {
        id: res.Id || "",
        applicationId: res.ApplicationId || "",
        name: res.Name || "",
        description: res.Description || "",
        state: res.State || "ReadyForDeployment",
        monitors: (res.Monitors || []).map((m) => ({
          alarmArn: m.AlarmArn || "",
          alarmRoleArn: m.AlarmRoleArn || "",
        })),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get environment" };
  }
}

export async function createEnvironmentAction(
  applicationId: string,
  name: string,
  description?: string,
  monitors?: Array<{ alarmArn: string; alarmRoleArn?: string }>,
  tags?: Record<string, string>
) {
  try {
    const res = await appconfig.send(
      new CreateEnvironmentCommand({
        ApplicationId: applicationId,
        Name: name,
        Description: description || undefined,
        Monitors: monitors && monitors.length > 0
          ? monitors.map((m) => ({
              AlarmArn: m.alarmArn,
              AlarmRoleArn: m.alarmRoleArn || undefined,
            }))
          : undefined,
        Tags: tags || undefined,
      })
    );
    revalidatePath(`/appconfig/applications/${applicationId}`);
    return {
      success: true,
      environment: {
        id: res.Id || "",
        applicationId: res.ApplicationId || "",
        name: res.Name || "",
        description: res.Description || "",
        state: res.State || "ReadyForDeployment",
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create environment" };
  }
}

export async function updateEnvironmentAction(
  applicationId: string,
  environmentId: string,
  name?: string,
  description?: string
) {
  try {
    const res = await appconfig.send(
      new UpdateEnvironmentCommand({
        ApplicationId: applicationId,
        EnvironmentId: environmentId,
        Name: name || undefined,
        Description: description !== undefined ? description : undefined,
      })
    );
    revalidatePath(`/appconfig/applications/${applicationId}/environments/${environmentId}`);
    return {
      success: true,
      environment: {
        id: res.Id || "",
        applicationId: res.ApplicationId || "",
        name: res.Name || "",
        description: res.Description || "",
        state: res.State || "ReadyForDeployment",
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update environment" };
  }
}

export async function deleteEnvironmentAction(applicationId: string, environmentId: string) {
  try {
    await appconfig.send(
      new DeleteEnvironmentCommand({
        ApplicationId: applicationId,
        EnvironmentId: environmentId,
      })
    );
    revalidatePath(`/appconfig/applications/${applicationId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete environment" };
  }
}

// -------------------------------------------------------------
// Configuration Profile Actions
// -------------------------------------------------------------

export async function listConfigurationProfilesAction(applicationId: string) {
  try {
    const res = await appconfig.send(
      new ListConfigurationProfilesCommand({
        ApplicationId: applicationId,
        MaxResults: 50,
      })
    );
    return {
      success: true,
      items: (res.Items || []).map((prof) => ({
        id: prof.Id || "",
        applicationId: prof.ApplicationId || "",
        name: prof.Name || "",
        locationUri: prof.LocationUri || "",
        type: prof.Type || "AWS.Freeform",
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to list configuration profiles" };
  }
}

export async function getConfigurationProfileAction(applicationId: string, configurationProfileId: string) {
  try {
    const res = await appconfig.send(
      new GetConfigurationProfileCommand({
        ApplicationId: applicationId,
        ConfigurationProfileId: configurationProfileId,
      })
    );
    return {
      success: true,
      profile: {
        id: res.Id || "",
        applicationId: res.ApplicationId || "",
        name: res.Name || "",
        description: res.Description || "",
        locationUri: res.LocationUri || "",
        retrievalRoleArn: res.RetrievalRoleArn || "",
        type: res.Type || "AWS.Freeform",
        validators: (res.Validators || []).map((v) => ({
          type: v.Type || "JSON_SCHEMA",
          content: v.Content || "",
        })),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get configuration profile" };
  }
}

export async function createConfigurationProfileAction(
  applicationId: string,
  name: string,
  locationUri: string,
  type?: string,
  description?: string,
  retrievalRoleArn?: string,
  validators?: Array<{ type: string; content: string }>,
  tags?: Record<string, string>
) {
  try {
    const res = await appconfig.send(
      new CreateConfigurationProfileCommand({
        ApplicationId: applicationId,
        Name: name,
        LocationUri: locationUri,
        Type: type || undefined,
        Description: description || undefined,
        RetrievalRoleArn: retrievalRoleArn || undefined,
        Validators: validators && validators.length > 0
          ? validators.map((v) => ({
              Type: v.type as ValidatorType,
              Content: v.content,
            }))
          : undefined,
        Tags: tags || undefined,
      })
    );
    revalidatePath(`/appconfig/applications/${applicationId}`);
    return {
      success: true,
      profile: {
        id: res.Id || "",
        applicationId: res.ApplicationId || "",
        name: res.Name || "",
        description: res.Description || "",
        locationUri: res.LocationUri || "",
        type: res.Type || "AWS.Freeform",
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create configuration profile" };
  }
}

export async function updateConfigurationProfileAction(
  applicationId: string,
  configurationProfileId: string,
  name?: string,
  description?: string,
  retrievalRoleArn?: string,
  validators?: Array<{ type: string; content: string }>
) {
  try {
    const res = await appconfig.send(
      new UpdateConfigurationProfileCommand({
        ApplicationId: applicationId,
        ConfigurationProfileId: configurationProfileId,
        Name: name || undefined,
        Description: description !== undefined ? description : undefined,
        RetrievalRoleArn: retrievalRoleArn || undefined,
        Validators: validators && validators.length > 0
          ? validators.map((v) => ({
              Type: v.type as ValidatorType,
              Content: v.content,
            }))
          : undefined,
      })
    );
    revalidatePath(`/appconfig/applications/${applicationId}/configuration-profiles/${configurationProfileId}`);
    return {
      success: true,
      profile: {
        id: res.Id || "",
        applicationId: res.ApplicationId || "",
        name: res.Name || "",
        description: res.Description || "",
        locationUri: res.LocationUri || "",
        type: res.Type || "AWS.Freeform",
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update configuration profile" };
  }
}

export async function deleteConfigurationProfileAction(applicationId: string, configurationProfileId: string) {
  try {
    await appconfig.send(
      new DeleteConfigurationProfileCommand({
        ApplicationId: applicationId,
        ConfigurationProfileId: configurationProfileId,
      })
    );
    revalidatePath(`/appconfig/applications/${applicationId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete configuration profile" };
  }
}

// -------------------------------------------------------------
// Hosted Configuration Version Actions
// -------------------------------------------------------------

export async function listHostedConfigurationVersionsAction(
  applicationId: string,
  configurationProfileId: string
) {
  try {
    const res = await appconfig.send(
      new ListHostedConfigurationVersionsCommand({
        ApplicationId: applicationId,
        ConfigurationProfileId: configurationProfileId,
        MaxResults: 50,
      })
    );
    return {
      success: true,
      items: (res.Items || []).map((v) => ({
        applicationId: v.ApplicationId || "",
        configurationProfileId: v.ConfigurationProfileId || "",
        versionNumber: v.VersionNumber || 1,
        description: v.Description || "",
        contentType: v.ContentType || "application/json",
        versionLabel: v.VersionLabel || "",
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to list hosted configuration versions" };
  }
}

export async function getHostedConfigurationVersionAction(
  applicationId: string,
  configurationProfileId: string,
  versionNumber: number
) {
  try {
    const res = await appconfig.send(
      new GetHostedConfigurationVersionCommand({
        ApplicationId: applicationId,
        ConfigurationProfileId: configurationProfileId,
        VersionNumber: versionNumber,
      })
    );
    let contentString = "";
    if (res.Content) {
      contentString = Buffer.from(res.Content).toString("utf-8");
    }
    return {
      success: true,
      version: {
        applicationId: res.ApplicationId || "",
        configurationProfileId: res.ConfigurationProfileId || "",
        versionNumber: res.VersionNumber || versionNumber,
        description: res.Description || "",
        contentType: res.ContentType || "application/json",
        content: contentString,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get hosted configuration version" };
  }
}

export async function createHostedConfigurationVersionAction(
  applicationId: string,
  configurationProfileId: string,
  content: string,
  contentType: string,
  description?: string,
  latestVersionNumber?: number
) {
  try {
    const contentBuffer = Buffer.from(content, "utf-8");
    const res = await appconfig.send(
      new CreateHostedConfigurationVersionCommand({
        ApplicationId: applicationId,
        ConfigurationProfileId: configurationProfileId,
        Content: contentBuffer,
        ContentType: contentType,
        Description: description || undefined,
        LatestVersionNumber: latestVersionNumber || undefined,
      })
    );
    revalidatePath(`/appconfig/applications/${applicationId}/configuration-profiles/${configurationProfileId}`);
    return {
      success: true,
      version: {
        applicationId: res.ApplicationId || "",
        configurationProfileId: res.ConfigurationProfileId || "",
        versionNumber: res.VersionNumber || 1,
        description: res.Description || "",
        contentType: res.ContentType || "application/json",
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create hosted configuration version" };
  }
}

export async function deleteHostedConfigurationVersionAction(
  applicationId: string,
  configurationProfileId: string,
  versionNumber: number
) {
  try {
    await appconfig.send(
      new DeleteHostedConfigurationVersionCommand({
        ApplicationId: applicationId,
        ConfigurationProfileId: configurationProfileId,
        VersionNumber: versionNumber,
      })
    );
    revalidatePath(`/appconfig/applications/${applicationId}/configuration-profiles/${configurationProfileId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete hosted configuration version" };
  }
}

// -------------------------------------------------------------
// Deployment Strategy Actions
// -------------------------------------------------------------

export async function listDeploymentStrategiesAction() {
  try {
    const res = await appconfig.send(new ListDeploymentStrategiesCommand({ MaxResults: 50 }));
    return {
      success: true,
      items: (res.Items || []).map((s) => ({
        id: s.Id || "",
        name: s.Name || "",
        description: s.Description || "",
        deploymentDurationInMinutes: s.DeploymentDurationInMinutes || 0,
        growthType: (s.GrowthType as string) || "LINEAR",
        growthFactor: s.GrowthFactor || 0,
        finalBakeTimeInMinutes: s.FinalBakeTimeInMinutes || 0,
        replicateTo: (s.ReplicateTo as string) || "NONE",
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to list deployment strategies" };
  }
}

export async function getDeploymentStrategyAction(deploymentStrategyId: string) {
  try {
    const res = await appconfig.send(
      new GetDeploymentStrategyCommand({
        DeploymentStrategyId: deploymentStrategyId,
      })
    );
    return {
      success: true,
      strategy: {
        id: res.Id || "",
        name: res.Name || "",
        description: res.Description || "",
        deploymentDurationInMinutes: res.DeploymentDurationInMinutes || 0,
        growthType: (res.GrowthType as string) || "LINEAR",
        growthFactor: res.GrowthFactor || 0,
        finalBakeTimeInMinutes: res.FinalBakeTimeInMinutes || 0,
        replicateTo: (res.ReplicateTo as string) || "NONE",
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get deployment strategy" };
  }
}

export async function createDeploymentStrategyAction(
  name: string,
  deploymentDurationInMinutes: number,
  growthFactor: number,
  growthType: "LINEAR" | "EXPONENTIAL",
  finalBakeTimeInMinutes?: number,
  replicateTo?: "NONE" | "SSM_DOCUMENT",
  description?: string,
  tags?: Record<string, string>
) {
  try {
    const res = await appconfig.send(
      new CreateDeploymentStrategyCommand({
        Name: name,
        DeploymentDurationInMinutes: deploymentDurationInMinutes,
        GrowthFactor: growthFactor,
        GrowthType: growthType as GrowthType,
        FinalBakeTimeInMinutes: finalBakeTimeInMinutes || 0,
        ReplicateTo: (replicateTo as ReplicateTo) || "NONE",
        Description: description || undefined,
        Tags: tags || undefined,
      })
    );
    revalidatePath("/appconfig/deployment-strategies");
    return {
      success: true,
      strategy: {
        id: res.Id || "",
        name: res.Name || "",
        description: res.Description || "",
        deploymentDurationInMinutes: res.DeploymentDurationInMinutes || 0,
        growthType: (res.GrowthType as string) || "LINEAR",
        growthFactor: res.GrowthFactor || 0,
        finalBakeTimeInMinutes: res.FinalBakeTimeInMinutes || 0,
        replicateTo: (res.ReplicateTo as string) || "NONE",
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create deployment strategy" };
  }
}

export async function deleteDeploymentStrategyAction(deploymentStrategyId: string) {
  try {
    await appconfig.send(
      new DeleteDeploymentStrategyCommand({
        DeploymentStrategyId: deploymentStrategyId,
      })
    );
    revalidatePath("/appconfig/deployment-strategies");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete deployment strategy" };
  }
}

// -------------------------------------------------------------
// Deployment Actions
// -------------------------------------------------------------

export async function listDeploymentsAction(applicationId: string, environmentId: string) {
  try {
    const res = await appconfig.send(
      new ListDeploymentsCommand({
        ApplicationId: applicationId,
        EnvironmentId: environmentId,
        MaxResults: 50,
      })
    );
    return {
      success: true,
      items: (res.Items || []).map((d) => ({
        deploymentNumber: d.DeploymentNumber || 1,
        configurationName: d.ConfigurationName || "",
        configurationVersion: d.ConfigurationVersion || "1",
        deploymentDurationInMinutes: d.DeploymentDurationInMinutes || 0,
        growthType: (d.GrowthType as string) || "LINEAR",
        growthFactor: d.GrowthFactor || 0,
        finalBakeTimeInMinutes: d.FinalBakeTimeInMinutes || 0,
        state: d.State || "COMPLETE",
        percentageComplete: d.PercentageComplete || 100,
        startedAt: d.StartedAt ? new Date(d.StartedAt).toISOString() : new Date().toISOString(),
        completedAt: d.CompletedAt ? new Date(d.CompletedAt).toISOString() : undefined,
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to list deployments" };
  }
}

export async function getDeploymentAction(
  applicationId: string,
  environmentId: string,
  deploymentNumber: number
) {
  try {
    const res = await appconfig.send(
      new GetDeploymentCommand({
        ApplicationId: applicationId,
        EnvironmentId: environmentId,
        DeploymentNumber: deploymentNumber,
      })
    );
    return {
      success: true,
      deployment: {
        deploymentNumber: res.DeploymentNumber || deploymentNumber,
        configurationName: res.ConfigurationName || "",
        configurationVersion: res.ConfigurationVersion || "1",
        deploymentStrategyId: res.DeploymentStrategyId || "",
        deploymentDurationInMinutes: res.DeploymentDurationInMinutes || 0,
        growthType: (res.GrowthType as string) || "LINEAR",
        growthFactor: res.GrowthFactor || 0,
        finalBakeTimeInMinutes: res.FinalBakeTimeInMinutes || 0,
        state: res.State || "COMPLETE",
        percentageComplete: res.PercentageComplete || 100,
        startedAt: res.StartedAt ? new Date(res.StartedAt).toISOString() : new Date().toISOString(),
        completedAt: res.CompletedAt ? new Date(res.CompletedAt).toISOString() : undefined,
        description: res.Description || "",
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get deployment" };
  }
}

export async function startDeploymentAction(
  applicationId: string,
  environmentId: string,
  deploymentStrategyId: string,
  configurationProfileId: string,
  configurationVersion: string,
  description?: string,
  tags?: Record<string, string>
) {
  try {
    const res = await appconfig.send(
      new StartDeploymentCommand({
        ApplicationId: applicationId,
        EnvironmentId: environmentId,
        DeploymentStrategyId: deploymentStrategyId,
        ConfigurationProfileId: configurationProfileId,
        ConfigurationVersion: configurationVersion,
        Description: description || undefined,
        Tags: tags || undefined,
      })
    );
    revalidatePath(`/appconfig/applications/${applicationId}/environments/${environmentId}`);
    return {
      success: true,
      deployment: {
        deploymentNumber: res.DeploymentNumber || 1,
        configurationName: res.ConfigurationName || "",
        configurationVersion: res.ConfigurationVersion || configurationVersion,
        state: res.State || "DEPLOYING",
        percentageComplete: res.PercentageComplete || 0,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to start deployment" };
  }
}

export async function stopDeploymentAction(
  applicationId: string,
  environmentId: string,
  deploymentNumber: number
) {
  try {
    const res = await appconfig.send(
      new StopDeploymentCommand({
        ApplicationId: applicationId,
        EnvironmentId: environmentId,
        DeploymentNumber: deploymentNumber,
      })
    );
    revalidatePath(`/appconfig/applications/${applicationId}/environments/${environmentId}`);
    return {
      success: true,
      deployment: {
        deploymentNumber: res.DeploymentNumber || deploymentNumber,
        state: res.State || "ROLLED_BACK",
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to stop deployment" };
  }
}

// -------------------------------------------------------------
// AppConfigData Client Actions
// -------------------------------------------------------------

export async function testRetrieveConfigurationAction(
  applicationIdentifier: string,
  environmentIdentifier: string,
  configurationProfileIdentifier: string
) {
  try {
    // Step 1: Start configuration session
    const sessionRes = await appconfigData.send(
      new StartConfigurationSessionCommand({
        ApplicationIdentifier: applicationIdentifier,
        EnvironmentIdentifier: environmentIdentifier,
        ConfigurationProfileIdentifier: configurationProfileIdentifier,
        RequiredMinimumPollIntervalInSeconds: 15,
      })
    );
    const token = sessionRes.InitialConfigurationToken;
    if (!token) {
      return { success: false, error: "Failed to obtain InitialConfigurationToken from session" };
    }

    // Step 2: Get latest configuration using token
    const configRes = await appconfigData.send(
      new GetLatestConfigurationCommand({
        ConfigurationToken: token,
      })
    );

    let configText = "";
    if (configRes.Configuration) {
      configText = Buffer.from(configRes.Configuration).toString("utf-8");
    }

    return {
      success: true,
      nextToken: configRes.NextPollConfigurationToken || "",
      contentType: configRes.ContentType || "application/json",
      configuration: configText,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to retrieve configuration data" };
  }
}

// -------------------------------------------------------------
// Integration Backlog / Dependency Loaders
// -------------------------------------------------------------

export async function listSsmParametersForAppConfigAction() {
  try {
    const res = await ssm.send(new DescribeParametersCommand({ MaxResults: 50 }));
    return {
      success: true,
      parameters: (res.Parameters || []).map((p) => ({
        name: p.Name || "",
        type: p.Type || "String",
        arn: `arn:aws:ssm:us-east-1:000000000000:parameter/${(p.Name || "").replace(/^\//, "")}`,
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to list SSM parameters", parameters: [] };
  }
}

export async function listSecretsForAppConfigAction() {
  try {
    const res = await secretsManager.send(new ListSecretsCommand({ MaxResults: 50 }));
    return {
      success: true,
      secrets: (res.SecretList || []).map((s) => ({
        name: s.Name || "",
        arn: s.ARN || "",
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to list secrets", secrets: [] };
  }
}

export async function listBucketsForAppConfigAction() {
  try {
    const res = await s3.send(new ListBucketsCommand({}));
    return {
      success: true,
      buckets: (res.Buckets || []).map((b) => ({
        name: b.Name || "",
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to list S3 buckets", buckets: [] };
  }
}

export async function listKmsKeysForAppConfigAction() {
  try {
    const res = await kms.send(new ListKeysCommand({ Limit: 50 }));
    const keys = (res.Keys || []).map((k) => ({
      keyId: k.KeyId || "",
      keyArn: k.KeyArn || "",
    }));
    return { success: true, keys };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to list KMS keys", keys: [] };
  }
}

export async function listIamRolesForAppConfigAction() {
  try {
    const res = await iam.send(new ListRolesCommand({ MaxItems: 50 }));
    return {
      success: true,
      roles: (res.Roles || []).map((r) => ({
        roleName: r.RoleName || "",
        arn: r.Arn || "",
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to list IAM roles", roles: [] };
  }
}
