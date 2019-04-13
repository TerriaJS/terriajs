import { createTransformer } from 'mobx-utils';
import defined from 'terriajs-cesium/Source/Core/defined';
import xml2json from '../ThirdParty/xml2json';
import loadXML from '../Core/loadXML';
import TerriaError from '../Core/TerriaError';
import isReadOnlyArray from '../Core/isReadOnlyArray';
import Rectangle from 'terriajs-cesium/Source/Core/Rectangle';
import StratumFromTraits from './StratumFromTraits';
import { RectangleTraits } from '../Traits/MappableTraits';


export interface OnlineResource {
    'xlink:type': string;
    'xlink:href': string;
}

export interface CapabilitiesLegend {
    readonly OnlineResource?: OnlineResource;
    readonly Format?: string;
    readonly width?: number;
    readonly height?: number;
}

export interface CapabilitiesStyle {
    readonly Name: string;
    readonly Title: string;
    readonly Abstract?: string;
    readonly LegendURL?: CapabilitiesLegend | ReadonlyArray<CapabilitiesLegend>;
}

export interface CapabilitiesGeographicBoundingBox {
    readonly westBoundLongitude: number;
    readonly southBoundLatitude: number;
    readonly eastBoundLongitude: number;
    readonly northBoundLatitude: number;
}

export interface CapabilitiesLatLonBoundingBox {
    readonly minx: number;
    readonly miny: number;
    readonly maxx: number;
    readonly maxy: number;
}

export interface CapabilitiesLayer {
    readonly _parent?: CapabilitiesLayer;
    readonly Name?: string;
    readonly Title: string;
    readonly Abstract?: string;
    readonly EX_GeographicBoundingBox?: CapabilitiesGeographicBoundingBox; // WMS 1.3.0
    readonly LatLonBoundingBox?: CapabilitiesLatLonBoundingBox; // WMS 1.0.0-1.1.1
    readonly Style?: CapabilitiesStyle | ReadonlyArray<CapabilitiesStyle>;
    readonly Layer?: CapabilitiesLayer | ReadonlyArray<CapabilitiesLayer>;
}

export interface CapabilitiesService {
    readonly Abstract?: string;
    readonly AccessConstraints?: string;
    readonly KeywordList: CapabilitiesKeywordList;
}

export interface CapabilitiesKeywordList {
    readonly Keyword: string | string[];
}

type ElementTypeIfArray<T> = T extends ReadonlyArray<infer U> ? U : T;

type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};

export function getRectangleFromLayer(layer: CapabilitiesLayer): StratumFromTraits<RectangleTraits> | undefined {
    var egbb = layer.EX_GeographicBoundingBox; // required in WMS 1.3.0
    if (egbb) {
        return {
            west: egbb.westBoundLongitude,
            south: egbb.southBoundLatitude,
            east: egbb.eastBoundLongitude,
            north: egbb.northBoundLatitude
        };
    } else {
        var llbb = layer.LatLonBoundingBox; // required in WMS 1.0.0 through 1.1.1
        if (llbb) {
            return {
                west: llbb.minx,
                south: llbb.miny,
                east: llbb.maxx,
                north: llbb.maxy
            };
        }
    }
    return undefined;
}



export default class WebMapServiceCapabilities {
    static fromUrl: (url: string) => Promise<WebMapServiceCapabilities> = createTransformer((url: string) => {
        return Promise.resolve(loadXML(url)).then(function(capabilitiesXml) {
            const json = xml2json(capabilitiesXml);
            if (!defined(json.Capability)) {
                throw new TerriaError({
                    title: 'Invalid GetCapabilities',
                    message: `The URL ${url} was retrieved successfully but it does not appear to be a valid Web Map Service (WMS) GetCapabilities document.` +
                    `\n\nEither the catalog file has been set up incorrectly, or the server address has changed.`
                });
            }

            return new WebMapServiceCapabilities(capabilitiesXml, json);
        });
    });

    get Service(): CapabilitiesService {
        return this.json.Service;
    }

    readonly rootLayers: CapabilitiesLayer[];
    readonly allLayers: CapabilitiesLayer[];
    readonly layersByName: {
        readonly [name: string]: CapabilitiesLayer;
    };
    readonly layersByTitle: {
        readonly [name: string]: CapabilitiesLayer;
    }

    private constructor(readonly xml: XMLDocument, readonly json: any) {
        this.allLayers = [];
        this.rootLayers = [];
        this.layersByName = {};
        this.layersByTitle = {};

        const allLayers = this.allLayers;
        const rootLayers = this.rootLayers;
        const layersByName: { [name: string]: CapabilitiesLayer } = this.layersByName;
        const layersByTitle: { [name: string]: CapabilitiesLayer } = this.layersByTitle;

        function traverseLayer(layer: Mutable<CapabilitiesLayer>, parent?: CapabilitiesLayer | undefined) {
            allLayers.push(layer);
            if (layer.Name) {
                layersByName[layer.Name] = layer;
            }
            if (layer.Title) {
                layersByTitle[layer.Title] = layer;
            }

            layer._parent = parent;

            const layers = layer.Layer;

            if (isReadOnlyArray(layers)) {
                for (let i = 0; i < layers.length; ++i) {
                    traverseLayer(layers[i], layer);
                }
            } else if (layers !== undefined) {
                traverseLayer(layers, layer);
            }
        }

        if (json.Capability && json.Capability.Layer) {
            const layerElements = json.Capability.Layer;
            if (Array.isArray(layerElements)) {
                rootLayers.push(...layerElements);
            } else {
                rootLayers.push(layerElements);
            }

            rootLayers.forEach(layer => traverseLayer(layer));
        }
    }

    /**
     * Finds the layer in GetCapabilities corresponding to a given layer name. Names are
     * resolved as follows:
     *    * The layer has the exact name specified.
     *    * The layer name matches the name in the spec if the namespace portion is removed.
     *    * The name in the spec matches the title of the layer.
     *
     * @param {String} name The layer name to resolve.
     * @returns {CapabilitiesLayer} The resolved layer, or `undefined` if the layer name could not be resolved.
     */
    findLayer(name: string): CapabilitiesLayer {
        // Look for an exact match on the name.
        let match = this.layersByName[name];
        if (!match) {
            const colonIndex = name.indexOf(':');
            if (colonIndex >= 0) {
                // This looks like a namespaced name.  Such names will (usually?) show up in GetCapabilities
                // as just their name without the namespace qualifier.
                const nameWithoutNamespace = name.substring(colonIndex + 1);
                match = this.layersByName[nameWithoutNamespace];
            }
        }

        if (!match) {
            // Try matching by title.
            match = this.layersByTitle[name];
        }

        return match;
    }

    /**
     * Gets the ancestry of a layer. The returned array has the layer itself at position 0, its parent
     * layer at position 1, and so on until the root of the layer hierarchy.
     *
     * @param layer The layer for which to obtain ancestry.
     * @returns The ancestry of the layer.
     */
    getLayerAncestry(layer: CapabilitiesLayer | undefined): ReadonlyArray<CapabilitiesLayer> {
        const result = [];
        while (layer) {
            result.push(layer);
            layer = layer._parent;
        }
        return result;
    }

    getInheritedValues<K extends keyof CapabilitiesLayer>(layer: CapabilitiesLayer, property: K): ReadonlyArray<ElementTypeIfArray<Exclude<CapabilitiesLayer[K], undefined>>> {
        type TResultElement = ElementTypeIfArray<Exclude<CapabilitiesLayer[K], undefined>>;
        type TResultArray = TResultElement[];

        const values = this.getLayerAncestry(layer).reduce((p: TResultArray, c) => {
            const value = c[property];
            if (Array.isArray(value)) {
                p.push(...value);
            } else if (value !== undefined) {
                p.push(<TResultElement>value);
            }
            return p;
        }, []);
        return values;
    }
}

