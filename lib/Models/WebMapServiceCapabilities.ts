import { createTransformer } from 'mobx-utils';
import * as defined from 'terriajs-cesium/Source/Core/defined';
import * as xml2json from '../ThirdParty/xml2json';
import * as loadXML from 'terriajs-cesium/Source/Core/loadXML';
import * as TerriaError from '../Core/TerriaError';

export interface CapabilitiesLegend {
    readonly OnlineResource?: string;
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

export interface CapabilitiesLayer {
    readonly _parent?: CapabilitiesLayer;
    readonly Name?: string;
    readonly Title: string;
    readonly Abstract?: string;
    readonly Style?: CapabilitiesStyle | ReadonlyArray<CapabilitiesStyle>;
}

export interface CapabilitiesService {
    readonly KeywordList: CapabilitiesKeywordList;
}

export interface CapabilitiesKeywordList {
    readonly Keyword: string | string[];
}

type ElementTypeIfArray<T> = T extends ReadonlyArray<infer U> ? U : T;

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
        const allLayers = this.allLayers = [];
        const rootLayers = this.rootLayers = [];
        const layersByName = this.layersByName = {};
        const layersByTitle = this.layersByTitle = {};

        function traverseLayer(layer, parent) {
            allLayers.push(layer);
            if (layer.Name) {
                layersByName[layer.Name] = layer;
            }
            if (layer.Title) {
                layersByTitle[layer.Title] = layer;
            }

            layer._parent = parent;

            const layers = layer.Layer;

            if (layers instanceof Array) {
                for (let i = 0; i < layers.length; ++i) {
                    traverseLayer(layers[i], layer);
                }
            } else if (defined(layers)) {
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

            rootLayers.forEach(traverseLayer);
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
    getLayerAncestry(layer: CapabilitiesLayer): ReadonlyArray<CapabilitiesLayer> {
        const result = [];
        while (layer) {
            result.push(layer);
            layer = layer._parent;
        }
        return result;
    }

    getInheritedValues<K extends keyof CapabilitiesLayer>(layer: CapabilitiesLayer, property: K): ReadonlyArray<ElementTypeIfArray<CapabilitiesLayer[K]>> {
        type TResultArray = ElementTypeIfArray<CapabilitiesLayer[K]>[];

        const foo = this.getLayerAncestry(layer).reduce((p: TResultArray, c) => {
            const value = c[property];
            if (Array.isArray(value)) {
                p.push(...value);
            } else {
                p.push(<ElementTypeIfArray<CapabilitiesLayer[K]>>value);
            }
            return p;
        }, []);
        return foo;
    }
}

