import { computed, makeObservable, runInAction } from "mobx";
import MappableMixin from "../ModelMixins/MappableMixin";
import { BaseMapItem } from "../Models/BaseMaps/BaseMapsModel";
import Terria from "../Models/Terria";
import PreviewItem from "./PreviewViewer/PreviewItem";
import TerriaViewer from "./TerriaViewer";

export default class PreviewViewer extends TerriaViewer {
  /**
   * The previewed item
   */
  readonly previewed: MappableMixin.Instance | undefined;
  readonly previeweAdapter: PreviewItem | undefined;

  /**
   * True if the preview map is currently zoomed to the items extent, otherwise
   * it is zoomed to the home camera view.
   */
  get isZoomedToExtent() {
    return this.previeweAdapter?.isZoomedToExtent ?? false;
  }

  set isZoomedToExtent(value: boolean) {
    const previewAdapter = this.previeweAdapter;
    if (!previewAdapter) {
      return;
    }
    runInAction(() => {
      previewAdapter.isZoomedToExtent = value;
    });
  }

  /**
   * @param terria Terria instance
   * @param previewed A computed value that returns the previewed item
   */
  constructor(terria: Terria, previewed: MappableMixin.Instance | undefined) {
    const previewAdapter = previewed
      ? new PreviewItem(previewed, () => this.homeCamera)
      : undefined;

    super(
      terria,
      computed(() => (previewAdapter ? [previewAdapter] : []))
    );

    this.previewed = previewed;
    this.previeweAdapter = previewAdapter;
    makeObservable(this);
  }

  /**
   * Return the base map to use for the previewed item
   */
  @computed
  get previewBaseMap(): BaseMapItem | undefined {
    const terria = this.terria;
    const baseMapItems = terria.baseMapsModel.baseMapItems;

    const findBaseMapById = (id: string) =>
      baseMapItems.find((bm) => bm.item.uniqueId === id);

    let baseMap;
    if (this.previewed?.previewBaseMapId) {
      baseMap = findBaseMapById(this.previewed.previewBaseMapId);
    }

    if (!baseMap && terria.baseMapsModel.previewBaseMapId) {
      baseMap = findBaseMapById(terria.baseMapsModel.previewBaseMapId);
    }

    if (!baseMap) {
      baseMap = baseMapItems.length > 0 ? baseMapItems[0] : undefined;
    }

    return baseMap;
  }
}
