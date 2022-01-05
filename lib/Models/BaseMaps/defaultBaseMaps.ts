import Terria from "../Terria";

export function defaultBaseMaps(terria: Terria): any[] {
  const baseMaps: any[] = [];

  if (
    terria.configParameters.bingMapsKey &&
    !terria.configParameters.useCesiumIonBingImagery
  ) {
    baseMaps.push({
      item: {
        id: "basemap-bing-aerial-with-labels",
        name: "Bing Maps Aerial with Labels",
        type: "bing-maps",
        mapStyle: "AerialWithLabelsOnDemand",
        opacity: 1.0
      },
      image: "build/TerriaJS/images/bing-aerial-labels.png",
      contrastColor: "#ffffff"
    });

    baseMaps.push({
      item: {
        id: "basemap-bing-aerial",
        name: "Bing Maps Aerial",
        type: "bing-maps",
        mapStyle: "Aerial",
        opacity: 1.0
      },
      image: "build/TerriaJS/images/bing-aerial.png",
      contrastColor: "#ffffff"
    });
    baseMaps.push({
      item: {
        id: "basemap-bing-roads",
        name: "Bing Maps Roads",
        type: "bing-maps",
        mapStyle: "RoadOnDemand",
        opacity: 1.0
      },
      image: "build/TerriaJS/images/bing-maps-roads.png",
      contrastColor: "#000000"
    });
  } else if (terria.configParameters.useCesiumIonBingImagery === true) {
    baseMaps.push({
      item: {
        id: "basemap-bing-aerial-with-labels",
        name: "Bing Maps Aerial with Labels",
        type: "ion-imagery",
        ionAssetId: 3,
        opacity: 1.0
      },
      image: "build/TerriaJS/images/bing-aerial-labels.png",
      contrastColor: "#ffffff"
    });

    baseMaps.push({
      item: {
        id: "basemap-bing-aerial",
        name: "Bing Maps Aerial",
        type: "ion-imagery",
        ionAssetId: 2,
        opacity: 1.0
      },
      image: "build/TerriaJS/images/bing-aerial.png",
      contrastColor: "#ffffff"
    });
    baseMaps.push({
      item: {
        id: "basemap-bing-roads",
        name: "Bing Maps Roads",
        type: "ion-imagery",
        ionAssetId: 4,
        opacity: 1.0
      },
      image: "build/TerriaJS/images/bing-maps-roads.png",
      contrastColor: "#000000"
    });
  }

  baseMaps.push({
    item: {
      id: "basemap-natural-earth-II",
      name: "Natural Earth II",
      type: "wms",
      url:
        "http://geoserver.nationalmap.nicta.com.au/imagery/natural-earth-ii/wms",
      layers: "NE2_HR_LC_SR_W_DR",
      opacity: 1.0
    },
    image: "build/TerriaJS/images/natural-earth.png",
    contrastColor: "#000000"
  });

  baseMaps.push({
    item: {
      id: "basemap-black-marble",
      name: "NASA Black Marble",
      type: "wms",
      url:
        "http://geoserver.nationalmap.nicta.com.au/imagery/nasa-black-marble/wms",
      layers: "nasa-black-marble:dnb_land_ocean_ice.2012.54000x27000_geo",
      opacity: 1.0
    },
    image: "build/TerriaJS/images/black-marble.png",
    contrastColor: "#ffffff"
  });

  baseMaps.push({
    item: {
      id: "basemap-positron",
      name: "Positron (Light)",
      type: "open-street-map",
      url: "https://basemaps.cartocdn.com/light_all/",
      attribution:
        "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>, © <a href='https://carto.com/about-carto/'>CARTO</a>",
      subdomains: ["a", "b", "c", "d"],
      opacity: 1.0
    },
    image: "build/TerriaJS/images/positron.png",
    contrastColor: "#000000"
  });

  baseMaps.push({
    item: {
      id: "basemap-darkmatter",
      name: "Dark Matter",
      type: "open-street-map",
      url: "https://basemaps.cartocdn.com/dark_all/",
      attribution:
        "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>, © <a href='https://carto.com/about-carto/'>CARTO</a>",
      subdomains: ["a", "b", "c", "d"],
      opacity: 1.0
    },
    image: "build/TerriaJS/images/dark-matter.png",
    contrastColor: "#ffffff"
  });

  return baseMaps;
}
