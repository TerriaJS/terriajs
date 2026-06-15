import dateFormat from "dateformat";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import ReactDOM from "react-dom";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import SplitDirection from "terriajs-cesium/Source/Scene/SplitDirection";
import LatLonHeight from "../../../Core/LatLonHeight";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import isDefined from "../../../Core/isDefined";
import PickedFeatures from "../../../Map/PickedFeatures/PickedFeatures";
import prettifyCoordinates from "../../../Map/Vector/prettifyCoordinates";
import DiffableMixin from "../../../ModelMixins/DiffableMixin";
import MappableMixin, {
  ImageryParts
} from "../../../ModelMixins/MappableMixin";
import SplitItemReference from "../../../Models/Catalog/CatalogReferences/SplitItemReference";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import hasTraits, { HasTrait } from "../../../Models/Definition/hasTraits";
import updateModelFromJson from "../../../Models/Definition/updateModelFromJson";
import TerriaFeature from "../../../Models/Feature/Feature";
import {
  getMarkerLocation,
  removeMarker
} from "../../../Models/LocationMarkerUtils";
import Terria from "../../../Models/Terria";
import ViewState from "../../../ReactViewModels/ViewState";
import Box, { BoxSpan } from "../../../Styled/Box";
import Button, { RawButton } from "../../../Styled/Button";
import { GLYPHS, StyledIcon } from "../../../Styled/Icon";
import Select from "../../../Styled/Select";
import Spacing from "../../../Styled/Spacing";
import Text, { TextSpan } from "../../../Styled/Text";
import ImageryProviderTraits from "../../../Traits/TraitsClasses/ImageryProviderTraits";
import { useViewState } from "../../Context";
import { parseCustomMarkdownToReactWithOptions } from "../../Custom/parseCustomMarkdownToReact";
import Loader from "../../Loader";
import WorkflowPanel from "../../Workflow/WorkflowPanel";
import DatePicker, { IDatePickerHandle } from "./DatePicker";
import LocationPicker from "./LocationPicker";

type DiffableItem = DiffableMixin.Instance;

interface PropsType {
  viewState: ViewState;
  sourceItem: DiffableItem;
}

const DiffTool: React.FC<PropsType> = observer((props: PropsType) => {
  const [leftItem, setLeftItem] = useState<DiffableItem>();
  const [rightItem, setRightItem] = useState<DiffableItem>();
  const [userSelectedSourceItem, setUserSelectedSourceItem] =
    useState<DiffableItem>();
  const viewState = useViewState();

  const changeSourceItem = (sourceItem: DiffableItem) => {
    setUserSelectedSourceItem(sourceItem);
  };

  const sourceItem = useMemo(
    () => userSelectedSourceItem || props.sourceItem,
    [props.sourceItem, userSelectedSourceItem]
  );

  useEffect(() => {
    const terria = viewState.terria;
    const originalSettings = {
      showSplitter: terria.showSplitter,
      isMapFullScreen: viewState.isMapFullScreen
    };
    runInAction(() => {
      terria.showSplitter = true;
      sourceItem.setTrait(CommonStrata.user, "show", false);
      terria.elements.set("timeline", { visible: false });
    });

    const itemsPromise = Promise.all([
      createSplitItem(sourceItem, SplitDirection.LEFT),
      createSplitItem(sourceItem, SplitDirection.RIGHT)
    ]);

    itemsPromise
      .then(([lItem, rItem]) => {
        setLeftItem(lItem);
        setRightItem(rItem);
      })
      .catch();

    return () => {
      runInAction(() => {
        terria.showSplitter = originalSettings.showSplitter;
        viewState.setIsMapFullScreen(originalSettings.isMapFullScreen);
        sourceItem.setTrait(CommonStrata.user, "show", true);
        terria.elements.set("timeline", { visible: true });
      });

      itemsPromise.then(([lItem, rItem]) => {
        if (lItem) removeSplitItem(lItem);
        if (rItem) removeSplitItem(rItem);
      });
    };
  }, [sourceItem, viewState]);

  if (leftItem && rightItem) {
    return (
      <Main
        {...props}
        terria={props.viewState.terria}
        sourceItem={sourceItem}
        changeSourceItem={changeSourceItem}
        leftItem={leftItem}
        rightItem={rightItem}
      />
    );
  }

  return null;
});
DiffTool.displayName = "DiffTool";
interface MainPropsType extends PropsType {
  terria: Terria;
  leftItem: DiffableItem;
  rightItem: DiffableItem;
  changeSourceItem: (newSourceItem: DiffableItem) => void;
}

const Main: React.FC<MainPropsType> = observer((props) => {
  const { terria, viewState, sourceItem, leftItem, rightItem } = props;

  const { t } = useTranslation();
  const theme = useTheme();

  const [location, setLocation] = useState<LatLonHeight | undefined>();
  const [, setLocationPickError] = useState(false);
  const [isPickingNewLocation, setIsPickingNewLocation] = useState(false);

  const leftDatePickerHandle = useRef<IDatePickerHandle>(null);
  const rightDatePickerHandle = useRef<IDatePickerHandle>(null);

  const diffItem = useMemo(() => {
    return leftItem;
  }, [leftItem]);

  const currentLeftDate = useMemo(() => {
    return leftItem.currentDiscreteJulianDate;
  }, [leftItem.currentDiscreteJulianDate]);

  const currentRightDate = useMemo(() => {
    return rightItem.currentDiscreteJulianDate;
  }, [rightItem.currentDiscreteJulianDate]);

  const diffItemName = useMemo(() => {
    const name = sourceItem.name || "";
    const format = "yyyy/mm/dd";
    if (!currentLeftDate || !currentRightDate) {
      return name;
    } else {
      const d1 = dateFormat(JulianDate.toDate(currentLeftDate), format);
      const d2 = dateFormat(JulianDate.toDate(currentRightDate), format);
      return `${name} - difference for dates ${d1}, ${d2}`;
    }
  }, [currentLeftDate, currentRightDate, sourceItem.name]);

  const diffableItemsInWorkbench = useMemo((): DiffableItem[] => {
    return terria.workbench.items.filter(
      (item) => DiffableMixin.isMixedInto(item) && item.canDiffImages
    ) as DiffableItem[];
  }, [terria.workbench.items]);

  const previewStyle = useMemo(() => {
    return diffItem.styleSelectableDimensions?.[0]?.selectedId;
  }, [diffItem.styleSelectableDimensions]);

  const currentDiffStyle = useMemo(() => {
    return diffItem.diffStyleId;
  }, [diffItem.diffStyleId]);

  const availableDiffStyles = useMemo(() => {
    return filterOutUndefined(
      diffItem.availableDiffStyles.map((diffStyleId) =>
        diffItem.styleSelectableDimensions?.[0]?.options?.find(
          (style) => style.id === diffStyleId
        )
      )
    );
  }, [diffItem.availableDiffStyles, diffItem.styleSelectableDimensions]);

  const diffLegendUrl = useMemo(() => {
    return (
      currentDiffStyle &&
      currentLeftDate &&
      currentRightDate &&
      diffItem.getLegendUrlForStyle(
        currentDiffStyle,
        currentLeftDate,
        currentRightDate
      )
    );
  }, [currentDiffStyle, currentLeftDate, currentRightDate, diffItem]);

  const previewLegendUrl = useMemo(() => {
    return previewStyle && diffItem.getLegendUrlForStyle(previewStyle);
  }, [previewStyle, diffItem]);

  const showItem = useCallback((model: DiffableItem) => {
    runInAction(() => {
      if (hasOpacity(model)) {
        model.setTrait(CommonStrata.user, "opacity", 0.8);
      }
    });
  }, []);

  const hideItem = useCallback((model: DiffableItem) => {
    runInAction(() => {
      if (hasOpacity(model)) {
        model.setTrait(CommonStrata.user, "opacity", 0);
      }
    });
  }, []);

  const handleChangeSourceItem = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const newSourceItem = diffableItemsInWorkbench.find(
        (item) => item.uniqueId === e.target.value
      );
      if (newSourceItem) props.changeSourceItem(newSourceItem);
    },
    [diffableItemsInWorkbench, props]
  );

  const handleChangePreviewStyle = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const styleId = e.target.value;
      runInAction(() => {
        leftItem.styleSelectableDimensions?.[0]?.setDimensionValue(
          CommonStrata.user,
          styleId
        );
        rightItem.styleSelectableDimensions?.[0]?.setDimensionValue(
          CommonStrata.user,
          styleId
        );
      });
    },
    [leftItem.styleSelectableDimensions, rightItem.styleSelectableDimensions]
  );

  const handleChangeDiffStyle = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      runInAction(() => {
        diffItem.setTrait(CommonStrata.user, "diffStyleId", e.target.value);
      });
    },
    [diffItem]
  );

  const onUserPickingLocation = useCallback(
    (_pickingLocation: LatLonHeight) => {
      setIsPickingNewLocation(true);
    },
    []
  );

  const onUserPickLocation = useCallback(
    (pickedFeatures: PickedFeatures, pickedLocationValue: LatLonHeight) => {
      const feature = pickedFeatures.features.find(
        (f) =>
          doesFeatureBelongToItem(f, leftItem) ||
          doesFeatureBelongToItem(f, rightItem)
      );

      runInAction(() => {
        if (feature) {
          leftItem.setTimeFilterFeature(feature, pickedFeatures.providerCoords);
          rightItem.setTimeFilterFeature(
            feature,
            pickedFeatures.providerCoords
          );
          setLocation(pickedLocationValue);
          setLocationPickError(false);
        } else {
          setLocationPickError(true);
        }
        setIsPickingNewLocation(false);
      });
    },
    [leftItem, rightItem]
  );

  const unsetDates = useCallback(() => {
    runInAction(() => {
      leftItem.setTrait(CommonStrata.user, "currentTime", null);
      rightItem.setTrait(CommonStrata.user, "currentTime", null);
    });
    hideItem(leftItem);
    hideItem(rightItem);
  }, [leftItem, rightItem, hideItem]);

  const generateDiff = useCallback(() => {
    if (
      currentLeftDate === undefined ||
      currentRightDate === undefined ||
      currentDiffStyle === undefined
    ) {
      return;
    }
    runInAction(() => {
      terria.overlays.remove(leftItem);
      terria.overlays.remove(rightItem);
      terria.workbench.add(diffItem);
      diffItem.setTrait(CommonStrata.user, "name", diffItemName);
      diffItem.showDiffImage(
        currentLeftDate,
        currentRightDate,
        currentDiffStyle
      );

      const diffItemProperties = diffItem.diffItemProperties;
      if (diffItemProperties) {
        updateModelFromJson(diffItem, CommonStrata.user, diffItemProperties);
      }
      terria.showSplitter = false;
    });
  }, [
    currentDiffStyle,
    currentLeftDate,
    currentRightDate,
    diffItem,
    diffItemName,
    leftItem,
    rightItem,
    terria
  ]);

  const resetTool = useCallback(() => {
    runInAction(() => {
      diffItem.clearDiffImage();
      setDefaultDiffStyle(diffItem);
      terria.overlays.add(leftItem);
      terria.overlays.add(rightItem);
      terria.workbench.remove(diffItem);
      terria.showSplitter = true;
      leftItem.setTrait(
        CommonStrata.user,
        "splitDirection",
        SplitDirection.LEFT
      );
      rightItem.setTrait(
        CommonStrata.user,
        "splitDirection",
        SplitDirection.RIGHT
      );
    });
  }, [diffItem, leftItem, rightItem, terria]);

  const setLocationFromActiveSearch = useCallback(async () => {
    const markerLocation = getMarkerLocation(terria);
    if (markerLocation && MappableMixin.isMixedInto(sourceItem)) {
      const part = sourceItem.mapItems.find((p) => ImageryParts.is(p));
      const imageryProvider =
        part && ImageryParts.is(part) && part.imageryProvider;
      if (imageryProvider) {
        const promises = [
          setTimeFilterFromLocation(leftItem, markerLocation, imageryProvider),
          setTimeFilterFromLocation(rightItem, markerLocation, imageryProvider)
        ];
        const someSuccessful = (await Promise.all(promises)).some((ok) => ok);
        if (someSuccessful) {
          runInAction(() => setLocation(markerLocation));
        } else {
          // If we cannot resolve imagery at the marker location, remove it
          runInAction(() => removeMarker(terria));
        }
      }
    }
  }, [leftItem, rightItem, sourceItem, terria]);

  useEffect(() => {
    const { latitude, longitude, height } = diffItem.timeFilterCoordinates;
    if (latitude !== undefined && longitude !== undefined) {
      setLocation({ latitude, longitude, height });
      // Assuming removeMarker is an action or handles its own MobX transactions
      removeMarker(terria);
    } else {
      setLocationFromActiveSearch();
    }
  }, [diffItem.timeFilterCoordinates, setLocationFromActiveSearch, terria]);

  const closePanel = useCallback(() => {
    viewState.closeTool();
  }, [viewState]);

  const isShowingDiff = diffItem.isShowingDiff;
  const datesSelected = currentLeftDate && currentRightDate;
  const isReadyToGenerateDiff =
    location && datesSelected && currentDiffStyle !== undefined;

  return (
    <WorkflowPanel
      viewState={viewState}
      title={t("diffTool.title")}
      icon={GLYPHS.difference}
      onClose={() => {
        resetTool();
        closePanel();
      }}
    >
      <div
        css={`
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 15px;
          gap: 20px;
        `}
      >
        {isShowingDiff && (
          <Text medium textLight>
            {t("diffTool.differenceResultsTitle")}
          </Text>
        )}
        <Text textLight>{t("diffTool.instructions.paneDescription")}</Text>
        <Group>
          <LocationAndDatesDisplayBox>
            <Box>
              <Text medium>{t("diffTool.labels.area")}:</Text>
              <div>
                <Text bold textLight>
                  {location
                    ? t("diffTool.locationDisplay.locationSelected.title")
                    : t("diffTool.locationDisplay.noLocationSelected.title")}
                </Text>
                <Text light textLight small>
                  {location
                    ? t("diffTool.locationDisplay.locationSelected.description")
                    : t(
                        "diffTool.locationDisplay.noLocationSelected.description"
                      )}
                </Text>
              </div>
            </Box>
            <Box>
              <Text medium>{t("diffTool.labels.dates")}:</Text>
              <Box column alignItemsFlexStart>
                {currentLeftDate && (
                  <Text large>
                    (A){" "}
                    {dateFormat(
                      JulianDate.toDate(currentLeftDate),
                      "dd/mm/yyyy"
                    )}
                  </Text>
                )}
                {!currentLeftDate && (
                  <RawButton
                    onClick={() => leftDatePickerHandle.current?.open()}
                  >
                    <TextSpan isLink small bold>
                      {t("diffTool.instructions.setDateA")}
                    </TextSpan>
                  </RawButton>
                )}
                {currentRightDate && (
                  <Text large>
                    (B){" "}
                    {dateFormat(
                      JulianDate.toDate(currentRightDate),
                      "dd/mm/yyyy"
                    )}
                  </Text>
                )}
                {!currentRightDate && (
                  <RawButton
                    onClick={() => rightDatePickerHandle.current?.open()}
                  >
                    <TextSpan isLink small bold>
                      {t("diffTool.instructions.setDateB")}
                    </TextSpan>
                  </RawButton>
                )}
                {isShowingDiff === false &&
                  currentLeftDate &&
                  currentRightDate && (
                    <RawButton onClick={unsetDates}>
                      <TextSpan isLink small>
                        {t("diffTool.instructions.changeDates")}
                      </TextSpan>
                    </RawButton>
                  )}
              </Box>
            </Box>
          </LocationAndDatesDisplayBox>
        </Group>
        {!isShowingDiff && (
          <Group>
            <Selector
              viewState={viewState}
              value={sourceItem.uniqueId}
              onChange={handleChangeSourceItem}
              label={t("diffTool.labels.sourceDataset")}
            >
              <option disabled>Select source item</option>
              {diffableItemsInWorkbench.map((item) => (
                <option key={item.uniqueId} value={item.uniqueId}>
                  {item.name}
                </option>
              ))}
            </Selector>
          </Group>
        )}
        {!isShowingDiff && (
          <Group>
            <Selector
              viewState={viewState}
              spacingBottom
              value={previewStyle}
              onChange={handleChangePreviewStyle}
              label={t("diffTool.labels.previewStyle")}
            >
              <option disabled value="">
                {t("diffTool.choosePreview")}
              </option>
              {diffItem.styleSelectableDimensions?.[0]?.options?.map(
                (style) => (
                  <option key={style.id} value={style.id}>
                    {style.name}
                  </option>
                )
              )}
            </Selector>
            {previewLegendUrl && (
              <LegendImage width="100%" src={previewLegendUrl} />
            )}
          </Group>
        )}
        <Group>
          <Selector
            viewState={viewState}
            value={currentDiffStyle || ""}
            onChange={handleChangeDiffStyle}
            label={t("diffTool.labels.differenceOutput")}
          >
            <option disabled value="">
              {t("diffTool.chooseDifference")}
            </option>
            {availableDiffStyles.map((style) => (
              <option key={style.id} value={style.id}>
                {style.name}
              </option>
            ))}
          </Selector>
          {isShowingDiff && diffLegendUrl && (
            <LegendImage width="100%" src={diffLegendUrl} />
          )}
        </Group>
        {!isShowingDiff && (
          <div>
            <GenerateButton
              onClick={generateDiff}
              disabled={!isReadyToGenerateDiff}
              aria-describedby="TJSDifferenceDisabledButtonPrompt"
            >
              <TextSpan large>
                {t("diffTool.labels.generateDiffButtonText")}
              </TextSpan>
            </GenerateButton>
            {!isReadyToGenerateDiff && (
              <div
                css={`
                  display: flex;
                  flex-direction: row;
                  padding: 5px;
                `}
              >
                <div
                  css={`
                    margin-right: 10px;
                  `}
                >
                  <StyledIcon
                    fillColor="#ccc"
                    styledWidth="16px"
                    styledHeight="16px"
                    glyph={GLYPHS.info}
                  />
                </div>
                <Text
                  small
                  light
                  textLight
                  id="TJSDifferenceDisabledButtonPrompt"
                >
                  {t("diffTool.labels.disabledButtonPrompt")}
                </Text>
              </div>
            )}
          </div>
        )}
        {isShowingDiff && (
          <Box centered left>
            <BackButton
              css={`
                color: ${theme.textLight};
                border-color: ${theme.textLight};
              `}
              transparentBg
              onClick={resetTool}
            >
              <BoxSpan centered>
                <StyledIcon
                  css="transform:rotate(90deg);"
                  light
                  styledWidth="16px"
                  glyph={GLYPHS.arrowDown}
                />
                <TextSpan medium>{t("general.back")}</TextSpan>
              </BoxSpan>
            </BackButton>
            <Button
              primary
              onClick={closePanel}
              css={`
                flex-grow: 1;
                margin-left: 10px;
              `}
            >
              <TextSpan medium>{t("diffTool.labels.saveToWorkbench")}</TextSpan>
            </Button>
          </Box>
        )}
        {!isShowingDiff && (
          <LocationPicker
            terria={terria}
            location={location}
            onPicking={onUserPickingLocation}
            onPicked={onUserPickLocation}
          />
        )}
        {!isShowingDiff &&
          ReactDOM.createPortal(
            <Box centered fullWidth flexWrap backgroundColor={theme.dark}>
              <DatePicker
                ref={leftDatePickerHandle}
                heading={t("diffTool.labels.dateComparisonA")}
                item={leftItem}
                onDateSet={() => showItem(leftItem)}
              />
              <AreaFilterSelection
                location={location}
                isPickingNewLocation={isPickingNewLocation}
              />
              <DatePicker
                ref={rightDatePickerHandle}
                heading={t("diffTool.labels.dateComparisonB")}
                item={rightItem}
                onDateSet={() => showItem(rightItem)}
              />
            </Box>,
            document.getElementById("TJS-BottomDockLastPortal")!
          )}
      </div>
    </WorkflowPanel>
  );
});
Main.displayName = "Main";

const BackButton = styled(Button).attrs({
  secondary: true
})``;

const GenerateButton = styled(Button).attrs({
  primary: true,
  fullWidth: true
})``;

const Selector = (props: any) => (
  <Box fullWidth column>
    <label>
      {/* <Text textLight>{props.label}:</Text> */}
      <Text textLight css={"p {margin: 0;}"}>
        {parseCustomMarkdownToReactWithOptions(`${props.label}:`, {
          injectTermsAsTooltips: true,
          tooltipTerms: props.viewState.terria.configParameters.helpContentTerms
        })}
      </Text>
      <Spacing bottom={1} />
      <Select {...props}>{props.children}</Select>
      {props.spacingBottom && <Spacing bottom={2} />}
    </label>
  </Box>
);

const AreaFilterSelection = (props: {
  location?: LatLonHeight;
  isPickingNewLocation: boolean;
  theme?: any;
}) => {
  const { location, isPickingNewLocation } = props;
  const { t } = useTranslation();
  let locationText = "-";
  if (location) {
    const { longitude, latitude } = prettifyCoordinates(
      location.longitude,
      location.latitude,
      {
        digits: 2
      }
    );
    locationText = `${longitude} ${latitude}`;
  }

  return (
    <Box
      column
      centered
      styledMinWidth="230px"
      css={`
        @media (max-width: ${(props: any) => props.theme.md}px) {
          width: 100%;
        }
      `}
    >
      <Box centered>
        <StyledIcon light styledWidth="16px" glyph={GLYPHS.location2} />
        <Spacing right={2} />
        <Text textLight extraLarge>
          {t("diffTool.labels.areaFilterSelection")}
        </Text>
      </Box>
      <Spacing bottom={3} />
      <Box styledMinHeight="40px">
        {isPickingNewLocation ? (
          <Text
            textLight
            extraExtraLarge
            bold
            // Using legacy Loader.jsx means we override at a higher level to inherit
            // this fills tyle
            css={`
              fill: ${({ theme }: any) => theme.textLight};
            `}
          >
            <Loader
              light
              message={`Querying ${location ? "new" : ""} position...`}
            />
          </Text>
        ) : (
          <Text textLight bold heading textAlignCenter>
            {locationText}
          </Text>
        )}
      </Box>
    </Box>
  );
};

const Group = styled.div`
  background-color: ${(p) => p.theme.darkWithOverlay};
  padding: 15px;
  border-radius: 5px;
`;

const LocationAndDatesDisplayBox = styled(Box).attrs({
  column: true
})`
  color: ${(p) => p.theme.textLight};
  padding: 15px;
  > ${Box}:first-child {
    margin-bottom: 13px;
  }
  > div > div:first-child {
    /* The labels */
    margin-right: 5px;
    min-width: 50px;
  }
`;

const LegendImage = function (props: any) {
  return (
    <img
      {...props}
      // Show the legend only if it loads successfully, so we start out hidden
      style={{ display: "none", marginTop: "10px" }}
      onLoad={(e) => (e.currentTarget.style.display = "block")}
      onError={(e) => (e.currentTarget.style.display = "none")}
    />
  );
};

async function createSplitItem(
  sourceItem: DiffableItem,
  splitDirection: SplitDirection
): Promise<DiffableItem> {
  const terria = sourceItem.terria;
  const ref = new SplitItemReference(createGuid(), terria);
  ref.setTrait(CommonStrata.user, "splitSourceItemId", sourceItem.uniqueId);
  terria.addModel(ref);
  await ref.loadReference();
  return runInAction(() => {
    if (ref.target === undefined) {
      throw Error("failed to split item");
    }
    const newItem = ref.target as DiffableItem;
    newItem.setTrait(CommonStrata.user, "show", true);
    newItem.setTrait(CommonStrata.user, "splitDirection", splitDirection);
    newItem.setTrait(CommonStrata.user, "currentTime", null);
    newItem.setTrait(CommonStrata.user, "initialTimeSource", "none");
    if (hasOpacity(newItem)) {
      // We want to show the item on the map only after date selection. At the
      // same time we cannot set `show` to false because if we
      // do so, date picking which relies on feature picking, will not work. So
      // we simply set the opacity of the item to 0.
      newItem.setTrait(CommonStrata.user, "opacity", 0);
    }

    // Override feature info template as the parent featureInfoTemplate might
    // not be relevant for the difference item. This has to be done in the user
    // stratum to override template set in definition stratum.
    updateModelFromJson(newItem, CommonStrata.user, {
      featureInfoTemplate: { template: "" }
    });

    setDefaultDiffStyle(newItem);

    // Set the default style to true color style if it exists
    const trueColor = newItem.styleSelectableDimensions?.[0]?.options?.find(
      (style) => isDefined(style.name) && style.name.search(/true/i) >= 0
    );
    if (trueColor?.id) {
      newItem.styleSelectableDimensions?.[0]?.setDimensionValue(
        CommonStrata.user,
        trueColor.id
      );
    }

    terria.overlays.add(newItem);
    return newItem;
  });
}

/**
 * If the item has only one available diff style, auto-select it
 */
function setDefaultDiffStyle(item: DiffableItem) {
  if (item.diffStyleId !== undefined) {
    return;
  }

  const availableStyles = filterOutUndefined(
    item.availableDiffStyles.map((diffStyleId) =>
      item.styleSelectableDimensions?.[0]?.options?.find(
        (style) => style.id === diffStyleId
      )
    )
  );

  if (availableStyles.length === 1) {
    item.setTrait(CommonStrata.user, "diffStyleId", availableStyles[0].id);
  }
}

function removeSplitItem(item: DiffableItem) {
  const terria = item.terria;
  terria.overlays.remove(item);
  if (item.sourceReference && terria.workbench.contains(item) === false) {
    terria.removeModelReferences(item.sourceReference);
  }
}

function doesFeatureBelongToItem(
  feature: TerriaFeature,
  item: DiffableItem
): boolean {
  if (!MappableMixin.isMixedInto(item)) return false;
  const imageryProvider = feature.imageryLayer?.imageryProvider;
  if (imageryProvider === undefined) return false;
  return (
    item.mapItems.find(
      (m) => ImageryParts.is(m) && m.imageryProvider === imageryProvider
    ) !== undefined
  );
}

function setTimeFilterFromLocation(
  item: DiffableItem,
  location: LatLonHeight,
  im: ImageryProvider
): Promise<boolean> {
  const carto = new Cartographic(
    CesiumMath.toRadians(location.longitude),
    CesiumMath.toRadians(location.latitude)
  );
  // We just need to set this to a high enough level supported by the service
  const level = 30;
  const tile = im.tilingScheme.positionToTileXY(carto, level);
  return item.setTimeFilterFromLocation({
    position: {
      latitude: location.latitude,
      longitude: location.longitude,
      height: location.height
    },
    tileCoords: {
      x: tile.x,
      y: tile.y,
      level
    }
  });
}

function hasOpacity(
  model: any
): model is HasTrait<ImageryProviderTraits, "opacity"> {
  return hasTraits(model, ImageryProviderTraits, "opacity");
}

export default DiffTool;
