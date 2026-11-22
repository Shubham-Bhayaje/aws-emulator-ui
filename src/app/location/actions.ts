"use server";

/**
 * src/app/location/actions.ts
 * Server actions for Amazon Location Service interacting with the AWS Emulator (https://localhost:9297)
 * via @aws-sdk/client-location exported by lib/aws.ts.
 *
 * Handles:
 * - Maps (create, describe, list, delete)
 * - Trackers (create, describe, list, delete, batch update position, get device position, tracker consumers)
 * - Geofence Collections (create, describe, list, delete, put geofence, get geofence, list geofences)
 * - Route Calculators (create, describe, list, delete, calculate route)
 * - Place Indexes & API Keys (emulator status checks)
 */

import { location } from "@/lib/aws";
import {
  CreateMapCommand,
  DescribeMapCommand,
  ListMapsCommand,
  DeleteMapCommand,
  CreateTrackerCommand,
  DescribeTrackerCommand,
  ListTrackersCommand,
  DeleteTrackerCommand,
  BatchUpdateDevicePositionCommand,
  GetDevicePositionCommand,
  AssociateTrackerConsumerCommand,
  ListTrackerConsumersCommand,
  DisassociateTrackerConsumerCommand,
  CreateGeofenceCollectionCommand,
  DescribeGeofenceCollectionCommand,
  ListGeofenceCollectionsCommand,
  DeleteGeofenceCollectionCommand,
  PutGeofenceCommand,
  GetGeofenceCommand,
  ListGeofencesCommand,
  BatchDeleteGeofenceCommand,
  CreateRouteCalculatorCommand,
  DescribeRouteCalculatorCommand,
  ListRouteCalculatorsCommand,
  DeleteRouteCalculatorCommand,
  CalculateRouteCommand,
} from "@aws-sdk/client-location";
import fs from "fs/promises";
import path from "path";

// File-based registry for resources whose list commands are scaffolded/NotImplemented in the emulator
// This ensures that created maps, route calculators, and geofences are accurately tracked and described
// using live emulator Describe calls!
const REGISTRY_FILE = path.join(process.cwd(), ".location-registry.json");

interface LocationRegistry {
  maps: string[];
  routeCalculators: string[];
  devicesByTracker: Record<string, string[]>;
  geofencesByCollection: Record<string, string[]>;
}

async function getRegistry(): Promise<LocationRegistry> {
  try {
    const data = await fs.readFile(REGISTRY_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {
      maps: [],
      routeCalculators: [],
      devicesByTracker: {},
      geofencesByCollection: {},
    };
  }
}

async function saveRegistry(registry: LocationRegistry): Promise<void> {
  try {
    await fs.writeFile(REGISTRY_FILE, JSON.stringify(registry, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed to persist location registry:", err);
  }
}

// -------------------------------------------------------------
// 1. MAPS
// -------------------------------------------------------------

export interface MapSummary {
  MapName: string;
  Description?: string;
  DataSource?: string;
  Style?: string;
  PricingPlan?: string;
  CreateTime?: string;
  UpdateTime?: string;
  MapArn?: string;
}

export async function listMapsAction(): Promise<{ success: boolean; maps: MapSummary[]; error?: string }> {
  try {
    // First try live SDK ListMapsCommand
    try {
      const res = await location.send(new ListMapsCommand({}));
      if (res.Entries) {
        return {
          success: true,
          maps: res.Entries.map((e) => ({
            MapName: e.MapName || "",
            Description: e.Description,
            DataSource: e.DataSource,
            PricingPlan: e.PricingPlan,
            CreateTime: e.CreateTime ? new Date(e.CreateTime).toISOString() : undefined,
            UpdateTime: e.UpdateTime ? new Date(e.UpdateTime).toISOString() : undefined,
          })),
        };
      }
    } catch (listErr: unknown) {
      const msg = listErr instanceof Error ? listErr.message : String(listErr);
      if (!msg.includes("NotImplemented")) {
        throw listErr;
      }
    }

    // Fallback for emulator: Query known map names and run DescribeMapCommand on each against emulator
    const registry = await getRegistry();
    const maps: MapSummary[] = [];
    const validNames: string[] = [];

    for (const name of registry.maps) {
      try {
        const desc = await location.send(new DescribeMapCommand({ MapName: name }));
        validNames.push(name);
        maps.push({
          MapName: desc.MapName || name,
          Description: desc.Description,
          DataSource: desc.DataSource,
          Style: desc.Configuration?.Style,
          PricingPlan: desc.PricingPlan,
          CreateTime: desc.CreateTime ? new Date(desc.CreateTime).toISOString() : undefined,
          UpdateTime: desc.UpdateTime ? new Date(desc.UpdateTime).toISOString() : undefined,
          MapArn: desc.MapArn,
        });
      } catch {
        // Resource was deleted outside or not found
      }
    }

    if (validNames.length !== registry.maps.length) {
      registry.maps = validNames;
      await saveRegistry(registry);
    }

    return { success: true, maps };
  } catch (err: unknown) {
    return {
      success: false,
      maps: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createMapAction(data: {
  mapName: string;
  style: string;
  description?: string;
  tags?: Record<string, string>;
}): Promise<{ success: boolean; mapName?: string; mapArn?: string; error?: string }> {
  try {
    const res = await location.send(
      new CreateMapCommand({
        MapName: data.mapName,
        Configuration: {
          Style: data.style,
        },
        Description: data.description || "",
        Tags: data.tags,
      })
    );

    // Save map name to registry
    const registry = await getRegistry();
    if (!registry.maps.includes(data.mapName)) {
      registry.maps.push(data.mapName);
      await saveRegistry(registry);
    }

    return {
      success: true,
      mapName: res.MapName,
      mapArn: res.MapArn,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function describeMapAction(mapName: string): Promise<{ success: boolean; map?: MapSummary; error?: string }> {
  try {
    const desc = await location.send(new DescribeMapCommand({ MapName: mapName }));
    return {
      success: true,
      map: {
        MapName: desc.MapName || mapName,
        Description: desc.Description,
        DataSource: desc.DataSource,
        Style: desc.Configuration?.Style,
        PricingPlan: desc.PricingPlan,
        CreateTime: desc.CreateTime ? new Date(desc.CreateTime).toISOString() : undefined,
        UpdateTime: desc.UpdateTime ? new Date(desc.UpdateTime).toISOString() : undefined,
        MapArn: desc.MapArn,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteMapAction(mapName: string): Promise<{ success: boolean; error?: string }> {
  try {
    await location.send(new DeleteMapCommand({ MapName: mapName }));
    const registry = await getRegistry();
    registry.maps = registry.maps.filter((m) => m !== mapName);
    await saveRegistry(registry);
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// -------------------------------------------------------------
// 2. TRACKERS
// -------------------------------------------------------------

export interface TrackerSummary {
  TrackerName: string;
  Description?: string;
  PricingPlan?: string;
  CreateTime?: string;
  UpdateTime?: string;
  TrackerArn?: string;
  PositionFiltering?: string;
  EventBridgeEnabled?: boolean;
  KmsKeyId?: string;
}

export async function listTrackersAction(): Promise<{ success: boolean; trackers: TrackerSummary[]; error?: string }> {
  try {
    const res = await location.send(new ListTrackersCommand({}));
    const trackers: TrackerSummary[] = (res.Entries || []).map((e) => ({
      TrackerName: e.TrackerName || "",
      Description: e.Description,
      PricingPlan: e.PricingPlan,
      CreateTime: e.CreateTime ? new Date(e.CreateTime).toISOString() : undefined,
      UpdateTime: e.UpdateTime ? new Date(e.UpdateTime).toISOString() : undefined,
    }));
    return { success: true, trackers };
  } catch (err: unknown) {
    return {
      success: false,
      trackers: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createTrackerAction(data: {
  trackerName: string;
  description?: string;
  positionFiltering?: "TimeBased" | "DistanceBased" | "AccuracyBased";
  kmsKeyId?: string;
  tags?: Record<string, string>;
}): Promise<{ success: boolean; trackerName?: string; trackerArn?: string; error?: string }> {
  try {
    const res = await location.send(
      new CreateTrackerCommand({
        TrackerName: data.trackerName,
        Description: data.description || "",
        PositionFiltering: data.positionFiltering || "TimeBased",
        KmsKeyId: data.kmsKeyId || undefined,
        Tags: data.tags,
      })
    );
    return {
      success: true,
      trackerName: res.TrackerName,
      trackerArn: res.TrackerArn,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function describeTrackerAction(trackerName: string): Promise<{ success: boolean; tracker?: TrackerSummary; error?: string }> {
  try {
    const desc = await location.send(new DescribeTrackerCommand({ TrackerName: trackerName }));
    return {
      success: true,
      tracker: {
        TrackerName: desc.TrackerName || trackerName,
        TrackerArn: desc.TrackerArn,
        Description: desc.Description,
        PricingPlan: desc.PricingPlan,
        PositionFiltering: desc.PositionFiltering,
        EventBridgeEnabled: desc.EventBridgeEnabled,
        KmsKeyId: desc.KmsKeyId,
        CreateTime: desc.CreateTime ? new Date(desc.CreateTime).toISOString() : undefined,
        UpdateTime: desc.UpdateTime ? new Date(desc.UpdateTime).toISOString() : undefined,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteTrackerAction(trackerName: string): Promise<{ success: boolean; error?: string }> {
  try {
    await location.send(new DeleteTrackerCommand({ TrackerName: trackerName }));
    const registry = await getRegistry();
    delete registry.devicesByTracker[trackerName];
    await saveRegistry(registry);
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export interface DevicePosition {
  DeviceId: string;
  Position: [number, number];
  SampleTime: string;
  ReceivedTime?: string;
  Accuracy?: { Horizontal?: number };
  PositionProperties?: Record<string, string>;
}

export async function batchUpdateDevicePositionAction(
  trackerName: string,
  updates: {
    deviceId: string;
    position: [number, number]; // [Longitude, Latitude]
    sampleTime?: string;
    accuracyHorizontal?: number;
    positionProperties?: Record<string, string>;
  }[]
): Promise<{ success: boolean; errors?: { DeviceId?: string; Error?: { Code?: string; Message?: string } }[]; error?: string }> {
  try {
    const res = await location.send(
      new BatchUpdateDevicePositionCommand({
        TrackerName: trackerName,
        Updates: updates.map((u) => ({
          DeviceId: u.deviceId,
          Position: u.position,
          SampleTime: u.sampleTime ? new Date(u.sampleTime) : new Date(),
          Accuracy: u.accuracyHorizontal ? { Horizontal: u.accuracyHorizontal } : undefined,
          PositionProperties: u.positionProperties,
        })),
      })
    );

    // Track active device IDs in local registry
    const registry = await getRegistry();
    if (!registry.devicesByTracker[trackerName]) {
      registry.devicesByTracker[trackerName] = [];
    }
    for (const u of updates) {
      if (!registry.devicesByTracker[trackerName].includes(u.deviceId)) {
        registry.devicesByTracker[trackerName].push(u.deviceId);
      }
    }
    await saveRegistry(registry);

    return {
      success: true,
      errors: (res.Errors || []).map((e) => ({
        DeviceId: e.DeviceId,
        Error: {
          Code: e.Error?.Code,
          Message: e.Error?.Message,
        },
      })),
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getDevicePositionAction(
  trackerName: string,
  deviceId: string
): Promise<{ success: boolean; position?: DevicePosition; error?: string }> {
  try {
    const res = await location.send(
      new GetDevicePositionCommand({
        TrackerName: trackerName,
        DeviceId: deviceId,
      })
    );

    if (!res.Position || res.Position.length < 2) {
      return { success: false, error: "No position available for device." };
    }

    return {
      success: true,
      position: {
        DeviceId: res.DeviceId || deviceId,
        Position: [res.Position[0], res.Position[1]],
        SampleTime: res.SampleTime ? new Date(res.SampleTime).toISOString() : new Date().toISOString(),
        ReceivedTime: res.ReceivedTime ? new Date(res.ReceivedTime).toISOString() : undefined,
        Accuracy: res.Accuracy ? { Horizontal: res.Accuracy.Horizontal } : undefined,
        PositionProperties: res.PositionProperties,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function listTrackerDevicesAction(
  trackerName: string
): Promise<{ success: boolean; devices: DevicePosition[]; error?: string }> {
  try {
    const registry = await getRegistry();
    const deviceIds = registry.devicesByTracker[trackerName] || [];
    const devices: DevicePosition[] = [];

    for (const id of deviceIds) {
      try {
        const res = await location.send(
          new GetDevicePositionCommand({
            TrackerName: trackerName,
            DeviceId: id,
          })
        );
        if (res.Position && res.Position.length >= 2) {
          devices.push({
            DeviceId: res.DeviceId || id,
            Position: [res.Position[0], res.Position[1]],
            SampleTime: res.SampleTime ? new Date(res.SampleTime).toISOString() : new Date().toISOString(),
            ReceivedTime: res.ReceivedTime ? new Date(res.ReceivedTime).toISOString() : undefined,
            Accuracy: res.Accuracy ? { Horizontal: res.Accuracy.Horizontal } : undefined,
            PositionProperties: res.PositionProperties,
          });
        }
      } catch {
        // Device position might have expired or not found
      }
    }

    return { success: true, devices };
  } catch (err: unknown) {
    return {
      success: false,
      devices: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function listTrackerConsumersAction(
  trackerName: string
): Promise<{ success: boolean; consumerArns: string[]; error?: string }> {
  try {
    const res = await location.send(new ListTrackerConsumersCommand({ TrackerName: trackerName }));
    return {
      success: true,
      consumerArns: res.ConsumerArns || [],
    };
  } catch (err: unknown) {
    return {
      success: false,
      consumerArns: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function associateTrackerConsumerAction(
  trackerName: string,
  consumerArn: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await location.send(
      new AssociateTrackerConsumerCommand({
        TrackerName: trackerName,
        ConsumerArn: consumerArn,
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

export async function disassociateTrackerConsumerAction(
  trackerName: string,
  consumerArn: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await location.send(
      new DisassociateTrackerConsumerCommand({
        TrackerName: trackerName,
        ConsumerArn: consumerArn,
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

// -------------------------------------------------------------
// 3. GEOFENCE COLLECTIONS
// -------------------------------------------------------------

export interface GeofenceCollectionSummary {
  CollectionName: string;
  Description?: string;
  PricingPlan?: string;
  CreateTime?: string;
  UpdateTime?: string;
  CollectionArn?: string;
  KmsKeyId?: string;
  GeofenceCount?: number;
}

export async function listGeofenceCollectionsAction(): Promise<{
  success: boolean;
  collections: GeofenceCollectionSummary[];
  error?: string;
}> {
  try {
    const res = await location.send(new ListGeofenceCollectionsCommand({}));
    const collections: GeofenceCollectionSummary[] = (res.Entries || []).map((e) => ({
      CollectionName: e.CollectionName || "",
      Description: e.Description,
      PricingPlan: e.PricingPlan,
      CreateTime: e.CreateTime ? new Date(e.CreateTime).toISOString() : undefined,
      UpdateTime: e.UpdateTime ? new Date(e.UpdateTime).toISOString() : undefined,
    }));
    return { success: true, collections };
  } catch (err: unknown) {
    return {
      success: false,
      collections: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createGeofenceCollectionAction(data: {
  collectionName: string;
  description?: string;
  kmsKeyId?: string;
  tags?: Record<string, string>;
}): Promise<{ success: boolean; collectionName?: string; collectionArn?: string; error?: string }> {
  try {
    const res = await location.send(
      new CreateGeofenceCollectionCommand({
        CollectionName: data.collectionName,
        Description: data.description || "",
        KmsKeyId: data.kmsKeyId || undefined,
        Tags: data.tags,
      })
    );
    return {
      success: true,
      collectionName: res.CollectionName,
      collectionArn: res.CollectionArn,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function describeGeofenceCollectionAction(
  collectionName: string
): Promise<{ success: boolean; collection?: GeofenceCollectionSummary; error?: string }> {
  try {
    const desc = await location.send(new DescribeGeofenceCollectionCommand({ CollectionName: collectionName }));
    return {
      success: true,
      collection: {
        CollectionName: desc.CollectionName || collectionName,
        CollectionArn: desc.CollectionArn,
        Description: desc.Description,
        PricingPlan: desc.PricingPlan,
        KmsKeyId: desc.KmsKeyId,
        GeofenceCount: desc.GeofenceCount || 0,
        CreateTime: desc.CreateTime ? new Date(desc.CreateTime).toISOString() : undefined,
        UpdateTime: desc.UpdateTime ? new Date(desc.UpdateTime).toISOString() : undefined,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteGeofenceCollectionAction(collectionName: string): Promise<{ success: boolean; error?: string }> {
  try {
    await location.send(new DeleteGeofenceCollectionCommand({ CollectionName: collectionName }));
    const registry = await getRegistry();
    delete registry.geofencesByCollection[collectionName];
    await saveRegistry(registry);
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export interface GeofenceItem {
  GeofenceId: string;
  Status?: string;
  CreateTime?: string;
  UpdateTime?: string;
  GeometryType: "Circle" | "Polygon";
  Circle?: {
    Center: [number, number];
    Radius: number;
  };
  Polygon?: number[][][];
}

export async function putGeofenceAction(data: {
  collectionName: string;
  geofenceId: string;
  type: "Circle" | "Polygon";
  center?: [number, number]; // [Longitude, Latitude]
  radius?: number; // meters
  polygon?: number[][][]; // GeoJSON coordinates
}): Promise<{ success: boolean; geofenceId?: string; error?: string }> {
  try {
    const geometry: { Circle?: { Center: [number, number]; Radius: number }; Polygon?: number[][][] } = {};
    if (data.type === "Circle" && data.center && data.radius) {
      geometry.Circle = {
        Center: data.center,
        Radius: data.radius,
      };
    } else if (data.type === "Polygon" && data.polygon) {
      geometry.Polygon = data.polygon;
    } else {
      throw new Error("Invalid geometry configuration. Circle requires center and radius.");
    }

    const res = await location.send(
      new PutGeofenceCommand({
        CollectionName: data.collectionName,
        GeofenceId: data.geofenceId,
        Geometry: geometry,
      })
    );

    // Save geofence ID to registry
    const registry = await getRegistry();
    if (!registry.geofencesByCollection[data.collectionName]) {
      registry.geofencesByCollection[data.collectionName] = [];
    }
    if (!registry.geofencesByCollection[data.collectionName].includes(data.geofenceId)) {
      registry.geofencesByCollection[data.collectionName].push(data.geofenceId);
    }
    await saveRegistry(registry);

    return {
      success: true,
      geofenceId: res.GeofenceId,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getGeofenceAction(
  collectionName: string,
  geofenceId: string
): Promise<{ success: boolean; geofence?: GeofenceItem; error?: string }> {
  try {
    const res = await location.send(
      new GetGeofenceCommand({
        CollectionName: collectionName,
        GeofenceId: geofenceId,
      })
    );

    const isCircle = !!res.Geometry?.Circle;
    return {
      success: true,
      geofence: {
        GeofenceId: res.GeofenceId || geofenceId,
        Status: res.Status,
        CreateTime: res.CreateTime ? new Date(res.CreateTime).toISOString() : undefined,
        UpdateTime: res.UpdateTime ? new Date(res.UpdateTime).toISOString() : undefined,
        GeometryType: isCircle ? "Circle" : "Polygon",
        Circle: res.Geometry?.Circle
          ? {
              Center: [res.Geometry.Circle.Center![0], res.Geometry.Circle.Center![1]],
              Radius: res.Geometry.Circle.Radius || 0,
            }
          : undefined,
        Polygon: res.Geometry?.Polygon as number[][][] | undefined,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function listGeofencesAction(
  collectionName: string
): Promise<{ success: boolean; geofences: GeofenceItem[]; error?: string }> {
  try {
    // Try live SDK ListGeofencesCommand
    try {
      const res = await location.send(new ListGeofencesCommand({ CollectionName: collectionName }));
      if (res.Entries) {
        return {
          success: true,
          geofences: res.Entries.map((e) => ({
            GeofenceId: e.GeofenceId || "",
            Status: e.Status,
            CreateTime: e.CreateTime ? new Date(e.CreateTime).toISOString() : undefined,
            UpdateTime: e.UpdateTime ? new Date(e.UpdateTime).toISOString() : undefined,
            GeometryType: e.Geometry?.Circle ? "Circle" : "Polygon",
            Circle: e.Geometry?.Circle
              ? {
                  Center: [e.Geometry.Circle.Center![0], e.Geometry.Circle.Center![1]],
                  Radius: e.Geometry.Circle.Radius || 0,
                }
              : undefined,
            Polygon: e.Geometry?.Polygon as number[][][] | undefined,
          })),
        };
      }
    } catch (listErr: unknown) {
      const msg = listErr instanceof Error ? listErr.message : String(listErr);
      if (!msg.includes("NotImplemented")) {
        throw listErr;
      }
    }

    // Fallback: Query registry and describe each geofence
    const registry = await getRegistry();
    const ids = registry.geofencesByCollection[collectionName] || [];
    const geofences: GeofenceItem[] = [];
    const validIds: string[] = [];

    for (const gid of ids) {
      try {
        const getRes = await getGeofenceAction(collectionName, gid);
        if (getRes.success && getRes.geofence) {
          geofences.push(getRes.geofence);
          validIds.push(gid);
        }
      } catch {
        // Pruned
      }
    }

    if (validIds.length !== ids.length) {
      registry.geofencesByCollection[collectionName] = validIds;
      await saveRegistry(registry);
    }

    return { success: true, geofences };
  } catch (err: unknown) {
    return {
      success: false,
      geofences: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function batchDeleteGeofenceAction(
  collectionName: string,
  geofenceIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    try {
      await location.send(
        new BatchDeleteGeofenceCommand({
          CollectionName: collectionName,
          GeofenceIds: geofenceIds,
        })
      );
    } catch {
      // If BatchDeleteGeofence is not implemented, clean from registry
    }

    const registry = await getRegistry();
    if (registry.geofencesByCollection[collectionName]) {
      registry.geofencesByCollection[collectionName] = registry.geofencesByCollection[collectionName].filter(
        (id) => !geofenceIds.includes(id)
      );
      await saveRegistry(registry);
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// -------------------------------------------------------------
// 4. ROUTE CALCULATORS
// -------------------------------------------------------------

export interface RouteCalculatorSummary {
  CalculatorName: string;
  Description?: string;
  DataSource?: string;
  PricingPlan?: string;
  CreateTime?: string;
  UpdateTime?: string;
  CalculatorArn?: string;
}

export async function listRouteCalculatorsAction(): Promise<{
  success: boolean;
  calculators: RouteCalculatorSummary[];
  error?: string;
}> {
  try {
    // First try live SDK ListRouteCalculatorsCommand
    try {
      const res = await location.send(new ListRouteCalculatorsCommand({}));
      if (res.Entries) {
        return {
          success: true,
          calculators: res.Entries.map((e) => ({
            CalculatorName: e.CalculatorName || "",
            Description: e.Description,
            DataSource: e.DataSource,
            PricingPlan: e.PricingPlan,
            CreateTime: e.CreateTime ? new Date(e.CreateTime).toISOString() : undefined,
            UpdateTime: e.UpdateTime ? new Date(e.UpdateTime).toISOString() : undefined,
          })),
        };
      }
    } catch (listErr: unknown) {
      const msg = listErr instanceof Error ? listErr.message : String(listErr);
      if (!msg.includes("NotImplemented")) {
        throw listErr;
      }
    }

    // Fallback: Query registry and run DescribeRouteCalculatorCommand
    const registry = await getRegistry();
    const calculators: RouteCalculatorSummary[] = [];
    const validNames: string[] = [];

    for (const name of registry.routeCalculators) {
      try {
        const desc = await location.send(new DescribeRouteCalculatorCommand({ CalculatorName: name }));
        validNames.push(name);
        calculators.push({
          CalculatorName: desc.CalculatorName || name,
          Description: desc.Description,
          DataSource: desc.DataSource,
          PricingPlan: desc.PricingPlan,
          CalculatorArn: desc.CalculatorArn,
          CreateTime: desc.CreateTime ? new Date(desc.CreateTime).toISOString() : undefined,
          UpdateTime: desc.UpdateTime ? new Date(desc.UpdateTime).toISOString() : undefined,
        });
      } catch {
        // Pruned
      }
    }

    if (validNames.length !== registry.routeCalculators.length) {
      registry.routeCalculators = validNames;
      await saveRegistry(registry);
    }

    return { success: true, calculators };
  } catch (err: unknown) {
    return {
      success: false,
      calculators: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createRouteCalculatorAction(data: {
  calculatorName: string;
  dataSource: string;
  description?: string;
  tags?: Record<string, string>;
}): Promise<{ success: boolean; calculatorName?: string; calculatorArn?: string; error?: string }> {
  try {
    const res = await location.send(
      new CreateRouteCalculatorCommand({
        CalculatorName: data.calculatorName,
        DataSource: data.dataSource,
        Description: data.description || "",
        Tags: data.tags,
      })
    );

    const registry = await getRegistry();
    if (!registry.routeCalculators.includes(data.calculatorName)) {
      registry.routeCalculators.push(data.calculatorName);
      await saveRegistry(registry);
    }

    return {
      success: true,
      calculatorName: res.CalculatorName,
      calculatorArn: res.CalculatorArn,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function describeRouteCalculatorAction(
  calculatorName: string
): Promise<{ success: boolean; calculator?: RouteCalculatorSummary; error?: string }> {
  try {
    const desc = await location.send(new DescribeRouteCalculatorCommand({ CalculatorName: calculatorName }));
    return {
      success: true,
      calculator: {
        CalculatorName: desc.CalculatorName || calculatorName,
        CalculatorArn: desc.CalculatorArn,
        Description: desc.Description,
        DataSource: desc.DataSource,
        PricingPlan: desc.PricingPlan,
        CreateTime: desc.CreateTime ? new Date(desc.CreateTime).toISOString() : undefined,
        UpdateTime: desc.UpdateTime ? new Date(desc.UpdateTime).toISOString() : undefined,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteRouteCalculatorAction(calculatorName: string): Promise<{ success: boolean; error?: string }> {
  try {
    await location.send(new DeleteRouteCalculatorCommand({ CalculatorName: calculatorName }));
    const registry = await getRegistry();
    registry.routeCalculators = registry.routeCalculators.filter((c) => c !== calculatorName);
    await saveRegistry(registry);
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function calculateRouteAction(data: {
  calculatorName: string;
  departurePosition: [number, number]; // [Longitude, Latitude]
  destinationPosition: [number, number]; // [Longitude, Latitude]
  travelMode?: "Car" | "Truck" | "Walking";
}): Promise<{
  success: boolean;
  notSupported?: boolean;
  distanceKm?: number;
  durationSeconds?: number;
  error?: string;
}> {
  try {
    const res = await location.send(
      new CalculateRouteCommand({
        CalculatorName: data.calculatorName,
        DeparturePosition: data.departurePosition,
        DestinationPosition: data.destinationPosition,
        TravelMode: data.travelMode || "Car",
        DepartNow: true,
      })
    );

    return {
      success: true,
      distanceKm: res.Summary?.Distance ? res.Summary.Distance / 1000 : 0,
      durationSeconds: res.Summary?.DurationSeconds || 0,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("NotImplemented")) {
      return {
        success: false,
        notSupported: true,
        error: "CalculateRoute operation is scaffolded but not implemented in this emulator version.",
      };
    }
    return {
      success: false,
      error: msg,
    };
  }
}

// -------------------------------------------------------------
// 5. RESOURCE COUNTS (DASHBOARD OVERVIEW)
// -------------------------------------------------------------

export interface LocationDashboardStats {
  mapsCount: number;
  trackersCount: number;
  geofenceCollectionsCount: number;
  routeCalculatorsCount: number;
  placeIndexesCount: number;
  apiKeysCount: number;
}

export async function getLocationDashboardStatsAction(): Promise<LocationDashboardStats> {
  const [mapsRes, trackersRes, geofenceRes, routesRes] = await Promise.all([
    listMapsAction(),
    listTrackersAction(),
    listGeofenceCollectionsAction(),
    listRouteCalculatorsAction(),
  ]);

  return {
    mapsCount: mapsRes.maps.length,
    trackersCount: trackersRes.trackers.length,
    geofenceCollectionsCount: geofenceRes.collections.length,
    routeCalculatorsCount: routesRes.calculators.length,
    placeIndexesCount: 0,
    apiKeysCount: 0,
  };
}
