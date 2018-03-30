export default class ModelProperty {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly type: any;

    constructor(options) {
        this.id = options.id;
        this.name = options.name;
        this.description = options.description;
    }
}
