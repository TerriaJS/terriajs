import ModelTraits from "../Traits/ModelTraits";
import { BaseModel, TraitsConstructor } from "./Model";
import WithStrata from "../ModelInterfaces/WithStrata";
import WebMapServiceCatalogItemTraits from "../Traits/WebMapServiceCatalogItemTraits";
import StratumFromTraits from "../ModelInterfaces/StratumFromTraits";
import Trait from "../Traits/Trait";

type WithTrait<TTraits extends ModelTraits, Key extends keyof TTraits> = {
    [P in Key]: TTraits[P] | undefined;
};

type Narrowed<TTraits extends ModelTraits, Key extends keyof TTraits> = WithTrait<TTraits, Key> & WithStrata<WithTrait<TTraits, Key>>;

type TFoo = ReturnType<typeof BaseModel.prototype.getOrCreateStratum>;

interface GetOrCreateStratum<T> {
    getOrCreateStratum(id: string): T;
    readonly traits: {
        [id: string]: Trait;
    }
}

/**
 * Determines if a model instance has a trait that matches the name and type of one defined in
 * a {@link ModelTraits} class.
 * 
 * @param TraitsClass The {@link ModelTraits} class containing the trait of interest.
 * @param traitName The name of the trait of interest.
 * @param model The model to check for presence of the trait.
 * @returns True if the model contains a trait matching the one in `TraitsClass`; otherwise, false.
 *          Note that this function will return true for a matching name and type even if the model
 *          doesn't implement the particular traits class specified.
 */
function hasTrait<TTraits extends ModelTraits, Key extends keyof TTraits, TStratum, TModel extends GetOrCreateStratum<TStratum>>(
    TraitsClass: TraitsConstructor<TTraits>,
    traitName: string & Key,
    model: TModel
): model is GetOrCreateStratum<TStratum & StratumFromTraits<WithTrait<TTraits, Key>>> & TModel {
    if (model === undefined || model.traits === undefined) {
        return false;
    }

    const modelTrait = model.traits[traitName];
    const traitsTrait = TraitsClass.traits[traitName];

    if (modelTrait === undefined || traitsTrait === undefined) {
        return false;
    }

    return traitsTrait.isSameType(modelTrait);
}

// export function anyHasTrait<TTraits extends ModelTraits, Key extends keyof TTraits, TModel extends BaseModel>(
//     TraitsClass: TraitsConstructor<TTraits>,
//     traitName: string & Key,
//     model: any
// ): model is Narrowed<TTraits, Key> {
//     if (model === undefined || model.traits === undefined) {
//         return false;
//     }

//     const modelTrait = model.traits[traitName];
//     const traitsTrait = TraitsClass.traits[traitName];

//     if (modelTrait === undefined || traitsTrait === undefined) {
//         return false;
//     }

//     return traitsTrait.isSameType(modelTrait);
// }

export default hasTrait;

// Trait is nullable, model really is not => who cares?
// Trait is not nullable (because it has a default), but model actually uses a similar trait that is nullable => oh no!

const x: BaseModel = <any>{};
if (hasTrait(WebMapServiceCatalogItemTraits, 'opacity', x)) {
    const a = x;
    x.getOrCreateStratum('user').opacity = 0.4;
    const z = x;
    if (hasTrait(WebMapServiceCatalogItemTraits, 'layers', z)) {
        const b = x;
        const y: WithTrait<WebMapServiceCatalogItemTraits, 'layers'> &
            WithTrait<WebMapServiceCatalogItemTraits, 'opacity'> &
            WithStrata<WithTrait<WebMapServiceCatalogItemTraits, 'opacity'> & WithTrait<WebMapServiceCatalogItemTraits, 'layers'>> = x;
        console.log(y.opacity);
        console.log(y.layers);
        let q = x.getOrCreateStratum;
        let r = y.getOrCreateStratum;
        q = r;
        r = q;
        q.call(x, 'user').opacity = 0.5;
        r.call(x, 'user').opacity = 0.5;

        x.getOrCreateStratum('user').opacity = 0.4;
        x.getOrCreateStratum('user').layers = 'test';
    }
}

const y: any = {};
if (hasTrait(WebMapServiceCatalogItemTraits, 'opacity', y)) {
    console.log(y);
}


// interface One {
//     getThing(): { one: number };
// }

// interface Two {
//     getThing(): { two: number };
// }

// class Both implements One, Two {
//     getThing(): { one: number } {
//         return {
//             one: 1,
//             two: 2
//         };
//     }
// }

// const b = new Both();
// const thing: { one: number, two: number } = b.getThing();
// const bAs: One & Two = b;
// const thingAs: { one: number, two: number } = bAs.getThing();
