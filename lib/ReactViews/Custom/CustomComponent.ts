import { ReactElement } from "react";
import TerriaFeature from "../../Models/Feature/Feature";
import { BaseModel } from "../../Models/Definition/Model";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";

/**
 * DomElement type from @types/domhandler
 */
export interface DomElement {
  attribs?: { [s: string]: string };
  children?: DomElement[];
  data?: any;
  name?: string;
  next?: DomElement;
  parent?: DomElement;
  prev?: DomElement;
  type?: string;
}

/**
 * The context for a transformation of custom components to React.
 * Note: these will need to be passed into appropriate function parameters
 * For example `parseCustomMarkdownToReact(someHtml, context)`
 * - where context: ProcessNodeContext
 */
export interface ProcessNodeContext {
  /**
   * The Terria instance for which this HTML is being processed.
   */
  readonly terria?: Terria;

  /**
   * The Terria instance for which this HTML is being processed.
   */
  readonly viewState?: ViewState;

  /**
   * The catalog item for which this HTML is being processed.
   */
  readonly catalogItem?: BaseModel;

  /**
   * The feature for which this HTML is being processed.
   */
  readonly feature?: TerriaFeature;
}

/**
 * A custom component type, e.g. `<chart>`.
 */
export default abstract class CustomComponent {
  /**
   * Gets the name of the DOM element for this custom component. For example,
   * if this custom component is derived from a `<chart>` tag, the name property's
   * value would be `"chart"`.
   */
  abstract get name(): string;

  /**
   * Gets the custom attributes for this tag, eg. ["src-preview"].
   * Used so that when the user-supplied html is sanitized, these attributes are not stripped.
   */
  abstract get attributes(): string[];

  /**
   * Determine if a given DOM node should be processed by this component. By
   * default, this method returns `true` if the node name matches the
   * {@link CustomComponent#name} property. If this method returns `true`,
   * {@link CustomComponent#processNode} will be called.
   *
   * @param context The context for the custom component
   * @param node The node that should possibly be processed.
   */
  shouldProcessNode(context: ProcessNodeContext, node: DomElement): boolean {
    return this.name === node.name;
  }

  /**
   * Transforms a DOM element into a React element. This function is passed to
   * to html-to-react's `processingInstructions`.
   *
   * @param context Context for the custom component.
   * @param node The DOM node to transformed to React.
   * @param children The already-transformed React elements that are this node's children.
   * @param index The index of this node in its parent's list of children.
   */
  abstract processNode(
    context: ProcessNodeContext,
    node: DomElement,
    children: ReactElement[],
    index: number
  ): ReactElement | undefined;

  private static readonly _types = new Map<string, CustomComponent>();

  /**
   * Registers a custom component.
   * @param component The component to register.
   */
  static register(component: CustomComponent) {
    this._types.set(component.name, component);
  }

  /**
   * Checks if a custom component with a given name is registered.
   * @param name The name of the custom component.
   * @returns True if the custom component is registered, otherwise false.
   */
  static isRegistered(name: string): boolean {
    return this._types.has(name);
  }

  /**
   * Gets the names of the registered custom components.
   */
  static get names(): string[] {
    return Array.from(this._types.keys());
  }

  /**
   * Gets the registered custom components.
   */
  static get values(): CustomComponent[] {
    return Array.from(this._types.values());
  }

  /**
   * Gets all attributes of all custom components.
   */
  static get attributes(): string[] {
    return this.values.reduce((p, c) => p.concat(c.attributes), [] as string[]);
  }
}
