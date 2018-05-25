import ModelDefinition from './ModelDefinition';
import primitiveProperty from './primitiveProperty';

export interface InfoSection {
    name: string;
    content: string;
}

export default class CatalogMemberDefinition extends ModelDefinition {
    type: string;

    @primitiveProperty({
        type: 'string',
        name: 'Name',
        description: 'The name of the catalog item.',
        default: 'Unnamed'
    })
    name: string;

    @primitiveProperty({
        type: 'string',
        name: 'Description',
        description: 'The description of the catalog item. Markdown and HTML may be used.'
    })
    description: string;

    @primitiveProperty({
        type: 'string',
        name: 'Name in catalog',
        description: 'The name of the item to be displayed in the catalog, if it is different from the one to display on the workbench.'
    })
    nameInCatalog: string;

    @primitiveProperty({
        type: 'string',
        name: 'URL',
        description: 'The base URL of the WMS server.'
    })
    url: string;

    // @modelReferenceArrayProperty({
    //     name: 'Info',
    //     description: 'Human-readable information about this dataset.',
    //     idProperty: 'name'
    // })
    // info: InfoSection[];
}
