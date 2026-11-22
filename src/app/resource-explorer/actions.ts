"use server";

/**
 * src/app/resource-explorer/actions.ts
 * Server actions for AWS Resource Explorer (Resource Explorer 2) interacting directly with the
 * AWS Emulator (https://127.0.0.1:9297) via @aws-sdk/client-resource-explorer-2 in lib/aws.ts.
 */

import { resourceExplorer } from "@/lib/aws";
import {
  SearchCommand,
  ListViewsCommand,
  GetViewCommand,
  BatchGetViewCommand,
  CreateViewCommand,
  UpdateViewCommand,
  DeleteViewCommand,
  GetDefaultViewCommand,
  AssociateDefaultViewCommand,
  DisassociateDefaultViewCommand,
  GetIndexCommand,
  ListIndexesCommand,
  CreateIndexCommand,
  DeleteIndexCommand,
  UpdateIndexTypeCommand,
  IndexType,
} from "@aws-sdk/client-resource-explorer-2";

// -------------------------------------------------------------
// 1. DATA TYPES
// -------------------------------------------------------------

export interface ResourceItem {
  Arn: string;
  OwningAccountId?: string;
  Region?: string;
  ResourceType?: string;
  Service?: string;
  CfnResourceType?: string;
  LastReportedAt?: string;
  Properties?: {
    Data?: any;
    LastReportedAt?: string;
    Name?: string;
  }[];
}

export interface ViewItem {
  ViewArn: string;
  ViewName?: string;
  Owner?: string;
  LastUpdatedAt?: string;
  Scope?: string;
  IncludedProperties?: string[];
  Filters?: {
    FilterString?: string;
  };
  IsDefault?: boolean;
}

export interface IndexItem {
  Arn?: string;
  Region: string;
  Type?: "LOCAL" | "AGGREGATOR";
  State?: "CREATING" | "ACTIVE" | "UPDATING" | "DELETING" | "INACTIVE";
  LastUpdatedAt?: string;
  CreatedAt?: string;
}

// -------------------------------------------------------------
// 2. SEARCH ACTIONS
// -------------------------------------------------------------

export async function searchResourcesAction(
  queryString: string = "",
  viewArn?: string
): Promise<{
  success: boolean;
  resources: ResourceItem[];
  count?: number;
  complete?: boolean;
  viewArn?: string;
  error?: string;
}> {
  try {
    const res = await resourceExplorer.send(
      new SearchCommand({
        QueryString: queryString,
        ViewArn: viewArn && viewArn.trim() ? viewArn.trim() : undefined,
        MaxResults: 100,
      })
    );

    const resources: ResourceItem[] = (res.Resources || []).map((r) => ({
      Arn: r.Arn || "",
      OwningAccountId: r.OwningAccountId,
      Region: r.Region,
      ResourceType: r.ResourceType,
      Service: r.Service,
      CfnResourceType: r.CfnResourceType,
      LastReportedAt: r.LastReportedAt ? new Date(r.LastReportedAt).toISOString() : undefined,
      Properties: r.Properties?.map((p) => ({
        Data: p.Data,
        LastReportedAt: p.LastReportedAt ? new Date(p.LastReportedAt).toISOString() : undefined,
        Name: p.Name,
      })),
    }));

    return {
      success: true,
      resources,
      count: res.Count?.TotalResources ?? resources.length,
      complete: res.Count?.Complete ?? true,
      viewArn: res.ViewArn,
    };
  } catch (err: unknown) {
    return {
      success: false,
      resources: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// -------------------------------------------------------------
// 3. VIEWS ACTIONS
// -------------------------------------------------------------

export async function listViewsAction(): Promise<{
  success: boolean;
  views: ViewItem[];
  defaultViewArn?: string;
  error?: string;
}> {
  try {
    const [listRes, defaultRes] = await Promise.all([
      resourceExplorer.send(new ListViewsCommand({})),
      resourceExplorer.send(new GetDefaultViewCommand({})).catch(() => ({ ViewArn: undefined })),
    ]);

    const defaultViewArn = defaultRes?.ViewArn;
    const viewArns = listRes.Views || [];

    if (viewArns.length === 0) {
      return { success: true, views: [], defaultViewArn };
    }

    // Batch get details for all views
    const batchRes = await resourceExplorer.send(
      new BatchGetViewCommand({
        ViewArns: viewArns,
      })
    );

    const views: ViewItem[] = (batchRes.Views || []).map((v) => ({
      ViewArn: v.ViewArn || "",
      ViewName: v.ViewName,
      Owner: v.Owner,
      LastUpdatedAt: v.LastUpdatedAt ? new Date(v.LastUpdatedAt).toISOString() : undefined,
      Scope: v.Scope,
      IncludedProperties: v.IncludedProperties?.map((p) => p.Name || ""),
      Filters: {
        FilterString: v.Filters?.FilterString,
      },
      IsDefault: v.ViewArn === defaultViewArn,
    }));

    return { success: true, views, defaultViewArn };
  } catch (err: unknown) {
    return {
      success: false,
      views: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getViewAction(viewArn: string): Promise<{
  success: boolean;
  view?: ViewItem;
  error?: string;
}> {
  try {
    const [batchRes, defaultRes] = await Promise.all([
      resourceExplorer.send(new BatchGetViewCommand({ ViewArns: [viewArn] })),
      resourceExplorer.send(new GetDefaultViewCommand({})).catch(() => ({ ViewArn: undefined })),
    ]);

    const view = batchRes.Views?.[0];
    if (!view) {
      const err = batchRes.Errors?.[0]?.ErrorMessage || "View not found";
      return { success: false, error: err };
    }

    const isDefault = view.ViewArn === defaultRes?.ViewArn;

    return {
      success: true,
      view: {
        ViewArn: view.ViewArn || viewArn,
        ViewName: view.ViewName,
        Owner: view.Owner,
        LastUpdatedAt: view.LastUpdatedAt ? new Date(view.LastUpdatedAt).toISOString() : undefined,
        Scope: view.Scope,
        IncludedProperties: view.IncludedProperties?.map((p) => p.Name || ""),
        Filters: {
          FilterString: view.Filters?.FilterString,
        },
        IsDefault: isDefault,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createViewAction(data: {
  viewName: string;
  filterString?: string;
  includeTags?: boolean;
  isDefault?: boolean;
  tags?: Record<string, string>;
}): Promise<{ success: boolean; viewArn?: string; error?: string }> {
  try {
    const includedProperties = data.includeTags ? [{ Name: "tags" }] : undefined;
    const filters = data.filterString?.trim() ? { FilterString: data.filterString.trim() } : undefined;

    const res = await resourceExplorer.send(
      new CreateViewCommand({
        ViewName: data.viewName.trim(),
        Filters: filters,
        IncludedProperties: includedProperties,
        Tags: data.tags,
      })
    );

    const viewArn = res.View?.ViewArn;

    if (data.isDefault && viewArn) {
      await resourceExplorer.send(new AssociateDefaultViewCommand({ ViewArn: viewArn }));
    }

    return { success: true, viewArn };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function updateViewAction(data: {
  viewArn: string;
  filterString?: string;
  includeTags?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const includedProperties = data.includeTags ? [{ Name: "tags" }] : undefined;
    const filters = data.filterString !== undefined ? { FilterString: data.filterString.trim() } : undefined;

    await resourceExplorer.send(
      new UpdateViewCommand({
        ViewArn: data.viewArn,
        Filters: filters,
        IncludedProperties: includedProperties,
      })
    );

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteViewAction(viewArn: string): Promise<{ success: boolean; error?: string }> {
  try {
    await resourceExplorer.send(new DeleteViewCommand({ ViewArn: viewArn }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function associateDefaultViewAction(viewArn: string): Promise<{ success: boolean; error?: string }> {
  try {
    await resourceExplorer.send(new AssociateDefaultViewCommand({ ViewArn: viewArn }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function disassociateDefaultViewAction(): Promise<{ success: boolean; error?: string }> {
  try {
    await resourceExplorer.send(new DisassociateDefaultViewCommand({}));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// -------------------------------------------------------------
// 4. INDEXES & SETTINGS ACTIONS
// -------------------------------------------------------------

export async function getIndexAction(): Promise<{
  success: boolean;
  hasIndex: boolean;
  index?: IndexItem;
  error?: string;
}> {
  try {
    const res = await resourceExplorer.send(new GetIndexCommand({}));
    return {
      success: true,
      hasIndex: true,
      index: {
        Arn: res.Arn,
        Region: "us-east-1",
        Type: res.Type as "LOCAL" | "AGGREGATOR",
        State: res.State as any,
        CreatedAt: res.CreatedAt ? new Date(res.CreatedAt).toISOString() : undefined,
        LastUpdatedAt: res.LastUpdatedAt ? new Date(res.LastUpdatedAt).toISOString() : undefined,
      },
    };
  } catch (err: any) {
    // If not found, resource explorer is not turned on in this region
    if (err.name === "ResourceNotFoundException" || err.message?.includes("not found")) {
      return { success: true, hasIndex: false };
    }
    return {
      success: false,
      hasIndex: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function listIndexesAction(): Promise<{
  success: boolean;
  indexes: IndexItem[];
  error?: string;
}> {
  try {
    const res = await resourceExplorer.send(new ListIndexesCommand({}));
    const indexes: IndexItem[] = (res.Indexes || []).map((idx) => ({
      Arn: idx.Arn,
      Region: idx.Region || "us-east-1",
      Type: idx.Type as "LOCAL" | "AGGREGATOR",
    }));
    return { success: true, indexes };
  } catch (err: unknown) {
    return {
      success: false,
      indexes: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createIndexAction(): Promise<{
  success: boolean;
  arn?: string;
  error?: string;
}> {
  try {
    const res = await resourceExplorer.send(new CreateIndexCommand({}));
    return { success: true, arn: res.Arn };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteIndexAction(arn: string): Promise<{ success: boolean; error?: string }> {
  try {
    await resourceExplorer.send(new DeleteIndexCommand({ Arn: arn }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function updateIndexTypeAction(
  arn: string,
  type: "LOCAL" | "AGGREGATOR"
): Promise<{ success: boolean; error?: string }> {
  try {
    await resourceExplorer.send(
      new UpdateIndexTypeCommand({
        Arn: arn,
        Type: type as IndexType,
      })
    );
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function quickSetupAction(): Promise<{
  success: boolean;
  arn?: string;
  error?: string;
}> {
  try {
    // 1. Create index
    const createRes = await resourceExplorer.send(new CreateIndexCommand({}));
    const arn = createRes.Arn;

    // 2. Promote to AGGREGATOR
    if (arn) {
      try {
        await resourceExplorer.send(
          new UpdateIndexTypeCommand({
            Arn: arn,
            Type: "AGGREGATOR",
          })
        );
      } catch {
        // If still in creating state, ignore
      }
    }

    return { success: true, arn };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
