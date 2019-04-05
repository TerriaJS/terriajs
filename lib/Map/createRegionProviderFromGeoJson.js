import { fromUrl } from '../Map/RegionProviderList';
import RegionProvider, { processRegionIds } from '../Map/RegionProvider';

import geojsonvt from 'geojson-vt';

let geoJsonCounter = 0;

export function createRegionProviderFromGeoJson(terria, regionProviderList, geoJson, property, rpType=undefined) {
    let fid = 0;
    geoJson.features.forEach(f => f.properties['FID'] = fid++);
    const tileIndex = geojsonvt(geoJson);
    const rp = new RegionProvider(rpType || `geojson_${geoJsonCounter++}_${property}`, {
        nameProp: property,
        regionProp: property,
        layerName: '', // Matches expected layerName in MapboxVectorTtileImageryProvider
        server: tileIndex,
        serverType: 'MVT',
        serverMaxZoom: 24,
        aliases: []
    });
    processRegionIds(rp, geoJson.features.map(f => f.properties[property]), undefined, 'serverReplacements');
    regionProviderList.regionProviders.push(rp);
    return rp;
}

export default function createAllRegionProvidersFromGeoJson(terria, geoJson) {
    var properties = Object.keys(geoJson.features[0].properties);
    var uniqueProperties = properties.filter(prop =>
        // Filter out JSON properties since RegionProvider expects number or string
        geoJson.features.every(f => ["number", "string"].includes(typeof f.properties[prop]))
    ).filter(p =>
        // Filter out properties that aren't unique per row
        new Set(geoJson.features.map(f => f.properties[p])).size === geoJson.features.length
    );
    console.log(`Unique properties are: ${uniqueProperties.join(',')}`);
    if (uniqueProperties.length > 0) {
        // Region-mappable
        return fromUrl(terria.configParameters.regionMappingDefinitionsUrl, terria.corsProxy).then(rpList => {
            uniqueProperties.forEach(prop => {
                createRegionProviderFromGeoJson(terria, rpList, geoJson, prop);
            });
        });
    }
    return new Promise.resolve();
}
