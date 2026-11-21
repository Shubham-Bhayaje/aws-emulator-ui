import React from "react";
import { fetchAlternateContacts } from "../actions";
import { AlternateContactsClient } from "./AlternateContactsClient";

export const dynamic = "force-dynamic";

export default async function AlternateContactsPage() {
  const res = await fetchAlternateContacts();
  return <AlternateContactsClient initialContacts={res.contacts || {}} />;
}
