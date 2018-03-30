import ModelProperty from './ModelProperty';
import { observable } from 'mobx';

interface PropertyBag {
    [propertyName: string]: ModelProperty;
}

interface ConstructorParameters {
    type: string;
    name: string;
    description?: string;
}

interface CreateInstanceParameters {
    loadable?: boolean;
    properties?: ModelProperty[];
}

export default class ModelDefinition {
    private readonly _properties: PropertyBag = {};
    readonly type: string;
    readonly name: string;
    readonly description?: string;

    constructor({
        type,
        name,
        description
    }: ConstructorParameters) {
        this.type = type;
        this.name = name;
        this.description = description;
    }

    addProperty(property: ModelProperty): void {
        this._properties[property.id] = property;
    }

    createInstance({
        loadable = false,
        properties = Object.keys(this.properties).map(key => this.properties[key])
    }: CreateInstanceParameters = {}): any {
        const instance: any = {};

        properties.forEach(property => {
            if (property && property.id) {
                if (this.properties[property.id] !== property) {
                    throw new Error(`Property ${property.id} does not exist in this definition.`);
                }
                instance[property.id] = undefined;
            }
        });

        if (loadable) {
            instance.isLoading = false;
            instance.loadPromise = undefined;
        }

        return observable(instance);
    }

    get properties(): Readonly<PropertyBag> {
        return this._properties;
    }
}
