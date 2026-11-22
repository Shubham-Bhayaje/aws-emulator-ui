export interface LocationNavItem {
  label: string;
  href: string;
  group?: string;
  badge?: string;
}

export const locationNav: LocationNavItem[] = [
  { label: "Overview", href: "/location" },
  { label: "Maps", href: "/location/maps", group: "Resources" },
  { label: "Trackers", href: "/location/trackers", group: "Resources" },
  { label: "Geofence collections", href: "/location/geofences", group: "Resources" },
  { label: "Route calculators", href: "/location/routes", group: "Resources" },
  { label: "Place indexes", href: "/location/places", group: "Resources" },
  { label: "API keys", href: "/location/api-keys", group: "Authentication" },
];
