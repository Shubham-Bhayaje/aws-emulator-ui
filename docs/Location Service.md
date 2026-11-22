# Amazon Location Service

Amazon Location Service is a fully managed AWS geospatial service that makes it easy and cost-effective for developers to add location data, interactive maps, geocoding, turn-by-turn routing, device tracking, and virtual geofences to applications. Instead of managing expensive third-party licensing or compromising user privacy, Amazon Location provides secure access to commercial-grade location-based services (LBS) from trusted global providers including Esri, HERE Technologies, and Open Data (OpenStreetMap).

Amazon Location maintains data privacy by removing metadata and account credentials before routing queries to third-party data providers. Tracking coordinates and device telemetry never leave your AWS account boundary.

---

## Key Concepts

### 1. Maps
A map resource provides vector and raster basemaps rendered via MapLibre GL JS, Mapbox GL, Tangram, or mobile SDKs. Map resources support styling configurations from multiple providers:
- **Esri**: `VectorEsriStreets`, `VectorEsriTopographic`, `VectorEsriNavigation`, `VectorEsriLightGray`, `VectorEsriDarkGray`, and `RasterEsriImagery`.
- **HERE**: `VectorHereExplore` and `VectorHereExploreTruck`.
- **Open Data**: `VectorOpenDataStandardLight` and `VectorOpenDataStandardDark` based on OpenStreetMap.

### 2. Trackers
A tracker resource collects, stores, and evaluates location updates from IoT devices, connected vehicles, and mobile clients.
- **Position Filtering**: To minimize GPS noise and optimize storage, trackers support:
  - `TimeBased`: Evaluates updates against time intervals.
  - `DistanceBased`: Discards updates if the device moved less than 30 meters from its last recorded location.
  - `AccuracyBased`: Discards updates exceeding estimated GPS error thresholds.
- **Device Telemetry**: Location updates are ingested in batches using `BatchUpdateDevicePosition` and queried via `GetDevicePosition`.
- **EventBridge Triggering**: When linked to a Geofence Collection as a consumer, position updates automatically evaluate boundary crossings.

### 3. Geofence Collections
A geofence collection is a container for virtual geographic perimeters. Geofences are defined using:
- **Circle**: Defined by a center point [Longitude, Latitude] and a radius in meters.
- **Polygon**: Defined by GeoJSON linear rings of closed coordinate vertices.
When a tracked device enters or exits a geofence boundary, Amazon Location emits a structured event to Amazon EventBridge.

### 4. Route Calculators
A route calculator computes travel time, distances, and turn-by-turn navigation paths between origin and destination coordinates. Calculations account for travel modes (`Car`, `Truck`, `Walking`) and commercial vehicle constraints (height, weight, hazmat).

### 5. Place Indexes
A place index provides geocoding (converting street addresses to coordinates) and reverse geocoding (converting coordinates into nearest postal addresses). It also supports text search for points of interest (POI).

### 6. API Keys
API keys provide authenticated access for front-end web and mobile applications to render maps and query places without embedding AWS IAM access keys in client-side code. Keys can be scoped by HTTP referer or IP address.

---

## Console Walkthrough and Working AWS CLI Commands

All actions below are integrated into this console and tested against the local AWS emulator.

### 1. Maps (`/location/maps`)
- **View maps**: Table listing all maps with Name, Provider, Style, Pricing plan, and Created date.
- **Create map** (`/location/maps/create`): Select map name, description, and visual map style card.
- **CLI Command**:
  ```bash
  aws --endpoint-url=https://localhost:9297 --region us-east-1 location create-map \
    --map-name MyDeliveryMap \
    --configuration '{"Style":"VectorEsriStreets"}' \
    --description "Street map for delivery tracking"
  ```
- **Describe map**:
  ```bash
  aws --endpoint-url=https://localhost:9297 --region us-east-1 location describe-map \
    --map-name MyDeliveryMap
  ```
- **Delete map**:
  ```bash
  aws --endpoint-url=https://localhost:9297 --region us-east-1 location delete-map \
    --map-name MyDeliveryMap
  ```

### 2. Trackers (`/location/trackers`)
- **View trackers**: Table listing all trackers with Name, Description, Pricing plan, and Created date.
- **Create tracker** (`/location/trackers/create`): Specify tracker name, description, position filtering strategy (`TimeBased`, `DistanceBased`, `AccuracyBased`), and KMS encryption key.
- **CLI Command**:
  ```bash
  aws --endpoint-url=https://localhost:9297 --region us-east-1 location create-tracker \
    --tracker-name FleetTracker-West \
    --position-filtering TimeBased \
    --description "Regional fleet vehicle tracker"
  ```
- **Describe tracker**:
  ```bash
  aws --endpoint-url=https://localhost:9297 --region us-east-1 location describe-tracker \
    --tracker-name FleetTracker-West
  ```
- **Update device position**:
  ```bash
  aws --endpoint-url=https://localhost:9297 --region us-east-1 location batch-update-device-position \
    --tracker-name FleetTracker-West \
    --updates '[{"DeviceId":"truck-101","Position":[-122.3321,47.6062],"SampleTime":"2026-11-22T10:00:00Z"}]'
  ```
- **Get device position**:
  ```bash
  aws --endpoint-url=https://localhost:9297 --region us-east-1 location get-device-position \
    --tracker-name FleetTracker-West \
    --device-id truck-101
  ```
- **Associate geofence consumer**:
  ```bash
  aws --endpoint-url=https://localhost:9297 --region us-east-1 location associate-tracker-consumer \
    --tracker-name FleetTracker-West \
    --consumer-arn arn:aws:geo:us-east-1:000000000000:geofence-collection/SeattleDepots
  ```
- **Delete tracker**:
  ```bash
  aws --endpoint-url=https://localhost:9297 --region us-east-1 location delete-tracker \
    --tracker-name FleetTracker-West
  ```

### 3. Geofence Collections (`/location/geofences`)
- **View collections**: Table listing collections with Name, Description, Pricing plan, and Created date.
- **Create collection** (`/location/geofences/create`): Specify collection name and optional KMS encryption key.
- **CLI Command**:
  ```bash
  aws --endpoint-url=https://localhost:9297 --region us-east-1 location create-geofence-collection \
    --collection-name SeattleDepots \
    --description "Seattle distribution centers"
  ```
- **Describe collection**:
  ```bash
  aws --endpoint-url=https://localhost:9297 --region us-east-1 location describe-geofence-collection \
    --collection-name SeattleDepots
  ```
- **Put circular geofence**:
  ```bash
  aws --endpoint-url=https://localhost:9297 --region us-east-1 location put-geofence \
    --collection-name SeattleDepots \
    --geofence-id depot-north \
    --geometry '{"Circle":{"Center":[-122.3321,47.6062],"Radius":1500}}'
  ```
- **Get geofence**:
  ```bash
  aws --endpoint-url=https://localhost:9297 --region us-east-1 location get-geofence \
    --collection-name SeattleDepots \
    --geofence-id depot-north
  ```
- **Delete collection**:
  ```bash
  aws --endpoint-url=https://localhost:9297 --region us-east-1 location delete-geofence-collection \
    --collection-name SeattleDepots
  ```

### 4. Route Calculators (`/location/routes`)
- **View calculators**: Table listing route calculators with Name, Data provider, Pricing plan, and Created date.
- **Create route calculator** (`/location/routes/create`): Specify name and data provider (`Esri` or `HERE`).
- **CLI Command**:
  ```bash
  aws --endpoint-url=https://localhost:9297 --region us-east-1 location create-route-calculator \
    --calculator-name RegionalRoutes \
    --data-source Esri \
    --description "Calculates driving routes in Pacific Northwest"
  ```
- **Describe route calculator**:
  ```bash
  aws --endpoint-url=https://localhost:9297 --region us-east-1 location describe-route-calculator \
    --calculator-name RegionalRoutes
  ```
- **Delete route calculator**:
  ```bash
  aws --endpoint-url=https://localhost:9297 --region us-east-1 location delete-route-calculator \
    --calculator-name RegionalRoutes
  ```

---

## Emulator Compatibility & Limitations

| Feature / API | Status in Emulator | Console Experience |
|---|---|---|
| `CreateMap` | Fully Supported | Functional, creates live resource in emulator |
| `DescribeMap` | Fully Supported | Functional, returns live style and ARN metadata |
| `DeleteMap` | Fully Supported | Functional, deletes map from emulator |
| `ListMaps` | Scaffolded (NotImplemented) | Handled gracefully via registry and live `DescribeMap` calls |
| `CreateTracker` | Fully Supported | Functional, creates tracker with position filtering |
| `DescribeTracker` | Fully Supported | Functional, returns live tracker details |
| `ListTrackers` | Fully Supported | Functional, lists all created trackers |
| `DeleteTracker` | Fully Supported | Functional, deletes tracker from emulator |
| `BatchUpdateDevicePosition` | Fully Supported | Functional, updates live device telemetry coordinates |
| `GetDevicePosition` | Fully Supported | Functional, returns live device location and timestamp |
| `AssociateTrackerConsumer` | Fully Supported | Functional, associates geofence collection consumer |
| `ListTrackerConsumers` | Fully Supported | Functional, lists linked geofence collection ARNs |
| `DisassociateTrackerConsumer` | Fully Supported | Functional, unlinks consumer collection |
| `CreateGeofenceCollection` | Fully Supported | Functional, creates geofence collection |
| `DescribeGeofenceCollection` | Fully Supported | Functional, returns collection metadata |
| `ListGeofenceCollections` | Fully Supported | Functional, lists all collections |
| `DeleteGeofenceCollection` | Fully Supported | Functional, deletes collection |
| `PutGeofence` | Fully Supported | Functional, creates Circle and Polygon boundaries |
| `GetGeofence` | Fully Supported | Functional, returns geometry coordinates and status |
| `CreateRouteCalculator` | Fully Supported | Functional, creates route calculator |
| `DescribeRouteCalculator` | Fully Supported | Functional, returns calculator details |
| `DeleteRouteCalculator` | Fully Supported | Functional, deletes calculator |
| `ListRouteCalculators` | Scaffolded (NotImplemented) | Handled gracefully via registry and live `DescribeRouteCalculator` calls |
| `CalculateRoute` | Scaffolded (NotImplemented) | Gracefully handled with clear emulator notice and geodesic approximation |
| `CreatePlaceIndex` / `ListPlaceIndexes` | Scaffolded (NotImplemented) | UI rendered with clear emulator status banner |
| `CreateKey` / `ListKeys` | Scaffolded (NotImplemented) | UI rendered with clear emulator status banner |

---

## Integration Backlog

The following services connect to Amazon Location Service and can be enhanced when built:

1. **Amazon EventBridge**:
   - Geofence evaluations emit events (e.g. `Location Geofence Event`, `ENTER`, `EXIT`).
   - When EventBridge is built, link tracker event rules directly to EventBridge targets (e.g. Lambda, SNS, SQS).
2. **Amazon Cognito**:
   - Cognito Identity Pools generate temporary unauthenticated IAM credentials for mobile and web apps rendering maps.
   - When Cognito is built, provide direct Cognito identity pool creation shortcuts in Map detail views.
3. **AWS CloudWatch Metrics & Alarms**:
   - Trackers and maps publish request metrics (`GetMapTile`, `CalculateRoute`, `DevicePositionsUpdates`).
   - When CloudWatch metrics are fully built, display request charts on Location Overview.
