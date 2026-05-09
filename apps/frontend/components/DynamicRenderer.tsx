import React from "react";
import Form from "./Form";
import Table from "./Table";
import Dashboard from "./Dashboard";

type ComponentConfig = {
  type: string;
  table?: string;
  fields?: string[];
  children?: ComponentConfig[];
};

type Props = {
  config?: {
    ui?: ComponentConfig[];
  };
};

export default function DynamicRenderer({ config }: Props) {
  const registry: Record<string, React.ComponentType<any>> = {
    form: Form,
    table: Table,
    dashboard: Dashboard,
  };

  const renderComponent = (
    c: ComponentConfig,
    i: number
  ): React.ReactNode => {
    try {
      if (!c || typeof c !== "object") {
        return (
          <div key={i} style={{ color: "red" }}>
            Invalid component config
          </div>
        );
      }

      if (!c.type || typeof c.type !== "string") {
        return (
          <div key={i} style={{ color: "red" }}>
            Missing component type
          </div>
        );
      }

      const Comp = registry[c.type.toLowerCase()];

      if (!Comp) {
        return (
          <div key={i} style={{ color: "red" }}>
            Unknown component: {String(c.type)}
          </div>
        );
      }

      const props: any = {
        key: i,
      };

      if (typeof c.table === "string") {
        props.table = c.table;
      }

      if (Array.isArray(c.fields)) {
        props.fields = c.fields;
      }

      const renderedChildren = Array.isArray(c.children)
        ? c.children.map((child, idx) => renderComponent(child, idx))
        : null;

      if (c.type.toLowerCase() === "dashboard") {
        return (
          <div
            key={i}
            style={{
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          >
            <Comp {...props} />
            <div>{renderedChildren}</div>
          </div>
        );
      }

      return <Comp {...props}>{renderedChildren}</Comp>;
    } catch (error: any) {
      console.error("DynamicRenderer error:", error);

      return (
        <div key={i} style={{ color: "red", padding: "10px" }}>
          Error rendering component
        </div>
      );
    }
  };

  const ui = Array.isArray(config?.ui) ? config.ui : [];

  if (!ui.length) {
    return (
      <div style={{ padding: "20px", color: "orange" }}>
        No UI components found in config
      </div>
    );
  }

  return (
    <div>
      {ui.map((component, index) =>
        renderComponent(component, index)
      )}
    </div>
  );
}