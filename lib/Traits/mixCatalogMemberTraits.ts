import ModelTraits from './ModelTraits';
import primitiveTrait from './primitiveTrait';

export interface InfoSection {
    name: string;
    content: string;
}

export default function mixCatalogMemberTraits<TBase extends ModelTraits.Constructor>(Base: TBase) {
    class CatalogMemberTraits extends Base {
        @primitiveTrait({
            type: 'string',
            name: 'Name',
            description: 'The name of the catalog item.'
        })
        name: string;

        @primitiveTrait({
            type: 'string',
            name: 'Description',
            description: 'The description of the catalog item. Markdown and HTML may be used.'
        })
        description: string;

        @primitiveTrait({
            type: 'string',
            name: 'Name in catalog',
            description: 'The name of the item to be displayed in the catalog, if it is different from the one to display in the workbench.'
        })
        nameInCatalog: string;

        @primitiveTrait({
            type: 'string',
            name: 'Name in catalog',
            description: 'The name of the item to be displayed in the workbench, if it is different from the one to display in the catalog.'
        })
        nameInWorkbench: string;

        // @modelReferenceArrayProperty({
        //     name: 'Info',
        //     description: 'Human-readable information about this dataset.',
        //     idProperty: 'name'
        // })
        // info: InfoSection[];
    }

    return CatalogMemberTraits;
}
