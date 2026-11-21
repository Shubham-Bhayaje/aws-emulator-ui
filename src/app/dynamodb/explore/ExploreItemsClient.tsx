"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TableSummary, TableDetail, ScannedItem } from "../types";
import {
  getTableDetailAction,
  scanTableAction,
  queryTableAction,
  putItemAction,
  deleteItemAction,
} from "../actions";

interface ExploreItemsClientProps {
  tables: TableSummary[];
  initialSelectedTable?: string;
}

export default function ExploreItemsClient({
  tables,
  initialSelectedTable,
}: ExploreItemsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTableFromUrl = searchParams.get("table") || initialSelectedTable || tables[0]?.name || "";

  const [selectedTableName, setSelectedTableName] = useState<string>(initialTableFromUrl);
  const [tableDetail, setTableDetail] = useState<TableDetail | null>(null);
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Scan vs Query
  const [operationType, setOperationType] = useState<"scan" | "query">("scan");
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  // Query expressions
  const [queryPartitionValue, setQueryPartitionValue] = useState("");
  const [querySortOperator, setQuerySortOperator] = useState<"=" | "<" | "<=" | ">" | ">=" | "begins_with">("=");
  const [querySortValue, setQuerySortValue] = useState("");

  // Create/Edit Item Modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemModalMode, setItemModalMode] = useState<"create" | "edit">("create");
  const [itemInputFormat, setItemInputFormat] = useState<"form" | "json">("form");
  const [itemAttributes, setItemAttributes] = useState<{ name: string; type: string; value: string }[]>([]);
  const [itemJsonText, setItemJsonText] = useState("");

  // Load table details and initial items when table selection changes
  useEffect(() => {
    if (!selectedTableName) return;
    setError(null);
    startTransition(async () => {
      const [detailRes, scanRes] = await Promise.all([
        getTableDetailAction(selectedTableName),
        scanTableAction({ tableName: selectedTableName, limit: 100 }),
      ]);
      if (detailRes.table) {
        setTableDetail(detailRes.table);
      }
      if (!scanRes.error) {
        setItems(scanRes.items);
      }
      setSelectedItemIndex(null);
    });
  }, [selectedTableName]);

  // Discovered attributes for dynamic columns
  const discoveredColumns = useMemo(() => {
    if (!tableDetail) return [];
    const colSet = new Set<string>();
    colSet.add(tableDetail.partitionKey);
    if (tableDetail.sortKey) colSet.add(tableDetail.sortKey);

    for (const item of items) {
      for (const k of Object.keys(item)) {
        colSet.add(k);
      }
    }
    return Array.from(colSet);
  }, [items, tableDetail]);

  function handleRun() {
    if (!selectedTableName) return;
    setError(null);

    startTransition(async () => {
      if (operationType === "scan") {
        const res = await scanTableAction({ tableName: selectedTableName, limit: 100 });
        if (res.error) {
          setError(res.error);
        } else {
          setItems(res.items);
          setSelectedItemIndex(null);
        }
      } else {
        if (!tableDetail) return;
        if (!queryPartitionValue.trim()) {
          setError("Partition key value is required for query.");
          return;
        }

        let expr = `#pk = :pv`;
        const names: Record<string, string> = { "#pk": tableDetail.partitionKey };
        const values: Record<string, any> = { ":pv": queryPartitionValue.trim() };

        if (tableDetail.sortKey && querySortValue.trim()) {
          names["#sk"] = tableDetail.sortKey;
          if (querySortOperator === "begins_with") {
            expr += ` AND begins_with(#sk, :sv)`;
            values[":sv"] = querySortValue.trim();
          } else {
            expr += ` AND #sk ${querySortOperator} :sv`;
            values[":sv"] = querySortValue.trim();
          }
        }

        const res = await queryTableAction({
          tableName: selectedTableName,
          keyConditionExpression: expr,
          expressionAttributeNames: names,
          expressionAttributeValues: values,
        });

        if (res.error) {
          setError(res.error);
        } else {
          setItems(res.items);
          setSelectedItemIndex(null);
        }
      }
    });
  }

  function handleOpenCreateItem() {
    if (!tableDetail) return;
    setItemModalMode("create");
    setItemInputFormat("form");
    const initialAttrs = [
      { name: tableDetail.partitionKey, type: tableDetail.partitionKeyType, value: "" },
    ];
    if (tableDetail.sortKey) {
      initialAttrs.push({ name: tableDetail.sortKey, type: tableDetail.sortKeyType || "S", value: "" });
    }
    setItemAttributes(initialAttrs);

    const initJson: Record<string, any> = {
      [tableDetail.partitionKey]: tableDetail.partitionKeyType === "N" ? 0 : "",
    };
    if (tableDetail.sortKey) {
      initJson[tableDetail.sortKey] = tableDetail.sortKeyType === "N" ? 0 : "";
    }
    setItemJsonText(JSON.stringify(initJson, null, 2));
    setShowItemModal(true);
  }

  function handleOpenEditItem() {
    if (selectedItemIndex === null || !items[selectedItemIndex]) return;
    setItemModalMode("edit");
    setItemInputFormat("form");

    const sel = items[selectedItemIndex];
    const attrs: { name: string; type: string; value: string }[] = [];
    const jsonObj: Record<string, any> = {};

    for (const [k, v] of Object.entries(sel)) {
      attrs.push({ name: k, type: v.type, value: String(v.value) });
      jsonObj[k] = v.value;
    }

    setItemAttributes(attrs);
    setItemJsonText(JSON.stringify(jsonObj, null, 2));
    setShowItemModal(true);
  }

  function handleSaveItem() {
    if (!selectedTableName) return;
    setError(null);
    startTransition(async () => {
      let res;
      if (itemInputFormat === "form") {
        res = await putItemAction(selectedTableName, itemAttributes);
      } else {
        try {
          const parsed = JSON.parse(itemJsonText);
          res = await putItemAction(selectedTableName, parsed);
        } catch {
          setError("Invalid JSON syntax.");
          return;
        }
      }

      if (res.success) {
        setShowItemModal(false);
        setSuccessBanner("Item saved successfully.");
        const scanRes = await scanTableAction({ tableName: selectedTableName, limit: 100 });
        if (!scanRes.error) setItems(scanRes.items);
      } else {
        setError(res.error || "Failed to save item.");
      }
    });
  }

  function handleDeleteItem() {
    if (!tableDetail || selectedItemIndex === null || !items[selectedItemIndex]) return;
    const sel = items[selectedItemIndex];

    const keys: { name: string; type: string; value: string }[] = [
      {
        name: tableDetail.partitionKey,
        type: sel[tableDetail.partitionKey]?.type || tableDetail.partitionKeyType,
        value: String(sel[tableDetail.partitionKey]?.value),
      },
    ];

    if (tableDetail.sortKey && sel[tableDetail.sortKey]) {
      keys.push({
        name: tableDetail.sortKey,
        type: sel[tableDetail.sortKey]?.type || tableDetail.sortKeyType || "S",
        value: String(sel[tableDetail.sortKey]?.value),
      });
    }

    startTransition(async () => {
      const res = await deleteItemAction(selectedTableName, keys);
      if (res.success) {
        setSuccessBanner("Item deleted successfully.");
        setSelectedItemIndex(null);
        const scanRes = await scanTableAction({ tableName: selectedTableName, limit: 100 });
        if (!scanRes.error) setItems(scanRes.items);
      } else {
        setError(res.error || "Failed to delete item.");
      }
    });
  }

  if (tables.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">Explore items</h1>
          <p className="text-[14px] text-[#545b64] mt-0.5">
            Query and scan data stored in your Amazon DynamoDB tables.
          </p>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-12 text-center space-y-4 shadow-sm max-w-xl mx-auto">
          <h2 className="text-[18px] font-bold text-[#16191f]">No tables found</h2>
          <p className="text-[13px] text-[#545b64]">
            You do not have any DynamoDB tables in this Region. Create a table to start adding and exploring items.
          </p>
          <div>
            <Link
              href="/dynamodb/tables/create"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
            >
              Create table
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-[24px] font-bold text-[#16191f]">Explore items</h1>
        <p className="text-[14px] text-[#545b64] mt-0.5">
          Scan and query items across your tables in this Region.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#fdf2f2] border-l-4 border-[#d13212] text-[13px] text-[#d13212] rounded flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold">&times;</button>
        </div>
      )}
      {successBanner && (
        <div className="p-3 bg-[#edf7ed] border-l-4 border-[#1d8102] text-[13px] text-[#1d8102] rounded flex justify-between items-center">
          <span>{successBanner}</span>
          <button onClick={() => setSuccessBanner(null)} className="font-bold">&times;</button>
        </div>
      )}

      {/* Table Selector & Search Parameters */}
      <div className="bg-white border border-[#eaeded] rounded p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#eaeded] pb-4">
          <div className="flex-1 max-w-md">
            <label className="block text-[12px] font-bold text-[#16191f] mb-1">
              Select table
            </label>
            <select
              value={selectedTableName}
              onChange={(e) => setSelectedTableName(e.target.value)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              className="w-full px-3 text-[13px] border border-[#eaeded] rounded bg-white focus:outline-none focus:border-[#ec7211]"
            >
              {tables.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name} ({t.itemCount} items)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 pt-4 sm:pt-0">
            <label className="flex items-center gap-1.5 cursor-pointer text-[13px] font-bold text-[#16191f]">
              <input
                type="radio"
                name="globalOpType"
                checked={operationType === "scan"}
                onChange={() => setOperationType("scan")}
                className="text-[#ec7211] focus:ring-[#ec7211]"
              />
              <span>Scan</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[13px] font-bold text-[#16191f]">
              <input
                type="radio"
                name="globalOpType"
                checked={operationType === "query"}
                onChange={() => setOperationType("query")}
                className="text-[#ec7211] focus:ring-[#ec7211]"
              />
              <span>Query</span>
            </label>
            <button
              onClick={handleRun}
              disabled={isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-4 text-[13px] font-bold rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
            >
              {isPending ? "Running..." : "Run"}
            </button>
          </div>
        </div>

        {/* Query Builder */}
        {operationType === "query" && tableDetail && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-[12px] font-bold text-[#16191f]">
                {tableDetail.partitionKey} (Partition key) <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="text"
                placeholder="Partition key value"
                value={queryPartitionValue}
                onChange={(e) => setQueryPartitionValue(e.target.value)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211] mt-1"
              />
            </div>

            {tableDetail.sortKey && (
              <>
                <div>
                  <label className="block text-[12px] font-bold text-[#16191f]">
                    {tableDetail.sortKey} Condition
                  </label>
                  <select
                    value={querySortOperator}
                    onChange={(e) => setQuerySortOperator(e.target.value as any)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    className="w-full px-3 text-[13px] border border-[#eaeded] rounded bg-white mt-1"
                  >
                    <option value="=">=</option>
                    <option value="<">&lt;</option>
                    <option value="<=">&le;</option>
                    <option value=">">&gt;</option>
                    <option value=">=">&ge;</option>
                    <option value="begins_with">begins_with</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#16191f]">
                    {tableDetail.sortKey} Value
                  </label>
                  <input
                    type="text"
                    placeholder="Optional sort key value"
                    value={querySortValue}
                    onChange={(e) => setQuerySortValue(e.target.value)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    className="w-full px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211] mt-1"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Items Table Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#eaeded] flex items-center justify-between">
          <div className="text-[14px] font-bold text-[#16191f]">
            Items returned ({items.length})
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreateItem}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 text-[13px] font-bold rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
            >
              Create item
            </button>
            <button
              onClick={handleOpenEditItem}
              disabled={selectedItemIndex === null}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`px-3 text-[13px] font-bold rounded border ${
                selectedItemIndex !== null
                  ? "border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
                  : "border-[#eaeded] text-[#879596] cursor-not-allowed bg-[#fafafa]"
              }`}
            >
              Edit item
            </button>
            <button
              onClick={handleDeleteItem}
              disabled={selectedItemIndex === null || isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`px-3 text-[13px] font-bold rounded border ${
                selectedItemIndex !== null
                  ? "border-[#d13212] text-[#d13212] hover:bg-[#fdf2f2]"
                  : "border-[#eaeded] text-[#879596] cursor-not-allowed bg-[#fafafa]"
              }`}
            >
              Delete item
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center text-[#545b64] text-[13px]">
            No items found.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#fafafa] text-[#545b64] border-b border-[#eaeded] font-bold uppercase text-[11px] tracking-wider sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 w-10"></th>
                  {discoveredColumns.map((col) => (
                    <th key={col} className="px-4 py-3 whitespace-nowrap">
                      {col}
                      {col === tableDetail?.partitionKey && <span className="text-[#ec7211] ml-1">(Partition)</span>}
                      {col === tableDetail?.sortKey && <span className="text-[#0073bb] ml-1">(Sort)</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {items.map((item, idx) => {
                  const isSelected = selectedItemIndex === idx;
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedItemIndex(idx)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="radio"
                          name="globalSelected"
                          checked={isSelected}
                          onChange={() => setSelectedItemIndex(idx)}
                          className="h-4 w-4 text-[#ec7211] border-[#d5dbdb] focus:ring-[#ec7211]"
                        />
                      </td>
                      {discoveredColumns.map((col) => {
                        const valObj = item[col];
                        return (
                          <td key={col} className="px-4 py-3 font-mono text-[12px] text-[#16191f] max-w-xs truncate">
                            {valObj ? String(valObj.value) : <span className="text-[#879596] font-sans">–</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Item Modal */}
      {showItemModal && tableDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[18px] font-bold text-[#16191f]">
                {itemModalMode === "create" ? "Create item" : "Edit item"}
              </h3>
              <div className="flex items-center gap-2 border border-[#eaeded] rounded p-0.5 text-[12px]">
                <button
                  type="button"
                  onClick={() => setItemInputFormat("form")}
                  className={`px-3 py-1 font-bold rounded ${itemInputFormat === "form" ? "bg-[#ec7211] text-white" : "text-[#545b64]"}`}
                >
                  Form
                </button>
                <button
                  type="button"
                  onClick={() => setItemInputFormat("json")}
                  className={`px-3 py-1 font-bold rounded ${itemInputFormat === "json" ? "bg-[#ec7211] text-white" : "text-[#545b64]"}`}
                >
                  JSON
                </button>
              </div>
            </div>

            {itemInputFormat === "form" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#16191f]">Attributes</span>
                  <button
                    type="button"
                    onClick={() => setItemAttributes([...itemAttributes, { name: "", type: "S", value: "" }])}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="px-2.5 text-[12px] font-bold rounded border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
                  >
                    Add new attribute
                  </button>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {itemAttributes.map((attr, idx) => {
                    const isKey = attr.name === tableDetail.partitionKey || attr.name === tableDetail.sortKey;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Attribute name"
                          value={attr.name}
                          disabled={isKey && itemModalMode === "edit"}
                          onChange={(e) => {
                            const updated = [...itemAttributes];
                            updated[idx].name = e.target.value;
                            setItemAttributes(updated);
                          }}
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                          className="w-1/3 px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211] disabled:bg-[#fafafa]"
                        />
                        <select
                          value={attr.type}
                          disabled={isKey && itemModalMode === "edit"}
                          onChange={(e) => {
                            const updated = [...itemAttributes];
                            updated[idx].type = e.target.value;
                            setItemAttributes(updated);
                          }}
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                          className="w-28 px-2 text-[13px] border border-[#eaeded] rounded bg-white focus:outline-none focus:border-[#ec7211] disabled:bg-[#fafafa]"
                        >
                          <option value="S">String</option>
                          <option value="N">Number</option>
                          <option value="BOOL">Boolean</option>
                          <option value="NULL">Null</option>
                          <option value="B">Binary</option>
                          <option value="L">List</option>
                          <option value="M">Map</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Value"
                          value={attr.value}
                          onChange={(e) => {
                            const updated = [...itemAttributes];
                            updated[idx].value = e.target.value;
                            setItemAttributes(updated);
                          }}
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                          className="flex-1 px-3 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
                        />
                        {!isKey && (
                          <button
                            type="button"
                            onClick={() => setItemAttributes(itemAttributes.filter((_, i) => i !== idx))}
                            className="p-1 text-[#d13212] hover:bg-[#fdf2f2] rounded"
                            title="Remove attribute"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-[12px] font-bold text-[#16191f]">
                  Raw JSON Payload
                </label>
                <textarea
                  rows={10}
                  value={itemJsonText}
                  onChange={(e) => setItemJsonText(e.target.value)}
                  className="w-full p-3 font-mono text-[12px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211]"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-6 text-[13px] font-bold rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                {isPending ? "Saving..." : "Save item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
