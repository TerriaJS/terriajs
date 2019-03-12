import Model, { ModelInterface } from "../Models/Model";
import ModelTraits from "./ModelTraits";

export interface TraitOptions {
    name: string,
    description: string,
}

export default abstract class Trait {
    readonly id: string;
    readonly name: string;
    readonly description: string;

    constructor(id: string, options: TraitOptions) {
        this.id = id;
        this.name = options.name;
        this.description = options.description;
    }

    abstract getValue(strataTopToBottom: Model.StratumFromTraits<ModelTraits>[]): any;

    abstract fromJson<TTraits extends ModelTraits>(model: ModelInterface<TTraits>, stratumName: string, jsonValue: any): any;
}
