import { z } from "astro/zod";

type JSONSchema = z.core.JSONSchema.JSONSchema;
type Field = Record<string, unknown>;

const humanize = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const typesOf = (schema: JSONSchema): string[] => {
  const type = Array.isArray(schema.type)
    ? schema.type
    : schema.type
      ? [schema.type]
      : [];
  return type.filter((value) => value !== "null");
};

const widgetFor = (
  prop: JSONSchema,
  types: string[],
  name: string
): Field => {
  if (prop.enum) {
    return {
      widget: "select",
      options: prop.enum.filter((value) => value !== null).map(String),
    };
  }
  if (prop.const !== undefined) return { widget: "hidden" };
  if (types.length !== 1) return { widget: "hidden" };

  switch (types[0]) {
    case "boolean":
      return { widget: "boolean" };
    case "integer":
      return { widget: "number", value_type: "int" };
    case "number":
      return { widget: "number", value_type: "float" };
    case "string":
      return { widget: "string" };
    case "object":
      return prop.properties
        ? { widget: "object", fields: decapFields(prop) }
        : { widget: "hidden" };
    case "array":
      return arrayWidget(prop, name);
    default:
      return { widget: "hidden" };
  }
};

const arrayItem = (prop: JSONSchema): JSONSchema | null => {
  if (prop.prefixItems) return null;
  const items = prop.items;
  if (!items || typeof items !== "object" || Array.isArray(items)) return null;
  return typesOf(items).length === 1 ? items : null;
};

const arrayWidget = (prop: JSONSchema, name: string): Field => {
  const items = arrayItem(prop);
  if (!items) return { widget: "hidden" };

  if (items.properties) {
    return { widget: "list", fields: decapFields(items) };
  }

  const child = widgetFor(items, typesOf(items), name);
  if (child.widget === "hidden") return { widget: "hidden" };

  return {
    widget: "list",
    field: {
      name: "value",
      ...child,
      ...(items.default !== undefined ? { default: items.default } : {}),
    },
  };
};

export const decapFields = (schema: JSONSchema): Field[] => {
  const required = new Set(schema.required ?? []);

  return Object.entries(schema.properties ?? {}).map(([name, raw]) => {
    if (typeof raw !== "object") {
      return { label: humanize(name), name, required: false, widget: "hidden" };
    }

    const types = typesOf(raw);
    const nullable = Array.isArray(raw.type) && raw.type.includes("null");
    const widget = widgetFor(raw, types, name);
    const visible = widget.widget !== "hidden";
    const base: Field = {
      label: humanize(name),
      name,
      ...(required.has(name) && !nullable && visible
        ? {}
        : { required: false }),
      ...(raw.default !== undefined ? { default: raw.default } : {}),
    };

    return { ...base, ...widget };
  });
};
