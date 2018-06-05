import primitiveProperty from "./primitiveProperty";
import Constructor from "../Core/Constructor";
import ModelDefinition from "./ModelDefinition";

export default function mixUrlDefinition<TBase extends ModelDefinition.Constructor>(Base: TBase) {
    class UrlDefinition extends Base {
        @primitiveProperty({
            type: 'string',
            name: 'URL',
            description: 'The base URL of the file or service.'
        })
        url: string;
    }
    return UrlDefinition;
}
