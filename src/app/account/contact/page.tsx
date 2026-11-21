import React from "react";
import { fetchAccountOverview } from "../actions";
import { ContactClient } from "./ContactClient";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const res = await fetchAccountOverview();
  return (
    <ContactClient
      initialContact={
        res.contact || {
          fullName: "",
          addressLine1: "",
          city: "",
          stateOrRegion: "",
          postalCode: "",
          countryCode: "US",
          phoneNumber: "",
        }
      }
    />
  );
}
