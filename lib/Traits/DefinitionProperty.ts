export interface DefinitionPropertyOptions {
    name: string,
    description: string,
}

export default abstract class DefinitionProperty {
    readonly id: string;
    readonly name: string;
    readonly description: string;

    constructor(id: string, options: DefinitionPropertyOptions) {
        this.id = id;
        this.name = options.name;
        this.description = options.description;
    }

    abstract getValue(model: any): any;
}
