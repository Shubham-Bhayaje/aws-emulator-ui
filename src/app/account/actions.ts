"use server";

import { accountClient } from "@/lib/aws";
import {
  GetAccountInformationCommand,
  PutAccountNameCommand,
  GetContactInformationCommand,
  PutContactInformationCommand,
  GetAlternateContactCommand,
  PutAlternateContactCommand,
  DeleteAlternateContactCommand,
  ListRegionsCommand,
  GetRegionOptStatusCommand,
  EnableRegionCommand,
  DisableRegionCommand,
  SendPhoneNumberVerificationCommand,
  VerifyPhoneNumberCommand,
} from "@aws-sdk/client-account";
import {
  AccountInfo,
  ContactInfo,
  AlternateContact,
  AlternateContactType,
  RegionInfo,
} from "./types";

/**
 * Fetch Account Information & Primary Contact Information
 */
export async function fetchAccountOverview(): Promise<{
  success: boolean;
  account?: AccountInfo;
  contact?: ContactInfo;
  error?: string;
}> {
  try {
    const [accRes, contactRes] = await Promise.all([
      accountClient.send(new GetAccountInformationCommand({})).catch(() => null),
      accountClient.send(new GetContactInformationCommand({})).catch(() => null),
    ]);

    const account: AccountInfo = {
      accountId: accRes?.AccountId || "000000000000",
      accountName: accRes?.AccountName || "AWS Account",
      accountCreatedDate: accRes?.AccountCreatedDate?.toISOString(),
      accountState: accRes?.AccountState || "ACTIVE",
    };

    const ci = contactRes?.ContactInformation;
    const contact: ContactInfo = {
      fullName: ci?.FullName || "",
      addressLine1: ci?.AddressLine1 || "",
      addressLine2: ci?.AddressLine2 || "",
      city: ci?.City || "",
      stateOrRegion: ci?.StateOrRegion || "",
      postalCode: ci?.PostalCode || "",
      countryCode: ci?.CountryCode || "US",
      phoneNumber: ci?.PhoneNumber || "",
      websiteUrl: ci?.WebsiteUrl || "",
      verificationStatus: contactRes?.VerificationStatus || "UNVERIFIED",
    };

    return { success: true, account, contact };
  } catch (err: any) {
    console.error("fetchAccountOverview error:", err);
    return { success: false, error: err.message || "Failed to fetch account overview" };
  }
}

/**
 * Update Account Name
 */
export async function updateAccountNameAction(accountName: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await accountClient.send(
      new PutAccountNameCommand({
        AccountName: accountName.trim(),
      })
    );
    return { success: true };
  } catch (err: any) {
    console.error("updateAccountNameAction error:", err);
    return { success: false, error: err.message || "Failed to update account name" };
  }
}

/**
 * Update Primary Contact Information
 */
export async function updateContactInfoAction(contact: ContactInfo): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await accountClient.send(
      new PutContactInformationCommand({
        ContactInformation: {
          FullName: contact.fullName.trim(),
          AddressLine1: contact.addressLine1.trim(),
          AddressLine2: contact.addressLine2 ? contact.addressLine2.trim() : undefined,
          City: contact.city.trim(),
          StateOrRegion: contact.stateOrRegion.trim(),
          PostalCode: contact.postalCode.trim(),
          CountryCode: contact.countryCode.trim(),
          PhoneNumber: contact.phoneNumber.trim(),
          WebsiteUrl: contact.websiteUrl ? contact.websiteUrl.trim() : undefined,
        },
      })
    );
    return { success: true };
  } catch (err: any) {
    console.error("updateContactInfoAction error:", err);
    return { success: false, error: err.message || "Failed to update contact information" };
  }
}

/**
 * Fetch all three Alternate Contacts (BILLING, OPERATIONS, SECURITY)
 */
export async function fetchAlternateContacts(): Promise<{
  success: boolean;
  contacts: { [key in AlternateContactType]?: AlternateContact };
  error?: string;
}> {
  try {
    const types: AlternateContactType[] = ["BILLING", "OPERATIONS", "SECURITY"];
    const results = await Promise.all(
      types.map(async (t) => {
        try {
          const res = await accountClient.send(
            new GetAlternateContactCommand({ AlternateContactType: t })
          );
          if (res.AlternateContact) {
            return {
              type: t,
              contact: {
                alternateContactType: t,
                name: res.AlternateContact.Name || "",
                title: res.AlternateContact.Title || "",
                emailAddress: res.AlternateContact.EmailAddress || "",
                phoneNumber: res.AlternateContact.PhoneNumber || "",
              },
            };
          }
        } catch {
          // ResourceNotFoundException means contact has not been created yet
        }
        return { type: t, contact: null };
      })
    );

    const contactMap: { [key in AlternateContactType]?: AlternateContact } = {};
    results.forEach((r) => {
      if (r.contact) {
        contactMap[r.type] = r.contact;
      }
    });

    return { success: true, contacts: contactMap };
  } catch (err: any) {
    console.error("fetchAlternateContacts error:", err);
    return { success: false, contacts: {}, error: err.message || "Failed to fetch alternate contacts" };
  }
}

/**
 * Put / Update an Alternate Contact
 */
export async function putAlternateContactAction(contact: AlternateContact): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await accountClient.send(
      new PutAlternateContactCommand({
        AlternateContactType: contact.alternateContactType,
        Name: contact.name.trim(),
        Title: contact.title.trim(),
        EmailAddress: contact.emailAddress.trim(),
        PhoneNumber: contact.phoneNumber.trim(),
      })
    );
    return { success: true };
  } catch (err: any) {
    console.error("putAlternateContactAction error:", err);
    return { success: false, error: err.message || "Failed to save alternate contact" };
  }
}

/**
 * Delete an Alternate Contact
 */
export async function deleteAlternateContactAction(type: AlternateContactType): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await accountClient.send(
      new DeleteAlternateContactCommand({
        AlternateContactType: type,
      })
    );
    return { success: true };
  } catch (err: any) {
    console.error("deleteAlternateContactAction error:", err);
    return { success: false, error: err.message || "Failed to remove alternate contact" };
  }
}

/**
 * List all AWS Regions with Opt-in statuses
 */
export async function fetchRegionsAction(): Promise<{
  success: boolean;
  regions: RegionInfo[];
  error?: string;
}> {
  try {
    const res = await accountClient.send(new ListRegionsCommand({}));
    const regions: RegionInfo[] = (res.Regions || []).map((r) => ({
      regionName: r.RegionName || "",
      regionOptStatus: (r.RegionOptStatus as any) || "DISABLED",
    }));

    // Sort alphabetically by regionName
    regions.sort((a, b) => a.regionName.localeCompare(b.regionName));

    return { success: true, regions };
  } catch (err: any) {
    console.error("fetchRegionsAction error:", err);
    return { success: false, regions: [], error: err.message || "Failed to list AWS regions" };
  }
}

/**
 * Enable an Opt-in Region
 */
export async function enableRegionAction(regionName: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await accountClient.send(new EnableRegionCommand({ RegionName: regionName }));
    return { success: true };
  } catch (err: any) {
    console.error("enableRegionAction error:", err);
    return { success: false, error: err.message || "Failed to enable region" };
  }
}

/**
 * Disable an Opt-in Region
 */
export async function disableRegionAction(regionName: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await accountClient.send(new DisableRegionCommand({ RegionName: regionName }));
    return { success: true };
  } catch (err: any) {
    console.error("disableRegionAction error:", err);
    return { success: false, error: err.message || "Failed to disable region" };
  }
}

/**
 * Send Phone Number Verification Code
 */
export async function sendPhoneVerificationAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await accountClient.send(new SendPhoneNumberVerificationCommand({}));
    return { success: true };
  } catch (err: any) {
    console.error("sendPhoneVerificationAction error:", err);
    return { success: false, error: err.message || "Failed to send verification code" };
  }
}

/**
 * Verify Phone Number with OTP
 */
export async function verifyPhoneNumberAction(otp: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await accountClient.send(new VerifyPhoneNumberCommand({ Otp: otp.trim() }));
    return { success: true };
  } catch (err: any) {
    console.error("verifyPhoneNumberAction error:", err);
    return { success: false, error: err.message || "Invalid or expired verification code" };
  }
}

/**
 * Close Account Simulation / Check
 */
export async function closeAccountAction(accountId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (accountId.trim() !== "000000000000") {
      return { success: false, error: "The provided account ID does not match this account." };
    }
    // Simulation
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to close account" };
  }
}
