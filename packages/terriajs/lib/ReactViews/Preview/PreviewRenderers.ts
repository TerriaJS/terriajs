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
 * Register a custom preview renderer for the given catalog item type.
 *
 * Preview renderers, render the `About data` view.
 *
 * @param type Catalog item type
 * @param renderer Preview rendere component
 */
export function registerCustomPreviewRenderer(
  type: string,
  renderer: PreviewRendererType
) {
  runInAction(() => PreviewRenderers.set(type, renderer));
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
