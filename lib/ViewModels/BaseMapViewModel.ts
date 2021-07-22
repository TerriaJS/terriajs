import { observable } from "mobx";
import MappableMixin from "../ModelMixins/MappableMixin";

export class BaseMapViewModel {
  @observable mappable: MappableMixin.Instance;
  @observable image: string | undefined;

  constructor(mappable: MappableMixin.Instance, image?: string) {
    this.mappable = mappable;
    this.image = image;
  }
}
