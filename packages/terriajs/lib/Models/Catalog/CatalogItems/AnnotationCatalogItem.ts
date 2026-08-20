import { action, computed, makeObservable } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
import VerticalOrigin from "terriajs-cesium/Source/Scene/VerticalOrigin";
import ConstantPositionProperty from "terriajs-cesium/Source/DataSources/ConstantPositionProperty";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import AnnotationCatalogItemTraits, {
  AnnotationTraits
} from "../../../Traits/TraitsClasses/AnnotationTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import { ModelConstructorParameters } from "../../Definition/Model";
import markerIcon from "../../../../wwwroot/images/map-pin.png";

export interface NewAnnotation {
  longitude: number;
  latitude: number;
  height?: number;
  title?: string;
  text?: string;
  open?: boolean;
}

/**
 * A catalog item holding a set of user-authored annotations - a marker plus rich
 * text placed at a point on the map. Annotations render as billboard entities (so
 * they work in both Leaflet 2D and Cesium 3D) and their HTML `text` is shown in the
 * feature info panel when the marker is clicked. Because the annotations are stored
 * as traits in the `user` stratum, they persist automatically in share links.
 */
export default class AnnotationCatalogItem extends MappableMixin(
  CatalogMemberMixin(CreateModel(AnnotationCatalogItemTraits))
) {
  static readonly type = "annotations";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return AnnotationCatalogItem.type;
  }

  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  @computed
  private get dataSource(): CustomDataSource {
    const dataSource = new CustomDataSource(this.name ?? "Annotations");
    for (const annotation of this.annotations) {
      if (
        !isDefined(annotation.id) ||
        !isDefined(annotation.longitude) ||
        !isDefined(annotation.latitude)
      ) {
        continue;
      }
      const entity = new Entity({
        id: annotation.id,
        name: annotation.title,
        position: new ConstantPositionProperty(
          Cartesian3.fromDegrees(
            annotation.longitude,
            annotation.latitude,
            annotation.height
          )
        ),
        description: annotation.text as any,
        billboard: {
          image: markerIcon,
          scale: 0.5,
          verticalOrigin: VerticalOrigin.BOTTOM,
          heightReference: isDefined(annotation.height)
            ? HeightReference.NONE
            : HeightReference.CLAMP_TO_GROUND
        } as any
      });
      dataSource.entities.add(entity);
    }
    return dataSource;
  }

  @computed
  get mapItems() {
    const dataSource = this.dataSource;
    dataSource.show = this.show;
    return [dataSource];
  }

  /** Returns a copy of the current annotations as stratum instances for the user stratum. */
  private cloneAnnotationsForUserStratum() {
    return this.annotations.map((annotation) =>
      createStratumInstance(AnnotationTraits, {
        id: annotation.id,
        longitude: annotation.longitude,
        latitude: annotation.latitude,
        height: annotation.height,
        title: annotation.title,
        text: annotation.text,
        open: annotation.open
      })
    );
  }

  /** Adds a new annotation and returns its generated id. */
  @action
  addAnnotation(annotation: NewAnnotation): string {
    const id = createGuid();
    const annotations = this.cloneAnnotationsForUserStratum();
    annotations.push(
      createStratumInstance(AnnotationTraits, {
        id,
        open: true,
        ...annotation
      })
    );
    this.setTrait(CommonStrata.user, "annotations", annotations);
    return id;
  }

  /** Updates the text (and optionally title) of an existing annotation. */
  @action
  updateAnnotation(
    id: string,
    changes: { text?: string; title?: string }
  ): void {
    const annotations = this.cloneAnnotationsForUserStratum();
    const match = annotations.find((annotation) => annotation.id === id);
    if (match) {
      if (isDefined(changes.text)) match.text = changes.text;
      if (isDefined(changes.title)) match.title = changes.title;
      this.setTrait(CommonStrata.user, "annotations", annotations);
    }
  }

  /** Opens or closes an annotation's floating popup. */
  @action
  setAnnotationOpen(id: string, open: boolean): void {
    const annotations = this.cloneAnnotationsForUserStratum();
    const match = annotations.find((annotation) => annotation.id === id);
    if (match) {
      match.open = open;
      this.setTrait(CommonStrata.user, "annotations", annotations);
    }
  }

  /** Toggles whether an annotation's floating popup is open. */
  @action
  toggleAnnotationOpen(id: string): void {
    const current = this.getAnnotation(id);
    if (current) {
      this.setAnnotationOpen(id, !current.open);
    }
  }

  /** Removes the annotation with the given id. */
  @action
  removeAnnotation(id: string): void {
    const annotations = this.cloneAnnotationsForUserStratum().filter(
      (annotation) => annotation.id !== id
    );
    this.setTrait(CommonStrata.user, "annotations", annotations);
  }

  /** Returns the annotation with the given id, if any. */
  getAnnotation(id: string): AnnotationTraits | undefined {
    return this.annotations.find((annotation) => annotation.id === id);
  }
}
