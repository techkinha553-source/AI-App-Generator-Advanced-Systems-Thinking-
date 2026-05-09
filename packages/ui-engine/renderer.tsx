import React from "react";
import { registry } from "./registry";

type RendererProps = {
  type: string;
  component: any;
  config: any;
  data?: any[];
  locale?: string;
};

function translate(value: any, locale: string) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return value?.[locale] || value?.en || Object.values(value)[0] || "";
  }

  return String(value);
}

export default function Renderer({
  type,
  component,
  config,
  data = [],
  locale = "en"
}: RendererProps) {
  const DynamicComponent = registry.get(type);

  if (!component || typeof component !== "object") {
    return (
      <div className="border border-yellow-400 bg-yellow-50 p-4 rounded-lg mt-4">
        Invalid component configuration
      </div>
    );
  }

  if (!DynamicComponent) {
    return (
      <div className="border border-red-400 bg-red-50 p-4 rounded-lg mt-4">
        <h3 className="font-semibold text-red-700">
          Unsupported Component
        </h3>

        <p className="text-sm text-red-600 mt-1">
          Component type: {type || "unknown"}
        </p>
      </div>
    );
  }

  try {
    return (
      <DynamicComponent
        component={{
          ...component,
          translatedTitle: translate(component?.title, locale)
        }}
        config={config}
        data={data}
        locale={locale}
        translate={translate}
      />
    );
  } catch (err) {
    console.error("RUNTIME RENDER ERROR:", err);

    return (
      <div className="border border-red-400 bg-red-50 p-4 rounded-lg mt-4">
        <h3 className="font-semibold text-red-700">
          Component Runtime Error
        </h3>

        <p className="text-sm text-red-600 mt-1">
          Failed to render component: {type}
        </p>
      </div>
    );
  }
}