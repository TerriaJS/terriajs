import { Feature } from "@turf/helpers/dist/js/lib/geojson";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import { IPromiseBasedObservable, fromPromise } from "mobx-utils";
import React, { useCallback, useEffect, useState } from "react";
import ReactSelect from "react-select";
import { isFeature as isGeoJsonFeature } from "../../Core/GeoJson";
import PickedFeatures from "../../Map/PickedFeatures/PickedFeatures";
import RegionProvider from "../../Map/Region/RegionProvider";
import CatalogFunctionMixin from "../../ModelMixins/CatalogFunctionMixin";
import MappableMixin from "../../ModelMixins/MappableMixin";
import GeoJsonCatalogItem from "../../Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import WebMapServiceCatalogItem from "../../Models/Catalog/Ows/WebMapServiceCatalogItem";
import CommonStrata from "../../Models/Definition/CommonStrata";
import RegionParameter from "../../Models/FunctionParameters/RegionParameter";
import Terria from "../../Models/Terria";
import Loader from "../Loader";
import RegionTypeParameterEditor from "./RegionTypeParameterEditor";
import Styles from "./parameter-editors.scss";

interface PropsType {
  previewed: CatalogFunctionMixin.Instance;
  parameter: RegionParameter;
}

type RegionId = string | number;

interface LoadResult {
  regionProvider: RegionProvider;
  regionMapItem: MappableMixin.Instance;
}

interface PickedRegion {
  id: string | number;
  geoJson: Feature;
}

/**
 * Renders RegionParameter.
 */
const RegionPicker: React.FC<PropsType> = observer(
  ({ previewed, parameter }) => {
    const terria = previewed.terria;

    const [loader, setLoader] = useState<IPromiseBasedObservable<LoadResult>>();
    const [regionGeoJson, setRegionGeoJson] = useState<Feature>();

    const setRegion = useCallback(
      (regionId: RegionId | undefined, geoJson?: Feature) => {
        parameter.setValue(CommonStrata.user, regionId);
        setRegionGeoJson(geoJson);
      },
      [parameter]
    );

    const regionId = parameter.value;
    const regionProvider =
      loader?.state === "fulfilled" ? loader.value.regionProvider : undefined;

    useEffect(() => {
      // Unset region if it is not valid for the current provider
      if (regionId !== undefined && regionProvider) {
        const validRegion =
          regionProvider.findRegionByID(regionId) !== undefined;
        if (!validRegion) {
          setRegion(undefined, undefined);
        }
      }
    }, [regionProvider, regionId, setRegion]);

    useEffect(() => {
      runInAction(() => {
        terria.mapInteractionModeStack[0].pickedFeatures = undefined;
      });

      const regionProvider = parameter.regionProvider;
      if (!regionProvider) {
        return;
      }

      const regionMapItem = createRegionMapItem(regionProvider, terria);
      setLoader(
        fromPromise(
          Promise.all([
            regionProvider.loadRegionIDs(),
            regionProvider.loadRegionNames(),
            regionMapItem.loadMapItems().then((result) => result.throwIfError())
          ]).then(() => ({ regionProvider, regionMapItem }))
        )
      );
    }, [parameter.regionProvider, terria]);

    useEffect(() => {
      if (loader?.state === "fulfilled") {
        const mapItem = loader.value.regionMapItem;
        terria.overlays.add(mapItem);

        return () => {
          terria.overlays.remove(mapItem);
        };
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loader?.state, terria]);

    return (
      <div className={Styles.parameterEditor}>
        {parameter.regionTypeParameter && (
          <div>
            <RegionTypeParameterEditor
              previewed={previewed}
              parameter={parameter.regionTypeParameter}
            />
          </div>
        )}
        <div>
          {regionProvider && (
            <>
              <DropdownRegionSelector
                regionProvider={regionProvider}
                regionId={regionId}
                onChange={setRegion}
              />
              <MapRegionSelector
                terria={terria}
                regionProvider={regionProvider}
                onChange={setRegion}
              />
              {regionId && (
                <HighlightSelectedRegion
                  terria={terria}
                  regionProvider={regionProvider}
                  regionId={regionId}
                  regionGeoJson={regionGeoJson}
                />
              )}
            </>
          )}
          {loader?.state === "pending" && <Loader />}
          {loader?.state === "rejected" && (
            <div>Error loading region map, try another one!</div>
          )}
        </div>
      </div>
    );
  }
);

const DropdownRegionSelector: React.FC<{
  regionId: RegionId | undefined;
  regionProvider: RegionProvider;
  onChange: (region: RegionId | undefined) => void;
}> = observer(({ regionId, regionProvider, onChange }) => {
  const regions = regionProvider.regions;
  const regionNames = regionProvider.regionNames;
  const [options, setOptions] = useState<{ value: any; label: any }[]>();
  const [selectedOption, setSelectedOption] = useState<{
    value: any;
    label: any;
  } | null>();

  useEffect(() => {
    const options = regions.map((region, i) => ({
      value: region.regionProp,
      label: regionNames[i] ?? region.regionProp
    }));
    setOptions(options);
  }, [regions, regionNames]);

  useEffect(() => {
    setSelectedOption(options?.find((opt) => opt.value === regionId) ?? null);
  }, [regionId, options]);

  return (
    <ReactSelect
      placeholder="Region"
      options={options}
      value={selectedOption}
      onChange={(opt) => onChange(opt?.value)}
    />
  );
});

const MapRegionSelector: React.FC<{
  regionProvider: RegionProvider;
  terria: Terria;
  onChange: (id: RegionId | undefined, geoJson: Feature | undefined) => void;
}> = observer(({ regionProvider, terria, onChange }) => {
  const pickedFeatures = terria.mapInteractionModeStack[0]?.pickedFeatures;
  const [loader, setLoader] =
    useState<IPromiseBasedObservable<PickedRegion | undefined>>();

  // Resolve user picked feature
  useEffect(() => {
    const loader = pickedFeatures?.allFeaturesAvailablePromise
      ? fromPromise(
          pickedFeatures?.allFeaturesAvailablePromise.then(() =>
            getPickedRegion(pickedFeatures, regionProvider)
          )
        )
      : undefined;
    setLoader(loader);
  }, [pickedFeatures, regionProvider]);

  // Call onChange when picked feature is resolved
  useEffect(() => {
    if (loader) {
      const pickedRegion =
        loader.state === "fulfilled" ? loader.value : undefined;
      onChange(pickedRegion?.id, pickedRegion?.geoJson);
    }
  }, [loader?.state, loader, onChange]);

  return null;
});

const HighlightSelectedRegion: React.FC<{
  terria: Terria;
  regionProvider: RegionProvider;
  regionId: RegionId;
  regionGeoJson: Feature | undefined;
}> = observer(({ regionId, regionGeoJson, regionProvider, terria }) => {
  const [highlightItem] = useState(new GeoJsonCatalogItem(undefined, terria));
  const [loader, setLoader] =
    useState<IPromiseBasedObservable<GeoJsonCatalogItem>>();

  useEffect(() => {
    const loadGeoJsonItem = async () => {
      const geoJsonData = await (regionGeoJson ??
        regionProvider.getRegionFeature(regionId, terria));
      highlightItem.setTrait(
        CommonStrata.user,
        "geoJsonData",
        geoJsonData as any
      );
      await highlightItem
        .loadMapItems(true)
        .then((result) => result.throwIfError());
      return highlightItem;
    };

    setLoader(fromPromise(loadGeoJsonItem()));
  }, [regionId, regionGeoJson, regionProvider, highlightItem, terria]);

  useEffect(() => {
    if (loader?.state === "fulfilled") {
      const loadedHighlightItem = loader?.value;
      terria.overlays.add(loadedHighlightItem);

      if (regionGeoJson === undefined) {
        // regionGeoJson is `undefined` if the user picked a region from the
        // dropdown selector instead of the map. In that case we zoom to the
        // selected region so that they can view it clearly on the map.
        terria.currentViewer.zoomTo(loadedHighlightItem);
      }

      return () => {
        terria.overlays.remove(loadedHighlightItem);
      };
    }
  }, [loader?.state, loader?.value, regionGeoJson, terria]);

  return null;
});

function getPickedRegion(
  pickedFeatures: PickedFeatures,
  regionProvider: RegionProvider
): PickedRegion | undefined {
  const feature = pickedFeatures.features[0];
  if (!isGeoJsonFeature(feature.data)) {
    return;
  }

  const propKey = regionProvider.regionProp;
  const value = feature.properties?.[propKey]?.getValue();
  const regionId =
    (typeof value === "number" || typeof value === "string") &&
    regionProvider.findRegionByID(value)
      ? value
      : undefined;

  return regionId ? { id: regionId, geoJson: feature.data } : undefined;
}

function createRegionMapItem(
  regionProvider: RegionProvider,
  terria: Terria
): MappableMixin.Instance {
  const wms = new WebMapServiceCatalogItem(undefined, terria);
  wms.setTrait(CommonStrata.user, "name", "Available Regions");
  wms.setTrait(CommonStrata.user, "url", regionProvider.analyticsWmsServer);
  wms.setTrait(
    CommonStrata.user,
    "layers",
    regionProvider.analyticsWmsLayerName
  );
  // Use EPSG:4326 so that feature picking works correctly. Feature picking
  // fails with EPSG:3857 because Cesium does not correctly pass CRS info for
  // feature data.
  wms.setTrait(CommonStrata.user, "crs", "EPSG:4326");
  return wms;
}

/**
 * Given a value, return it in human readable form for display.
 * @param region  Region value.
 * @param parameter The region parameter
 * @return  String for display
 */
export function getDisplayValue(
  regionId: RegionId,
  parameter: RegionParameter
) {
  const regionProvider = parameter.regionProvider;
  if (regionId === undefined || !regionProvider) {
    return "";
  }

  const regionName = regionProvider.findRegionNameById(regionId) ?? regionId;
  const regionType = regionProvider.regionType;
  return `${regionType} > ${regionName}`;
}

export default RegionPicker;
