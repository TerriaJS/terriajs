import { observable } from "mobx";
import MappableMixin from "../ModelMixins/MappableMixin";

export class BaseMapViewModel {
  @observable mappable: MappableMixin.MappableMixin;
  @observable image: string | undefined;

  constructor(mappable: MappableMixin.MappableMixin, image?: string) {
    this.mappable = mappable;
    this.image = image;
  }
}
