import TerriaError from "../../Core/TerriaError";
import ReferenceMixin from "../../ModelMixins/ReferenceMixin";

/**
 * @experimental This interface is not stable and likely to change without preserving backwards
 * compatibility in following patch versions of TerriaJS.
 *
 * A CatalogProvider can provide extra functionality where many members in the catalog
 * are backed by a service with additional capabilities other than producing Terria catalog JSON
 *
 * This may include: login, search, ability to track members when they are moved, loading cached dynamic strata
 *
 *
 */
export default interface CatalogProvider {
  createLoadError(reference: ReferenceMixin.Instance): TerriaError;
  isProviderFor(reference: ReferenceMixin.Instance): boolean;
}
