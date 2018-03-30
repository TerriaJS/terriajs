export interface WebMapServiceCatalogItem {
    readonly type: 'wms';
    readonly typeName: 'Web Map Service (WMS)';
    readonly typeDescription: 'One or more layers from a Open Geospatial Consortium (OGC) Web Map Service (WMS) server.';
    name: string;
    description: string;
    info: any;
    url: string;
    getCapabilitiesUrl: string;
}
