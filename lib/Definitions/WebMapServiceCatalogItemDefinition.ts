import ModelDefinition from './ModelDefinition';
import BooleanModelProperty from './BooleanModelProperty';
import InfoModelProperty from './InfoModelProperty';
import StringModelProperty from './StringModelProperty';

function property(target: any, propertyKey: string) {

}

abstract class WebMapServiceCatalogItemInterface {
    @property foo: string;
}

const def = new ModelDefinition({
    type: 'wms',
    name: 'Web Map Service (WMS)',
    description: 'One or more layers from a Open Geospatial Consortium (OGC) Web Map Service (WMS) server.'
});

def.addProperty(new StringModelProperty({
    id: 'name',
    name: 'Name',
    description: 'The name of this catalog item, to be displayed in the catalog and on the workbench.'
}));

def.addProperty(new StringModelProperty({
    id: 'description',
    name: 'Description',
    description: 'The description of this dataset, displayed to the user while browsing this dataset in the catalog.',
    markdown: true
}));

def.addProperty(new InfoModelProperty({
    id: 'info',
    name: 'Info',
    description: 'Additional information to display to the user while browsing this dataset in the catalog.'
}));

def.addProperty(new StringModelProperty({
    id: 'url',
    name: 'URL',
    description: 'The base URL of the WMS server.'
}));

def.addProperty(new StringModelProperty({
    id: 'getCapabilitiesUrl',
    name: 'GetCapabilities URL',
    description: 'The URL from which to request the WMS GetCapabilities document.'
}));

def.addProperty(new BooleanModelProperty({
    id: 'isGeoServer',
    name: 'Is GeoServer',
    description: 'True if the WMS server runs the GeoServer software.'
}));

const WebMapServiceCatalogItemDefinition = def;
export default WebMapServiceCatalogItemDefinition;
