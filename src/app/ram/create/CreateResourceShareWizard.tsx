"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AvailableShareableResource, RAMPermission, RAMTag } from "../types";
import { createResourceShareAction, fetchPermissionDetail } from "../actions";

interface WizardProps {
  availableResources: AvailableShareableResource[];
  allPermissions: RAMPermission[];
}

export default function CreateResourceShareWizard({
  availableResources,
  allPermissions,
}: WizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Details & Resources
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [allowExternal, setAllowExternal] = useState(true);
  const [tags, setTags] = useState<RAMTag[]>([]);
  const [selectedResourceArns, setSelectedResourceArns] = useState<string[]>([]);
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("ALL");
  const [resourceSearch, setResourceSearch] = useState<string>("");

  // Step 2: Managed permissions
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string>>({});
  const [inspectingPermission, setInspectingPermission] = useState<RAMPermission | null>(null);
  const [permissionPolicyLoading, setPermissionPolicyLoading] = useState(false);

  // Step 3: Principals
  const [principalType, setPrincipalType] = useState<"ACCOUNT" | "ORGANIZATION" | "OU">("ACCOUNT");
  const [principalInput, setPrincipalInput] = useState("");
  const [principalError, setPrincipalError] = useState("");
  const [principalsList, setPrincipalsList] = useState<
    Array<{ id: string; type: "ACCOUNT" | "ORGANIZATION" | "OU" }>
  >([]);

  // Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Available resource types
  const uniqueResourceTypes = Array.from(new Set(availableResources.map((r) => r.type)));

  // Filtered available resources
  const filteredResources = availableResources.filter((r) => {
    const matchesType = resourceTypeFilter === "ALL" || r.type === resourceTypeFilter;
    const matchesSearch =
      r.id.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      r.name.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      r.arn.toLowerCase().includes(resourceSearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  const toggleSelectAllResources = () => {
    if (filteredResources.length === 0) return;
    const allFilteredSelected = filteredResources.every((r) =>
      selectedResourceArns.includes(r.arn)
    );
    if (allFilteredSelected) {
      setSelectedResourceArns(
        selectedResourceArns.filter((arn) => !filteredResources.some((r) => r.arn === arn))
      );
    } else {
      const toAdd = filteredResources
        .map((r) => r.arn)
        .filter((arn) => !selectedResourceArns.includes(arn));
      setSelectedResourceArns([...selectedResourceArns, ...toAdd]);
    }
  };

  const toggleResource = (arn: string) => {
    if (selectedResourceArns.includes(arn)) {
      setSelectedResourceArns(selectedResourceArns.filter((a) => a !== arn));
    } else {
      setSelectedResourceArns([...selectedResourceArns, arn]);
    }
  };

  // Add Tag
  const addTagRow = () => {
    setTags([...tags, { key: "", value: "" }]);
  };

  const updateTag = (index: number, field: "key" | "value", val: string) => {
    const updated = [...tags];
    updated[index][field] = val;
    setTags(updated);
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // Add Principal
  const handleAddPrincipal = () => {
    const trimmed = principalInput.trim();
    if (!trimmed) {
      setPrincipalError("Please enter a principal identifier.");
      return;
    }
    if (principalType === "ACCOUNT" && !/^\d{12}$/.test(trimmed)) {
      setPrincipalError("AWS Account ID must be a 12-digit number.");
      return;
    }
    if (principalsList.some((p) => p.id === trimmed)) {
      setPrincipalError("This principal is already added.");
      return;
    }

    setPrincipalsList([...principalsList, { id: trimmed, type: principalType }]);
    setPrincipalInput("");
    setPrincipalError("");
  };

  const removePrincipal = (id: string) => {
    setPrincipalsList(principalsList.filter((p) => p.id !== id));
  };

  // Inspect permission details
  const handleInspectPermission = async (perm: RAMPermission) => {
    setInspectingPermission(perm);
    setPermissionPolicyLoading(true);
    try {
      const detail = await fetchPermissionDetail(perm.arn);
      if (detail.success && detail.data) {
        setInspectingPermission(detail.data);
      }
    } catch {
      // ignore
    } finally {
      setPermissionPolicyLoading(false);
    }
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!name.trim()) {
      setNameError("Resource share name is required.");
      return false;
    }
    setNameError("");
    return true;
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Create submission
  const handleCreate = async () => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const selectedPermArns = Object.values(selectedPermissions).filter(Boolean);
      const cleanTags = tags.filter((t) => t.key.trim() !== "");

      const res = await createResourceShareAction({
        name: name.trim(),
        allowExternalPrincipals: allowExternal,
        resourceArns: selectedResourceArns,
        principals: principalsList.map((p) => p.id),
        permissionArns: selectedPermArns.length > 0 ? selectedPermArns : undefined,
        tags: cleanTags.length > 0 ? cleanTags : undefined,
      });

      if (res.success) {
        router.push("/ram");
        router.refresh();
      } else {
        setSubmitError(res.error || "Failed to create resource share.");
      }
    } catch (e: any) {
      setSubmitError(e.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Selected resource types for Step 2
  const selectedResourceObjects = availableResources.filter((r) =>
    selectedResourceArns.includes(r.arn)
  );
  const activeResourceTypes = Array.from(new Set(selectedResourceObjects.map((r) => r.type)));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-[#eaeded] pb-4">
        <div className="flex items-center gap-2 text-xs text-[#545b64] mb-1">
          <Link href="/ram" className="hover:underline">
            Resource shares
          </Link>
          <span>/</span>
          <span>Create resource share</span>
        </div>
        <h1 className="text-2xl font-bold text-[#16191f]">Create resource share</h1>
      </div>

      {/* Progress Steps */}
      <div className="grid grid-cols-4 border-b border-[#eaeded] bg-white rounded shadow-sm">
        {[
          { step: 1, title: "1. Specify details & resources" },
          { step: 2, title: "2. Associate managed permissions" },
          { step: 3, title: "3. Grant access to principals" },
          { step: 4, title: "4. Review and create" },
        ].map((item) => (
          <div
            key={item.step}
            className={`py-3 px-4 text-xs font-bold border-b-2 text-center transition-colors ${
              currentStep === item.step
                ? "border-[#0073bb] text-[#0073bb]"
                : currentStep > item.step
                ? "border-[#1d8102] text-[#1d8102]"
                : "border-transparent text-[#545b64]"
            }`}
          >
            {item.title}
          </div>
        ))}
      </div>

      {submitError && (
        <div className="p-4 rounded border text-sm bg-[#fdf2f2] border-[#f8b4b4] text-[#d13212] flex items-center justify-between">
          <span>{submitError}</span>
          <button onClick={() => setSubmitError("")} className="font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* STEP 1: Details & Resources */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Card: Share details */}
          <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-[#16191f]">Resource share details</h2>

            <div>
              <label className="block text-xs font-bold text-[#16191f] mb-1">
                Name <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="text"
                placeholder="MyResourceShare"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError("");
                }}
                className={`w-full max-w-md text-[13px] px-3 py-1.5 border rounded-[2px] focus:outline-none ${
                  nameError
                    ? "border-[#d13212] bg-[#fff5f5]"
                    : "border-[#aab7b8] focus:border-[#0073bb]"
                }`}
              />
              {nameError && <p className="text-xs text-[#d13212] mt-1">{nameError}</p>}
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowExternal}
                  onChange={(e) => setAllowExternal(e.target.checked)}
                  className="mt-1 rounded border-[#aab7b8] text-[#0073bb] focus:ring-0"
                />
                <span className="text-xs text-[#16191f]">
                  <strong className="block">Allow sharing with external principals</strong>
                  Permit sharing this resource share with any AWS account, including accounts outside of your organization.
                </span>
              </label>
            </div>

            {/* Tags section */}
            <div className="pt-4 border-t border-[#eaeded]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-bold text-[#16191f]">Tags - optional</h3>
                  <p className="text-xs text-[#545b64]">
                    A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addTagRow}
                  className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-3 rounded-[2px] transition-colors"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Add new tag
                </button>
              </div>

              {tags.length > 0 && (
                <div className="border border-[#eaeded] rounded mt-2">
                  <table className="w-full text-[13px]">
                    <thead className="bg-[#fafafa] text-[#545b64] text-[11px] font-bold uppercase border-b border-[#eaeded]">
                      <tr>
                        <th className="p-2.5 text-left">Key</th>
                        <th className="p-2.5 text-left">Value</th>
                        <th className="p-2.5 w-16 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded]">
                      {tags.map((t, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Key"
                              value={t.key}
                              onChange={(e) => updateTag(idx, "key", e.target.value)}
                              className="w-full text-xs px-2.5 py-1 border border-[#aab7b8] rounded-[2px]"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Value"
                              value={t.value}
                              onChange={(e) => updateTag(idx, "value", e.target.value)}
                              className="w-full text-xs px-2.5 py-1 border border-[#aab7b8] rounded-[2px]"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeTag(idx)}
                              className="text-xs text-[#d13212] hover:underline font-bold"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Card: Select Resources */}
          <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-[#16191f]">Resources</h2>
                <p className="text-xs text-[#545b64]">
                  Select the resources you want to share. Resources are populated live from your AWS services (EC2 Subnets, KMS Keys, etc.).
                </p>
              </div>
              <div className="text-xs text-[#545b64] font-medium">
                Selected: <span className="text-[#0073bb] font-bold">{selectedResourceArns.length}</span> resource(s)
              </div>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <select
                value={resourceTypeFilter}
                onChange={(e) => setResourceTypeFilter(e.target.value)}
                className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded-[2px] bg-white focus:outline-none focus:border-[#0073bb]"
              >
                <option value="ALL">All resource types ({availableResources.length})</option>
                {uniqueResourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type} ({availableResources.filter((r) => r.type === type).length})
                  </option>
                ))}
              </select>
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Filter resources by ID, name, or ARN"
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 pl-8 border border-[#aab7b8] rounded-[2px] focus:outline-none focus:border-[#0073bb]"
                />
                <svg
                  className="absolute left-2.5 top-2.5 text-[#545b64]"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
            </div>

            {/* Resources Table */}
            <div className="border border-[#eaeded] rounded overflow-x-auto">
              <table className="w-full text-left text-[13px] text-[#16191f]">
                <thead className="bg-[#fafafa] text-[#545b64] text-[11px] font-bold uppercase tracking-wider border-b border-[#eaeded]">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredResources.length > 0 &&
                          filteredResources.every((r) => selectedResourceArns.includes(r.arn))
                        }
                        onChange={toggleSelectAllResources}
                        aria-label="Select all resources"
                        className="rounded border-[#aab7b8] text-[#0073bb] focus:ring-0"
                      />
                    </th>
                    <th className="p-3">Resource ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Resource type</th>
                    <th className="p-3">Service</th>
                    <th className="p-3">Region</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {filteredResources.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#545b64]">
                        <p className="font-semibold text-sm text-[#16191f]">No resources found</p>
                        <p className="text-xs mt-1">
                          You can create subnets in{" "}
                          <Link href="/vpc" className="text-[#0073bb] hover:underline">
                            VPC
                          </Link>{" "}
                          or cryptographic keys in{" "}
                          <Link href="/kms" className="text-[#0073bb] hover:underline">
                            KMS
                          </Link>{" "}
                          to share them with RAM.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredResources.map((res) => {
                      const isSelected = selectedResourceArns.includes(res.arn);
                      return (
                        <tr
                          key={res.arn}
                          className={`hover:bg-[#f9f9f9] transition-colors ${
                            isSelected ? "bg-[#f2f8fd]" : ""
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleResource(res.arn)}
                              aria-label={`Select ${res.id}`}
                              className="rounded border-[#aab7b8] text-[#0073bb] focus:ring-0"
                            />
                          </td>
                          <td className="p-3 font-mono text-xs font-medium text-[#0073bb]">
                            {res.id}
                          </td>
                          <td className="p-3">{res.name}</td>
                          <td className="p-3">
                            <span className="font-mono text-xs bg-[#f2f3f3] px-2 py-0.5 rounded text-[#545b64]">
                              {res.type}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-[#545b64]">{res.service}</td>
                          <td className="p-3 text-xs text-[#545b64]">{res.region}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Managed permissions */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#16191f]">Associate managed permissions</h2>
              <p className="text-xs text-[#545b64] mt-1">
                Managed permissions define the actions that principals can perform on the resources you share. RAM assigns a default managed permission for each resource type.
              </p>
            </div>

            {activeResourceTypes.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-[#eaeded] rounded text-[#545b64]">
                <p className="text-sm font-semibold text-[#16191f]">No resources selected</p>
                <p className="text-xs mt-1">
                  You haven&apos;t selected any resources in Step 1. You can proceed without sharing resources now, or go back to select resources.
                </p>
              </div>
            ) : (
              activeResourceTypes.map((type) => {
                const permsForType = allPermissions.filter((p) => p.resourceType === type);
                return (
                  <div key={type} className="border border-[#eaeded] rounded p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase text-[#545b64]">
                        Resource type: <span className="text-[#16191f] font-mono">{type}</span>
                      </h3>
                      <span className="text-xs text-[#545b64]">
                        {permsForType.length} available permission(s)
                      </span>
                    </div>

                    <div className="border border-[#eaeded] rounded overflow-hidden">
                      <table className="w-full text-left text-[13px] text-[#16191f]">
                        <thead className="bg-[#fafafa] text-[#545b64] text-[11px] font-bold uppercase border-b border-[#eaeded]">
                          <tr>
                            <th className="p-2.5 w-10 text-center">Select</th>
                            <th className="p-2.5">Permission Name</th>
                            <th className="p-2.5">Version</th>
                            <th className="p-2.5">Default</th>
                            <th className="p-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eaeded]">
                          {permsForType.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-xs text-[#545b64]">
                                Using AWS default RAM managed permission for {type}.
                              </td>
                            </tr>
                          ) : (
                            permsForType.map((perm) => {
                              const isChecked =
                                selectedPermissions[type] === perm.arn ||
                                (!selectedPermissions[type] && perm.isResourceTypeDefault);
                              return (
                                <tr key={perm.arn} className="hover:bg-[#f9f9f9]">
                                  <td className="p-2.5 text-center">
                                    <input
                                      type="radio"
                                      name={`perm_${type}`}
                                      checked={isChecked}
                                      onChange={() =>
                                        setSelectedPermissions({
                                          ...selectedPermissions,
                                          [type]: perm.arn,
                                        })
                                      }
                                      className="text-[#0073bb] focus:ring-0"
                                    />
                                  </td>
                                  <td className="p-2.5 font-medium">{perm.name}</td>
                                  <td className="p-2.5 text-xs text-[#545b64]">v{perm.version}</td>
                                  <td className="p-2.5 text-xs">
                                    {perm.isResourceTypeDefault ? (
                                      <span className="text-[#1d8102] font-semibold">Yes</span>
                                    ) : (
                                      "No"
                                    )}
                                  </td>
                                  <td className="p-2.5 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleInspectPermission(perm)}
                                      className="text-xs text-[#0073bb] hover:underline font-bold"
                                    >
                                      View details
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* STEP 3: Grant access to principals */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#16191f]">Grant access to principals</h2>
              <p className="text-xs text-[#545b64] mt-1">
                Specify the AWS accounts or organization units that will receive access to this resource share.
              </p>
            </div>

            <div className="border border-[#eaeded] rounded p-4 space-y-3 bg-[#fafafa]">
              <h3 className="text-xs font-bold text-[#16191f]">Add principal</h3>
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <select
                  value={principalType}
                  onChange={(e) => setPrincipalType(e.target.value as any)}
                  className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded-[2px] bg-white focus:outline-none focus:border-[#0073bb]"
                >
                  <option value="ACCOUNT">AWS Account ID</option>
                  <option value="ORGANIZATION">Organization ID</option>
                  <option value="OU">Organizational Unit (OU)</option>
                </select>

                <div className="flex-1 w-full">
                  <input
                    type="text"
                    placeholder={
                      principalType === "ACCOUNT"
                        ? "12-digit AWS Account ID (e.g. 111122223333)"
                        : principalType === "ORGANIZATION"
                        ? "Organization ID (e.g. o-1234567890)"
                        : "Organizational Unit ID (e.g. ou-1234-56789012)"
                    }
                    value={principalInput}
                    onChange={(e) => {
                      setPrincipalInput(e.target.value);
                      if (principalError) setPrincipalError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddPrincipal();
                      }
                    }}
                    className={`w-full text-[13px] px-3 py-1.5 border rounded-[2px] bg-white focus:outline-none ${
                      principalError
                        ? "border-[#d13212] bg-[#fff5f5]"
                        : "border-[#aab7b8] focus:border-[#0073bb]"
                    }`}
                  />
                  {principalError && (
                    <p className="text-xs text-[#d13212] mt-1">{principalError}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddPrincipal}
                  className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-4 rounded-[2px] transition-colors"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Added Principals Table */}
            <div className="border border-[#eaeded] rounded overflow-hidden">
              <table className="w-full text-left text-[13px] text-[#16191f]">
                <thead className="bg-[#fafafa] text-[#545b64] text-[11px] font-bold uppercase border-b border-[#eaeded]">
                  <tr>
                    <th className="p-3">Principal ID</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 w-20 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {principalsList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-xs text-[#545b64]">
                        No principals added yet. Enter an AWS Account ID above and click &quot;Add&quot;.
                      </td>
                    </tr>
                  ) : (
                    principalsList.map((p) => (
                      <tr key={p.id} className="hover:bg-[#f9f9f9]">
                        <td className="p-3 font-mono text-xs font-semibold">{p.id}</td>
                        <td className="p-3 text-xs text-[#545b64]">
                          {p.type === "ACCOUNT"
                            ? "AWS Account"
                            : p.type === "ORGANIZATION"
                            ? "Organization"
                            : "Organizational Unit"}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => removePrincipal(p.id)}
                            className="text-xs text-[#d13212] hover:underline font-bold"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Review and create */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-6">
            <h2 className="text-base font-bold text-[#16191f]">Review and create</h2>

            {/* Review Section 1: Details */}
            <div className="border border-[#eaeded] rounded p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
                <h3 className="text-xs font-bold uppercase text-[#545b64]">
                  Step 1: Resource share details
                </h3>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-[#0073bb] hover:underline font-bold"
                >
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[#545b64] block">Name</span>
                  <span className="font-semibold text-[#16191f] text-sm">{name}</span>
                </div>
                <div>
                  <span className="text-[#545b64] block">Allow external principals</span>
                  <span className="font-semibold text-[#16191f]">
                    {allowExternal ? "Yes" : "No"}
                  </span>
                </div>
                <div>
                  <span className="text-[#545b64] block">Tags</span>
                  <span className="font-semibold text-[#16191f]">{tags.length} tag(s)</span>
                </div>
              </div>
            </div>

            {/* Review Section 2: Resources */}
            <div className="border border-[#eaeded] rounded p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
                <h3 className="text-xs font-bold uppercase text-[#545b64]">
                  Resources ({selectedResourceArns.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-[#0073bb] hover:underline font-bold"
                >
                  Edit
                </button>
              </div>
              {selectedResourceArns.length === 0 ? (
                <p className="text-xs text-[#545b64]">No resources selected.</p>
              ) : (
                <div className="max-h-40 overflow-y-auto divide-y divide-[#eaeded] text-xs">
                  {selectedResourceObjects.map((r) => (
                    <div key={r.arn} className="py-2 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-[#16191f]">{r.name}</span>{" "}
                        <span className="font-mono text-[11px] text-[#545b64]">({r.id})</span>
                      </div>
                      <span className="font-mono text-[11px] bg-[#f2f3f3] px-2 py-0.5 rounded text-[#545b64]">
                        {r.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Review Section 3: Principals */}
            <div className="border border-[#eaeded] rounded p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
                <h3 className="text-xs font-bold uppercase text-[#545b64]">
                  Principals ({principalsList.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="text-xs text-[#0073bb] hover:underline font-bold"
                >
                  Edit
                </button>
              </div>
              {principalsList.length === 0 ? (
                <p className="text-xs text-[#545b64]">No principals added.</p>
              ) : (
                <div className="max-h-40 overflow-y-auto divide-y divide-[#eaeded] text-xs">
                  {principalsList.map((p) => (
                    <div key={p.id} className="py-2 flex items-center justify-between">
                      <span className="font-mono font-semibold text-[#16191f]">{p.id}</span>
                      <span className="text-[#545b64]">{p.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wizard Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-[#eaeded]">
        <div>
          <Link
            href="/ram"
            className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-4 rounded-[2px] transition-colors inline-flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Cancel
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrevious}
              disabled={isSubmitting}
              className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-4 rounded-[2px] transition-colors"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Previous
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              disabled={isSubmitting}
              className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              {isSubmitting ? "Creating resource share..." : "Create resource share"}
            </button>
          )}
        </div>
      </div>

      {/* Permission Inspection Drawer/Modal */}
      {inspectingPermission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
              <h3 className="text-base font-bold text-[#16191f]">
                Permission details: {inspectingPermission.name}
              </h3>
              <button
                onClick={() => setInspectingPermission(null)}
                className="text-gray-500 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <p>
                <strong>Resource type:</strong> {inspectingPermission.resourceType}
              </p>
              <p>
                <strong>Version:</strong> v{inspectingPermission.version}
              </p>
              <p>
                <strong>Status:</strong> {inspectingPermission.status}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#16191f] mb-1">Allowed actions policy:</h4>
              {permissionPolicyLoading ? (
                <div className="p-4 text-center text-xs text-[#545b64]">Loading policy...</div>
              ) : (
                <pre className="bg-[#f9f9f9] border border-[#eaeded] rounded p-3 text-xs font-mono max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {inspectingPermission.permission ||
                    JSON.stringify(
                      {
                        Version: "2012-10-17",
                        Statement: [
                          {
                            Effect: "Allow",
                            Action: [`${inspectingPermission.resourceType.split(":")[0]}:*`],
                            Resource: "*",
                          },
                        ],
                      },
                      null,
                      2
                    )}
                </pre>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectingPermission(null)}
                className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-4 rounded-[2px] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
