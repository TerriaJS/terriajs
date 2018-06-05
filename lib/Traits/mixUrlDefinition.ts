import primitiveTrait from "./primitiveTrait";
import Constructor from "../Core/Constructor";
import ModelDefinition from "./ModelDefinition";

export default function mixUrlDefinition<TBase extends ModelDefinition.Constructor>(Base: TBase) {
    class UrlDefinition extends Base {
        @primitiveTrait({
            type: 'string',
            name: 'URL',
            description: 'The base URL of the file or service.'
        })
        url: string;
    }
    return UrlDefinition;
}
