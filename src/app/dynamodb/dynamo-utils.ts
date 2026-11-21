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

// Convert AttributeValue directly to plain JS primitive/object
export function attributeValueToPlain(attr: AttributeValue): any {
  if (attr.S !== undefined) return attr.S;
  if (attr.N !== undefined) {
    const num = Number(attr.N);
    return isNaN(num) ? attr.N : num;
  }
  if (attr.BOOL !== undefined) return attr.BOOL;
  if (attr.NULL !== undefined) return null;
  if (attr.SS !== undefined) return attr.SS;
  if (attr.NS !== undefined) return attr.NS.map(Number);
  if (attr.L !== undefined) return attr.L.map(attributeValueToPlain);
  if (attr.M !== undefined) {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(attr.M)) {
      res[k] = attributeValueToPlain(v);
    }
    return res;
  }
  if (attr.B !== undefined) return "<Binary>";
  return null;
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
            L: parsed.map((item) => plainToAttributeValue(item)),
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
            m[k] = plainToAttributeValue(v);
          }
          return { M: m };
        }
      } catch { /* fallback */ }
      return { S: val };
    }
    case "B":
      return { S: val };
    case "S":
    default:
      return { S: val };
  }
}

// Convert arbitrary plain JS value to AttributeValue
export function plainToAttributeValue(val: any): AttributeValue {
  if (typeof val === "string") return { S: val };
  if (typeof val === "number") return { N: String(val) };
  if (typeof val === "boolean") return { BOOL: val };
  if (val === null || val === undefined) return { NULL: true };
  if (Array.isArray(val)) {
    return { L: val.map(plainToAttributeValue) };
  }
  if (typeof val === "object") {
    const m: Record<string, AttributeValue> = {};
    for (const [k, v] of Object.entries(val)) {
      m[k] = plainToAttributeValue(v);
    }
    return { M: m };
  }
  return { S: String(val) };
}
