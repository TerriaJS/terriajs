import primitiveTrait from "../../lib/Traits/primitiveTrait";
import objectTrait from "../../lib/Traits/objectTrait";
import objectArrayTrait from "../../lib/Traits/objectArrayTrait";
import ModelTraits from "../../lib/Traits/ModelTraits";

class NestedTraits extends ModelTraits {
    @primitiveTrait({
        name: 'WithDefault',
        description: 'Description',
        type: 'number'
    })
    withDefault: number = 10;

    @primitiveTrait({
        name: 'WithoutDefault',
        description: 'Description',
        type: 'number'
    })
    withoutDefault?: number;
}

export default class TraitsForTesting extends ModelTraits {
    @primitiveTrait({
        name: 'WithDefault',
        description: 'Description',
        type: 'number'
    })
    withDefault: number = 10;

    @primitiveTrait({
        name: 'WithoutDefault',
        description: 'Description',
        type: 'number'
    })
    withoutDefault?: number;

    @objectTrait({
        name: 'NestedWithDefault',
        description: 'Description',
        type: NestedTraits
    })
    nestedWithDefault: NestedTraits = new NestedTraits();

    @objectTrait({
        name: 'NestedWithDefault',
        description: 'Description',
        type: NestedTraits
    })
    nestedWithoutDefault?: NestedTraits;

    @objectArrayTrait({
        name: 'NestedArrayWithDefault',
        description: 'Description',
        type: NestedTraits,
        idProperty: 'withDefault'
    })
    nestedArrayWithDefault: NestedTraits[] = [];

    @objectArrayTrait({
        name: 'NestedArrayWithoutDefault',
        description: 'Description',
        type: NestedTraits,
        idProperty: 'withDefault'
    })
    nestedArrayWithoutDefault?: NestedTraits[];
}
