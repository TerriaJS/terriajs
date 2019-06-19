import ModelFactory from "./ModelFactory";
import { BaseModel } from "./Model";
import Terria from "./Terria";
import TerriaError from "../Core/TerriaError";
import updateModelFromJson from "./updateModelFromJson";

export default function upsertModelFromJson(
  factory: ModelFactory,
  terria: Terria,
  parentId: string,
  model: BaseModel | undefined,
  stratumName: string,
  json: any
): BaseModel {
  if (model === undefined) {
    let id = json.id;
    if (id === undefined) {
      const localId = json.localId || json.name;
      if (localId === undefined) {
        throw new TerriaError({
          title: "Missing property",
          message:
            "Model objects must have an `id`, `localId`, or `name` property."
        });
      }

      id = (parentId || "") + "/" + localId;
    }

    model = terria.getModelById(BaseModel, id);
    if (model === undefined) {
      model = factory.create(json.type, id, terria);
      if (model === undefined) {
        throw new TerriaError({
          title: "Unknown type",
          message: `Could not create unknown model type ${json.type}.`
        });
      }

      model.terria.addModel(model);
    }
  }

  updateModelFromJson(model, stratumName, json);

  return model;
}
