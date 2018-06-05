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

    abstract getValue(model: any): any;
}
