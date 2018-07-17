import ModelTraits from "./ModelTraits";
import { ModelInterface } from "../Models/Model";

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

    abstract getValue(strataTopToBottom: Partial<ModelTraits>[]): any;

    abstract fromJson(jsonValue: any): any;
}
