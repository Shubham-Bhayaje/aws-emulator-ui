import React from "react";
import { fetchRegionsAction } from "../actions";
import { RegionsClient } from "./RegionsClient";

export const dynamic = "force-dynamic";

export default async function RegionsPage() {
  const res = await fetchRegionsAction();
  return <RegionsClient initialRegions={res.regions || []} />;
}
