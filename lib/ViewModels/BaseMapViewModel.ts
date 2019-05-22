import { observable } from "mobx";
import Mappable from "../Models/Mappable";

export class BaseMapViewModel {
  @observable mappable: Mappable;
  @observable image: string | undefined;

  constructor(mappable: Mappable, image?: string) {
    this.mappable = mappable;
    this.image = image;
  }
}
