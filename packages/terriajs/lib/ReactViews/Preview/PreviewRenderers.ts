import { observable, runInAction } from "mobx";
import { FC } from "react";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";

/**
 * Custom previewe renderer type
 */
export type PreviewRendererType = FC<{
  previewed: CatalogMemberMixin.Instance;
}>;

/**
 * Custom preview renderer registry.
 */
const PreviewRenderers = observable(new Map<string, PreviewRendererType>());

/**
 * Add a custom preview renderer for the given catalog item type.
 *
 * Preview renderers, render the `About data` view.
 *
 * @param type Catalog item type
 * @param renderer Preview renderer component
 */
export function addCustomPreviewRenderer(
  type: string,
  renderer: PreviewRendererType
) {
  runInAction(() => PreviewRenderers.set(type, renderer));
}

/**
 * Remove custom preview renderer for the given catalog item type.
 *
 * The type falls back to its built-in preview renderer.
 *
 * @param type Catalog item type
 * @returns `true` if a custom renderer was registered for the type, `false` otherwise.
 */
export function removeCustomPreviewRenderer(type: string): boolean {
  return runInAction(() => PreviewRenderers.delete(type));
}

/**
 * Get registered custom previewer renderer for the given catalog item type
 *
 * @param type Catalog item type
 * @returns Registered custom renderer or `undefined` if no custom renderer is registered for the type.
 */
export function getCustomPreviewRenderer(
  type: string
): PreviewRendererType | undefined {
  return PreviewRenderers.get(type);
}
