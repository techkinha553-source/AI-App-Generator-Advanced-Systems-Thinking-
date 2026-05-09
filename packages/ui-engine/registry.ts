export type DynamicComponent = any;

class ComponentRegistry {
  private components: Record<string, DynamicComponent> = {};

  register(name: string, component: DynamicComponent) {
    if (!name || typeof name !== "string") {
      throw new Error("Component name must be a valid string");
    }

    if (!component) {
      throw new Error(`Invalid component provided for '${name}'`);
    }

    this.components[name] = component;
  }

  get(name: string) {
    return this.components[name];
  }

  has(name: string) {
    return Boolean(this.components[name]);
  }

  remove(name: string) {
    delete this.components[name];
  }

  getAll() {
    return this.components;
  }
}

export const registry = new ComponentRegistry();

export function registerComponent(
  name: string,
  component: DynamicComponent
) {
  registry.register(name, component);
}