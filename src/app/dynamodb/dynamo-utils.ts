/**
 * DynamoDB utility functions for marshalling and unmarshalling AttributeValues.
 */

import { AttributeValue } from "@aws-sdk/client-dynamodb";

// Convert AttributeValue to friendly JS value with type tag
export function unmarshalAttribute(attr: AttributeValue): { value: any; type: string } {
  if (attr.S !== undefined) return { value: attr.S, type: "String" };
  if (attr.N !== undefined) return { value: attr.N, type: "Number" };
  if (attr.BOOL !== undefined) return { value: String(attr.BOOL), type: "Boolean" };
  if (attr.NULL !== undefined) return { value: "null", type: "Null" };
  if (attr.SS !== undefined) return { value: attr.SS.join(", "), type: "String Set" };
  if (attr.NS !== undefined) return { value: attr.NS.join(", "), type: "Number Set" };
  if (attr.L !== undefined) {
    const list = attr.L.map((item) => unmarshalAttribute(item).value);
    return { value: JSON.stringify(list), type: "List" };
  }
  if (attr.M !== undefined) {
    const map: Record<string, any> = {};
    for (const [k, v] of Object.entries(attr.M)) {
      map[k] = unmarshalAttribute(v).value;
    }
    return { value: JSON.stringify(map), type: "Map" };
  }
  if (attr.B !== undefined) return { value: "<Binary>", type: "Binary" };
  return { value: "", type: "Unknown" };
}

// Marshal user input into AttributeValue
export function marshalAttribute(type: string, val: string): AttributeValue {
  switch (type) {
    case "N":
      return { N: val };
    case "BOOL":
      return { BOOL: val.toLowerCase() === "true" };
    case "NULL":
      return { NULL: true };
    case "L": {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) {
          return {
            L: parsed.map((item) =>
              marshalAttribute(typeof item === "number" ? "N" : "S", String(item))
            ),
          };
        }
      } catch { /* fallback */ }
      return { S: val };
    }
    case "M": {
      try {
        const parsed = JSON.parse(val);
        if (typeof parsed === "object" && parsed !== null) {
          const m: Record<string, AttributeValue> = {};
          for (const [k, v] of Object.entries(parsed)) {
            m[k] = marshalAttribute(typeof v === "number" ? "N" : "S", String(v));
          }
          return { M: m };
        }
      } catch { /* fallback */ }
      return { S: val };
    }
    case "S":
    default:
      return { S: val };
  }
}
