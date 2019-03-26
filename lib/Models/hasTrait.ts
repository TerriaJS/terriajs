import { InfoSectionTraits } from "../Traits/mixCatalogMemberTraits";
import ModelTraits from "../Traits/ModelTraits";
import TraitsConstructor from "../Traits/TraitsConstructor";
import WebMapServiceCatalogItemTraits from "../Traits/WebMapServiceCatalogItemTraits";
import ModelPropertiesFromTraits from "./ModelPropertiesFromTraits";

type HasGettableModelTrait<TTraits extends ModelTraits, Key extends keyof TTraits> = ModelPropertiesFromTraits<Pick<TTraits, Key>>;

type HasStratumTrait<TTraits extends ModelTraits, Key extends keyof TTraits> = {
    getTrait(stratumId: string, trait: Key): TTraits[Key] | undefined;
    setTrait(stratumId: string, trait: Key, value: TTraits[Key] | undefined): void;
};

type HasTrait<TTraits extends ModelTraits, Key extends keyof TTraits> = HasGettableModelTrait<TTraits, Key> & HasStratumTrait<TTraits, Key>;

/**
 * Determines if a model instance has a trait that matches the name and type of one defined in
 * a {@link ModelTraits} class.
 * 
 * @param model The model to check for presence of the trait.
 * @param TraitsClass The {@link ModelTraits} class containing the trait of interest.
 * @param trait1 The name of a trait of interest.
 * @param trait2 The name of a trait of interest.
 * @param trait3 The name of a trait of interest.
 * @param trait4 The name of a trait of interest.
 * @param trait5 The name of a trait of interest.
 * @returns True if the model contains traits matching the ones in `TraitsClass`; otherwise, false.
 *          Note that this function will return true for a matching name and type even if the model
 *          doesn't implement the particular traits class specified.
 */
export function hasTraits<TTraits extends ModelTraits, K1 extends keyof TTraits>(model: any, TraitsClass: TraitsConstructor<TTraits>, trait1: K1): model is HasTrait<TTraits, K1>;
export function hasTraits<TTraits extends ModelTraits, K1 extends keyof TTraits, K2 extends keyof TTraits>(model: any, TraitsClass: TraitsConstructor<TTraits>, trait1: K1, trait2: K2): model is HasTrait<TTraits, K1> & HasTrait<TTraits, K2>;
export function hasTraits<TTraits extends ModelTraits, K1 extends keyof TTraits, K2 extends keyof TTraits, K3 extends keyof TTraits>(model: any, TraitsClass: TraitsConstructor<TTraits>, trait1: K1, trait2: K2, trait3: K3): model is HasTrait<TTraits, K1> & HasTrait<TTraits, K2> & HasTrait<TTraits, K3>;
export function hasTraits<TTraits extends ModelTraits, K1 extends keyof TTraits, K2 extends keyof TTraits, K3 extends keyof TTraits, K4 extends keyof TTraits>(model: any, TraitsClass: TraitsConstructor<TTraits>, trait1: K1, trait2: K2, trait3: K3, trait4: K4): model is HasTrait<TTraits, K1> & HasTrait<TTraits, K2> & HasTrait<TTraits, K3> & HasTrait<TTraits, K4>;
export function hasTraits<TTraits extends ModelTraits, K1 extends keyof TTraits, K2 extends keyof TTraits, K3 extends keyof TTraits, K4 extends keyof TTraits, K5 extends keyof TTraits>(model: any, TraitsClass: TraitsConstructor<TTraits>, trait1: K1, trait2: K2, trait3: K3, trait4: K4, trait5: K5): model is HasTrait<TTraits, K1> & HasTrait<TTraits, K2> & HasTrait<TTraits, K3> & HasTrait<TTraits, K4> & HasTrait<TTraits, K5>;
export function hasTraits(model: any, TraitsClass: TraitsConstructor<ModelTraits>, ...traits: string[]): boolean {
    if (model === undefined || model.traits === undefined) {
        return false;
    }

    for (const trait of traits) {
        const modelTrait = model.traits[trait];
        const traitsTrait = TraitsClass.traits[trait];
    
        if (modelTrait === undefined || traitsTrait === undefined) {
            return false;
        }
        
        if (!traitsTrait.isSameType(modelTrait)) {
            return false;
        }
    }

    return true;
}

const model = {};
if (hasTraits(model, WebMapServiceCatalogItemTraits, 'opacity', 'layers', 'favoriteInfoSection', 'info')) {
    console.log(model.opacity);
    console.log(model.layers);
    console.log(model.favoriteInfoSection);
    const y = model.favoriteInfoSection;
    if (model.favoriteInfoSection) {
        console.log(model.favoriteInfoSection.content);
    }
    
    const infoSection = new InfoSectionTraits();
    infoSection.name = 'test';
    infoSection.content = 'bar';
    model.setTrait('user', 'favoriteInfoSection', infoSection);

    const info = model.getTrait('user', 'info');
    if (info) {
        info[0].content = 'test';
    }

    model.setTrait('user', 'opacity', 0.5);
    model.setTrait('user', 'layers', 'test');
}
