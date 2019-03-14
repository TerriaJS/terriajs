import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import Constructor from "../Core/Constructor";
import StratumFromTraits from "../ModelInterfaces/StratumFromTraits";
import ModelTraits from "../Traits/ModelTraits";
import Model, { TraitsConstructor } from "./Model";

export default function LoadableStratum<T extends TraitsConstructor<ModelTraits>>(Traits: T): Constructor<StratumFromTraits<InstanceType<T>>> {
    abstract class LoadableStratum {
    }

    // All traits return undefined by default, and throw if set.
    const traits = Traits.traits;
    Object.keys(traits).forEach(propertyName => {
        if (!(propertyName in Model.prototype)) {
            Object.defineProperty(Model.prototype, propertyName, {
                get: function(this: LoadableStratum) {
                    return undefined;
                },
                set: function(this: LoadableStratum) {
                    throw new DeveloperError('Traits of a LoadableStratum may not be set.');
                },
                enumerable: true,
                configurable: true
            });
        }
    });

    // The cast is necessary because TypeScript can't see that we've
    // manually defined all the necessary properties.
    return <any>LoadableStratum;
}
