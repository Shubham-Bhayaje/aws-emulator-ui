/**
 * TableDetail – Client component for DynamoDB table detail and item explorer.
 * Features item browsing, dynamic columns, item creation modal (Form & JSON view),
 * item deletion, and table metadata inspection.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { putItem, deleteItem, deleteTable } from "../actions";

export interface KeySchemaEntry {
  AttributeName: string;
  KeyType: "HASH" | "RANGE";
  AttributeType: string;
}

export interface TableMeta {
  name: string;
  arn: string;
  status: string;
  billingMode: string;
  itemCount: number;
  sizeBytes: number;
  creationDateTime: string;
  keySchema: KeySchemaEntry[];
}

export interface ScannedItem {
  [key: string]: { value: any; type: string };
}

interface TableDetailProps {
  tableMeta: TableMeta;
  initialItems: ScannedItem[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function TableDetail({ tableMeta, initialItems }: TableDetailProps) {
  const [activeTab, setActiveTab] = useState<"items" | "details">("items");
  const [items, setItems] = useState<ScannedItem[]>(initialItems);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Create item modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState<"form" | "json">("form");
  const [jsonText, setJsonText] = useState("");

  // Form mode attributes: key values + extra attributes
  const partitionKeyDef = tableMeta.keySchema.find((k) => k.KeyType === "HASH");
  const sortKeyDef = tableMeta.keySchema.find((k) => k.KeyType === "RANGE");

  const [pkValue, setPkValue] = useState("");
  const [skValue, setSkValue] = useState("");
  const [customAttrs, setCustomAttrs] = useState<
    { name: string; type: string; value: string }[]
  >([]);

  // Delete table modal
  const [showDeleteTableModal, setShowDeleteTableModal] = useState(false);
  const [confirmDeleteTable, setConfirmDeleteTable] = useState("");

  const router = useRouter();

  // Reset form when opening create modal
  function openCreateModal() {
    setPkValue("");
    setSkValue("");
    setCustomAttrs([]);
    const initialJson: Record<string, any> = {};
    if (partitionKeyDef) initialJson[partitionKeyDef.AttributeName] = "";
    if (sortKeyDef) initialJson[sortKeyDef.AttributeName] = "";
    setJsonText(JSON.stringify(initialJson, null, 2));
    setError(null);
    setShowCreateModal(true);
  }

  // Add custom attribute field
  function addCustomAttribute() {
    setCustomAttrs((prev) => [...prev, { name: "", type: "S", value: "" }]);
  }

  function removeCustomAttribute(index: number) {
    setCustomAttrs((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCustomAttribute(
    index: number,
    field: "name" | "type" | "value",
    val: string
  ) {
    setCustomAttrs((prev) =>
      prev.map((attr, i) => (i === index ? { ...attr, [field]: val } : attr))
    );
  }

  // Save new item
  function handleSaveItem() {
    setError(null);
    let attributesToSave: { name: string; type: string; value: string }[] = [];

    if (createMode === "form") {
      if (!pkValue.trim() && partitionKeyDef) {
        setError(`Partition key (${partitionKeyDef.AttributeName}) is required.`);
        return;
      }
      if (sortKeyDef && !skValue.trim()) {
        setError(`Sort key (${sortKeyDef.AttributeName}) is required.`);
        return;
      }

      if (partitionKeyDef) {
        attributesToSave.push({
          name: partitionKeyDef.AttributeName,
          type: partitionKeyDef.AttributeType,
          value: pkValue.trim(),
        });
      }
      if (sortKeyDef) {
        attributesToSave.push({
          name: sortKeyDef.AttributeName,
          type: sortKeyDef.AttributeType,
          value: skValue.trim(),
        });
      }

      for (const attr of customAttrs) {
        if (!attr.name.trim()) continue;
        attributesToSave.push({
          name: attr.name.trim(),
          type: attr.type,
          value: attr.value,
        });
      }
    } else {
      // JSON mode
      try {
        const parsed = JSON.parse(jsonText);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          setError("Item must be a valid JSON object.");
          return;
        }

        if (partitionKeyDef && parsed[partitionKeyDef.AttributeName] === undefined) {
          setError(`JSON must include partition key "${partitionKeyDef.AttributeName}".`);
          return;
        }

        for (const [k, v] of Object.entries(parsed)) {
          let type = "S";
          let val = String(v);
          if (typeof v === "number") {
            type = "N";
            val = String(v);
          } else if (typeof v === "boolean") {
            type = "BOOL";
            val = String(v);
          } else if (v === null) {
            type = "NULL";
            val = "null";
          } else if (Array.isArray(v)) {
            type = "L";
            val = JSON.stringify(v);
          } else if (typeof v === "object") {
            type = "M";
            val = JSON.stringify(v);
          }
          attributesToSave.push({ name: k, type, value: val });
        }
      } catch (e) {
        setError("Invalid JSON format. Please check your syntax.");
        return;
      }
    }

    startTransition(async () => {
      const res = await putItem(tableMeta.name, attributesToSave);
      if (res && res.error) {
        setError(res.error);
      } else {
        setShowCreateModal(false);
        router.refresh();
      }
    });
  }

  // Delete selected item
  function handleDeleteSelectedItem() {
    if (selectedItemIndex === null) return;
    const item = items[selectedItemIndex];
    if (!item || !partitionKeyDef) return;

    const keys: { name: string; type: string; value: string }[] = [
      {
        name: partitionKeyDef.AttributeName,
        type: partitionKeyDef.AttributeType,
        value: String(item[partitionKeyDef.AttributeName]?.value ?? ""),
      },
    ];

    if (sortKeyDef) {
      keys.push({
        name: sortKeyDef.AttributeName,
        type: sortKeyDef.AttributeType,
        value: String(item[sortKeyDef.AttributeName]?.value ?? ""),
      });
    }

    startTransition(async () => {
      const res = await deleteItem(tableMeta.name, keys);
      if (res && res.error) {
        setError(res.error);
      } else {
        setSelectedItemIndex(null);
        router.refresh();
      }
    });
  }

  // Delete entire table
  function handleDeleteTable() {
    if (confirmDeleteTable !== "delete") return;
    startTransition(async () => {
      const res = await deleteTable(tableMeta.name);
      if (res && res.error) {
        setError(res.error);
      } else {
        router.push("/dynamodb");
      }
    });
  }

  // Extract all unique attribute names across scanned items
  const allAttributes = Array.from(
    new Set(
      items.flatMap((item) => Object.keys(item))
    )
  );

  // Order attributes: Partition key first, Sort key second, then others alphabetically
  const orderedAttributes: string[] = [];
  if (partitionKeyDef && allAttributes.includes(partitionKeyDef.AttributeName)) {
    orderedAttributes.push(partitionKeyDef.AttributeName);
  }
  if (sortKeyDef && allAttributes.includes(sortKeyDef.AttributeName)) {
    orderedAttributes.push(sortKeyDef.AttributeName);
  }
  allAttributes
    .filter((a) => !orderedAttributes.includes(a))
    .sort()
    .forEach((a) => orderedAttributes.push(a));

  // Filter items by search query
  const filteredItems = items.filter((item) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return Object.values(item).some((attr) =>
      String(attr.value).toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top breadcrumb & title banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[22px] font-bold text-[#16191f]">{tableMeta.name}</h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                tableMeta.status === "ACTIVE"
                  ? "bg-[#f2f8f0] text-[#1d8102]"
                  : "bg-[#fff8e7] text-[#9a6700]"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  tableMeta.status === "ACTIVE" ? "bg-[#1d8102]" : "bg-[#9a6700]"
                }`}
              />
              {tableMeta.status}
            </span>
          </div>
          <p className="text-[12px] text-[#545b64] font-mono">{tableMeta.arn}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setConfirmDeleteTable("");
              setShowDeleteTableModal(true);
            }}
            className="px-3 py-1.5 text-[13px] border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] rounded-sm font-normal"
          >
            Delete table
          </button>
          <Link
            href="/dynamodb"
            className="px-3 py-1.5 text-[13px] border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] rounded-sm font-normal"
          >
            Back to tables
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#fdf3f1] border border-[#d13212] rounded text-[13px] text-[#d13212]">
          {error}
        </div>
      )}

      {/* Tabs navigation */}
      <div className="border-b border-[#eaeded] flex gap-8 text-[14px]">
        <button
          onClick={() => setActiveTab("items")}
          className={`pb-2.5 font-medium border-b-2 transition-colors ${
            activeTab === "items"
              ? "border-[#0073bb] text-[#0073bb]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Explore items
        </button>
        <button
          onClick={() => setActiveTab("details")}
          className={`pb-2.5 font-medium border-b-2 transition-colors ${
            activeTab === "details"
              ? "border-[#0073bb] text-[#0073bb]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Table details
        </button>
      </div>

      {/* Tab 1: Explore items */}
      {activeTab === "items" && (
        <div className="space-y-4">
          {/* Action & search bar */}
          <div className="bg-white border border-[#d5dbdb] rounded p-4 awsui-shadow space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-[#16191f]">Scan results</span>
                <span className="text-[12px] text-[#545b64]">
                  ({filteredItems.length} {filteredItems.length === 1 ? "item" : "items"})
                </span>
                <div className="relative w-[280px]">
                  <svg
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#545b64]"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Filter items..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full border border-[#aab7b8] rounded pl-8 pr-2.5 py-[4px] text-[13px] text-[#16191f] placeholder-[#8d9ba8] focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.refresh()}
                  className="px-3 py-1.5 text-[13px] border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] rounded-sm font-normal"
                >
                  Run scan
                </button>
                <button
                  onClick={handleDeleteSelectedItem}
                  disabled={selectedItemIndex === null || isPending}
                  className={`px-3 py-1.5 text-[13px] border rounded-sm font-normal ${
                    selectedItemIndex !== null && !isPending
                      ? "border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
                      : "border-[#d5dbdb] text-[#aab7b8] cursor-not-allowed"
                  }`}
                >
                  Delete item
                </button>
                <button
                  onClick={openCreateModal}
                  className="px-3 py-1.5 text-[13px] bg-[#ec7211] text-white hover:bg-[#eb5f07] rounded-sm font-medium transition-colors"
                >
                  Create item
                </button>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto border border-[#eaeded] rounded">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                  <tr>
                    <th className="w-10 px-4 py-2.5">
                      <span className="sr-only">Select</span>
                    </th>
                    {orderedAttributes.map((attr) => {
                      const isPK = attr === partitionKeyDef?.AttributeName;
                      const isSK = attr === sortKeyDef?.AttributeName;
                      return (
                        <th key={attr} className="px-4 py-2.5 font-bold text-[#16191f]">
                          <div className="flex items-center gap-1.5">
                            <span>{attr}</span>
                            {isPK && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#f2f8fd] text-[#0073bb] border border-[#cbe2f2]">
                                Partition key
                              </span>
                            )}
                            {isSK && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
                                Sort key
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {filteredItems.map((item, rowIdx) => {
                    const isSelected = selectedItemIndex === rowIdx;
                    return (
                      <tr
                        key={rowIdx}
                        onClick={() =>
                          setSelectedItemIndex(isSelected ? null : rowIdx)
                        }
                        className={`hover:bg-[#f2f8fd] cursor-pointer transition-colors ${
                          isSelected ? "bg-[#f2f8fd]" : ""
                        }`}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="radio"
                            name="selectedItem"
                            checked={isSelected}
                            onChange={() =>
                              setSelectedItemIndex(isSelected ? null : rowIdx)
                            }
                            className="cursor-pointer text-[#0073bb] focus:ring-[#0073bb]"
                          />
                        </td>
                        {orderedAttributes.map((attr) => {
                          const cell = item[attr];
                          if (!cell) {
                            return (
                              <td key={attr} className="px-4 py-3 text-[#aab7b8]">
                                —
                              </td>
                            );
                          }
                          return (
                            <td key={attr} className="px-4 py-3">
                              <span className="text-[#16191f] font-mono text-[12px]">
                                {String(cell.value)}
                              </span>{" "}
                              <span className="text-[10px] text-[#545b64]">
                                ({cell.type})
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  {filteredItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={Math.max(1, orderedAttributes.length + 1)}
                        className="px-4 py-8 text-center text-[#545b64]"
                      >
                        {items.length === 0
                          ? "No items in this table yet. Click 'Create item' to add one."
                          : `No items match "${searchFilter}".`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Table details */}
      {activeTab === "details" && (
        <div className="space-y-6">
          {/* General Information */}
          <div className="bg-white border border-[#d5dbdb] rounded p-5 awsui-shadow space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f]">General information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[13px]">
              <div>
                <div className="text-[11px] text-[#545b64] uppercase font-bold mb-1">
                  Table Name
                </div>
                <div className="text-[#16191f] font-medium">{tableMeta.name}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#545b64] uppercase font-bold mb-1">
                  Table Status
                </div>
                <div className="text-[#1d8102] font-medium">{tableMeta.status}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#545b64] uppercase font-bold mb-1">
                  Capacity Mode
                </div>
                <div className="text-[#16191f]">{tableMeta.billingMode}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#545b64] uppercase font-bold mb-1">
                  Total Items
                </div>
                <div className="text-[#16191f] font-mono">
                  {tableMeta.itemCount.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#545b64] uppercase font-bold mb-1">
                  Table Size
                </div>
                <div className="text-[#16191f]">{formatBytes(tableMeta.sizeBytes)}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#545b64] uppercase font-bold mb-1">
                  Creation Time
                </div>
                <div className="text-[#16191f]">{tableMeta.creationDateTime}</div>
              </div>
            </div>
          </div>

          {/* Key Schema */}
          <div className="bg-white border border-[#d5dbdb] rounded p-5 awsui-shadow space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f]">Primary key</h2>
            <div className="border border-[#eaeded] rounded overflow-hidden">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-medium">
                  <tr>
                    <th className="px-4 py-2.5">Attribute Name</th>
                    <th className="px-4 py-2.5">Key Type</th>
                    <th className="px-4 py-2.5">Data Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {tableMeta.keySchema.map((key) => (
                    <tr key={key.AttributeName}>
                      <td className="px-4 py-3 font-mono text-[12px] text-[#16191f]">
                        {key.AttributeName}
                      </td>
                      <td className="px-4 py-3 text-[#16191f]">
                        {key.KeyType === "HASH" ? "Partition key" : "Sort key"}
                      </td>
                      <td className="px-4 py-3 text-[#545b64]">
                        {key.AttributeType === "S"
                          ? "String"
                          : key.AttributeType === "N"
                          ? "Number"
                          : key.AttributeType === "B"
                          ? "Binary"
                          : key.AttributeType}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Item Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-2xl max-w-[700px] w-full max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
              <div>
                <h3 className="text-[18px] font-bold text-[#16191f]">
                  Create item in {tableMeta.name}
                </h3>
                <p className="text-[12px] text-[#545b64]">
                  Define the primary key and optional attributes for this item.
                </p>
              </div>
              {/* Form / JSON switcher */}
              <div className="flex bg-[#f2f3f3] p-0.5 rounded text-[12px]">
                <button
                  type="button"
                  onClick={() => setCreateMode("form")}
                  className={`px-3 py-1 rounded transition-colors ${
                    createMode === "form"
                      ? "bg-white font-medium text-[#16191f] shadow-xs"
                      : "text-[#545b64] hover:text-[#16191f]"
                  }`}
                >
                  Form
                </button>
                <button
                  type="button"
                  onClick={() => setCreateMode("json")}
                  className={`px-3 py-1 rounded transition-colors ${
                    createMode === "json"
                      ? "bg-white font-medium text-[#16191f] shadow-xs"
                      : "text-[#545b64] hover:text-[#16191f]"
                  }`}
                >
                  JSON
                </button>
              </div>
            </div>

            {/* Modal content area */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {createMode === "form" ? (
                <div className="space-y-4">
                  {/* Partition key input */}
                  {partitionKeyDef && (
                    <div className="bg-[#f9fafb] border border-[#eaeded] rounded p-4">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[13px] font-bold text-[#16191f]">
                          {partitionKeyDef.AttributeName}{" "}
                          <span className="text-[#d13212]">*</span>
                        </label>
                        <span className="text-[11px] text-[#0073bb] font-medium bg-[#f2f8fd] px-2 py-0.5 rounded border border-[#cbe2f2]">
                          Partition Key ({partitionKeyDef.AttributeType === "S" ? "String" : partitionKeyDef.AttributeType === "N" ? "Number" : "Binary"})
                        </span>
                      </div>
                      <input
                        type="text"
                        value={pkValue}
                        onChange={(e) => setPkValue(e.target.value)}
                        placeholder={`Enter ${partitionKeyDef.AttributeName} value`}
                        className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
                      />
                    </div>
                  )}

                  {/* Sort key input if present */}
                  {sortKeyDef && (
                    <div className="bg-[#f9fafb] border border-[#eaeded] rounded p-4">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[13px] font-bold text-[#16191f]">
                          {sortKeyDef.AttributeName}{" "}
                          <span className="text-[#d13212]">*</span>
                        </label>
                        <span className="text-[11px] text-[#545b64] font-medium bg-[#f2f3f3] px-2 py-0.5 rounded border border-[#d5dbdb]">
                          Sort Key ({sortKeyDef.AttributeType === "S" ? "String" : sortKeyDef.AttributeType === "N" ? "Number" : "Binary"})
                        </span>
                      </div>
                      <input
                        type="text"
                        value={skValue}
                        onChange={(e) => setSkValue(e.target.value)}
                        placeholder={`Enter ${sortKeyDef.AttributeName} value`}
                        className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
                      />
                    </div>
                  )}

                  {/* Custom Attributes Section */}
                  <div className="pt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[13px] font-bold text-[#16191f]">
                        Attributes ({customAttrs.length})
                      </h4>
                      <button
                        type="button"
                        onClick={addCustomAttribute}
                        className="text-[12px] text-[#0073bb] hover:text-[#ec7211] font-medium flex items-center gap-1 hover:underline"
                      >
                        + Add new attribute
                      </button>
                    </div>

                    {customAttrs.map((attr, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-[1fr_120px_1fr_32px] gap-2 items-center"
                      >
                        <input
                          type="text"
                          placeholder="Attribute name"
                          value={attr.name}
                          onChange={(e) =>
                            updateCustomAttribute(idx, "name", e.target.value)
                          }
                          className="border border-[#aab7b8] rounded px-2.5 py-1 text-[13px] text-[#16191f] focus:outline-none focus:border-[#0073bb]"
                        />
                        <select
                          value={attr.type}
                          onChange={(e) =>
                            updateCustomAttribute(idx, "type", e.target.value)
                          }
                          className="border border-[#aab7b8] rounded px-2 py-1 text-[12px] text-[#16191f] bg-white focus:outline-none focus:border-[#0073bb]"
                        >
                          <option value="S">String</option>
                          <option value="N">Number</option>
                          <option value="BOOL">Boolean</option>
                          <option value="NULL">Null</option>
                          <option value="L">List</option>
                          <option value="M">Map</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Value"
                          value={attr.value}
                          onChange={(e) =>
                            updateCustomAttribute(idx, "value", e.target.value)
                          }
                          className="border border-[#aab7b8] rounded px-2.5 py-1 text-[13px] text-[#16191f] focus:outline-none focus:border-[#0073bb]"
                        />
                        <button
                          type="button"
                          onClick={() => removeCustomAttribute(idx)}
                          className="text-[#879596] hover:text-[#d13212] flex items-center justify-center p-1"
                          title="Remove attribute"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    ))}

                    {customAttrs.length === 0 && (
                      <p className="text-[12px] text-[#879596] italic">
                        No additional attributes added. Click &quot;+ Add new attribute&quot; to add fields.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* JSON Mode */
                <div className="space-y-2">
                  <label className="block text-[12px] text-[#545b64]">
                    Edit item JSON directly:
                  </label>
                  <textarea
                    rows={12}
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    className="w-full font-mono text-[13px] p-3 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb] bg-[#fafafa]"
                  />
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-3 border-t border-[#eaeded] flex items-center justify-end gap-2 bg-[#fafafa]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-1.5 text-[13px] border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                disabled={isPending}
                className="px-5 py-1.5 text-[13px] bg-[#ec7211] text-white rounded-sm font-medium hover:bg-[#eb5f07] transition-colors disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Table Modal */}
      {showDeleteTableModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl max-w-[500px] w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete table: {tableMeta.name}
            </h3>
            <p className="text-[13px] text-[#545b64] leading-relaxed">
              Are you sure you want to permanently delete table <strong>{tableMeta.name}</strong>?
              All stored items will be removed immediately.
            </p>
            <div>
              <label className="block text-[13px] font-medium text-[#16191f] mb-1">
                To confirm deletion, type <strong>delete</strong> in the box below:
              </label>
              <input
                type="text"
                value={confirmDeleteTable}
                onChange={(e) => setConfirmDeleteTable(e.target.value)}
                placeholder="delete"
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] focus:outline-none focus:border-[#d13212] focus:ring-1 focus:ring-[#d13212]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowDeleteTableModal(false)}
                className="px-4 py-1.5 text-[13px] border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTable}
                disabled={confirmDeleteTable !== "delete" || isPending}
                className={`px-4 py-1.5 text-[13px] text-white rounded-sm font-medium ${
                  confirmDeleteTable === "delete" && !isPending
                    ? "bg-[#d13212] hover:bg-[#b02a0f]"
                    : "bg-[#eaeded] text-[#aab7b8] cursor-not-allowed"
                }`}
              >
                {isPending ? "Deleting..." : "Delete table"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
