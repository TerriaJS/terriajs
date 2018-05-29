import primitiveProperty from "./primitiveProperty";
import Constructor from "../Core/Constructor";

export default function mixUrlDefinition<TBase extends Constructor<{}>>(Base: TBase) {
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
