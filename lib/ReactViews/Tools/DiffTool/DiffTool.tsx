import hoistStatics from "hoist-non-react-statics";
import { action, computed, observable, reaction, runInAction } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import styled from "styled-components";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";
import LatLonHeight from "../../../Core/LatLonHeight";
import PickedFeatures from "../../../Map/PickedFeatures";
import DiffableMixin from "../../../ModelMixins/DiffableMixin";
import CommonStrata from "../../../Models/CommonStrata";
import Feature from "../../../Models/Feature";
import Mappable, { ImageryParts } from "../../../Models/Mappable";
import ViewState from "../../../ReactViewModels/ViewState";
import DatePicker from "./DatePicker";
import Styles from "./diff-tool.scss";
import LocationPicker from "./LocationPicker";

const Box: any = require("../../../Styled/Box").default;
const Button: any = require("../../../Styled/Button").default;
const Text: any = require("../../../Styled/Text").default;

type DiffableItem = DiffableMixin.Instance;

interface PropTypes extends WithTranslation {
  viewState: ViewState;
  sourceItem: DiffableItem;
}

@observer
class DiffTool extends React.Component<PropTypes> {
  static readonly toolName = "Image Difference";

  @observable private userSelectedSourceItem?: DiffableItem;
  // @ts-ignore
  @observable private leftItem: DiffableItem;
  // @ts-ignore
  @observable private rightItem: DiffableItem;
  @observable private location?: LatLonHeight;
  @observable private locationPickerMessages: {
    beforePick: string;
    afterPick: string;
  };

  private splitterItemsDisposer: () => void;
  private originalSettings: any;

  constructor(props: PropTypes) {
    super(props);

    this.locationPickerMessages = {
      beforePick: props.t("diffTool.locationPicker.initialMessages.beforePick"),
      afterPick: props.t("diffTool.locationPicker.initialMessages.afterPick")
    };

    const createSplitterItems = action((sourceItem: DiffableItem) => {
      const terria = sourceItem.terria;
      if (this.leftItem) terria.overlays.remove(this.leftItem);
      if (this.rightItem) terria.overlays.remove(this.rightItem);
      this.leftItem = duplicateSourceItem(
        sourceItem,
        ImagerySplitDirection.LEFT
      );
      this.rightItem = duplicateSourceItem(
        sourceItem,
        ImagerySplitDirection.RIGHT
      );
      terria.overlays.add(this.leftItem);
      terria.overlays.add(this.rightItem);
    });

    createSplitterItems(runInAction(() => this.sourceItem));
    this.splitterItemsDisposer = reaction(
      () => this.sourceItem,
      action((sourceItem: DiffableItem) => {
        createSplitterItems(sourceItem);
      })
    );
  }

  @computed
  get sourceItem() {
    return this.userSelectedSourceItem || this.props.sourceItem;
  }

  @computed
  get diffItem() {
    return this.leftItem;
  }

  @computed
  get diffableItemsInWorkbench(): DiffableItem[] {
    const terria = this.props.viewState.terria;
    return terria.workbench.items.filter(item =>
      DiffableMixin.isMixedInto(item)
    ) as DiffableItem[];
  }

  @computed
  get previewStyle(): string | undefined {
    return this.leftItem.styleSelector?.activeStyleId;
  }

  @computed
  get diffStyle(): string | undefined {
    return this.diffItem.diffStyleId;
  }

  @computed
  get leftDate() {
    return this.leftItem.currentDiscreteJulianDate;
  }

  @computed
  get rightDate() {
    return this.rightItem.currentDiscreteJulianDate;
  }

  @computed
  get legendUrl(): string | undefined {
    return (
      this.diffStyle &&
      this.leftDate &&
      this.rightDate &&
      this.diffItem.getLegendUrlForDiffStyle(
        this.diffStyle,
        this.leftDate,
        this.rightDate
      )
    );
  }

  @action.bound
  changePreviewStyle(e: React.ChangeEvent<HTMLSelectElement>) {
    const styleId = e.target.value;
    this.leftItem.styleSelector?.chooseActiveStyle(CommonStrata.user, styleId);
    this.rightItem.styleSelector?.chooseActiveStyle(CommonStrata.user, styleId);
  }

  @action.bound
  changeDiffStyle(e: React.ChangeEvent<HTMLSelectElement>) {
    this.diffItem.setTrait(CommonStrata.user, "diffStyleId", e.target.value);
  }

  @action.bound
  changeSourceItem(e: React.ChangeEvent<HTMLSelectElement>) {
    this.userSelectedSourceItem = this.diffableItemsInWorkbench.find(
      item => item.uniqueId === e.target.value
    );
  }

  @action
  enterDiffTool() {
    const { viewState, sourceItem } = this.props;
    const terria = viewState.terria;
    this.originalSettings = {
      showSplitter: terria.showSplitter,
      isMapFullScreen: viewState.isMapFullScreen
    };
    terria.showSplitter = true;
    viewState.isMapFullScreen = true;
    sourceItem.setTrait(CommonStrata.user, "show", false);
  }

  @action
  leaveDiffTool() {
    const { viewState, sourceItem } = this.props;
    const terria = viewState.terria;
    const originalSettings = this.originalSettings;
    terria.showSplitter = originalSettings.showSplitter;
    viewState.isMapFullScreen = originalSettings.isMapFullScreen;
    terria.overlays.remove(this.leftItem);
    terria.overlays.remove(this.rightItem);
    sourceItem.setTrait(CommonStrata.user, "show", true);
    this.splitterItemsDisposer();
  }

  @action.bound
  onUserPickLocation(
    pickedFeatures: PickedFeatures,
    pickedLocation: LatLonHeight
  ) {
    const t = this.props.t;
    const feature = pickedFeatures.features.find(
      f =>
        doesFeatureBelongToItem(f as Feature, this.leftItem) ||
        doesFeatureBelongToItem(f as Feature, this.rightItem)
    );

    if (feature) {
      this.leftItem.setTimeFilterFeature(
        feature,
        pickedFeatures.providerCoords
      );
      this.rightItem.setTimeFilterFeature(
        feature,
        pickedFeatures.providerCoords
      );
      this.location = pickedLocation;
      this.locationPickerMessages = {
        beforePick: t("diffTool.locationPicker.nextMessages.beforePick"),
        afterPick: t("diffTool.locationPicker.nextMessages.afterPick")
      };
    } else {
      this.locationPickerMessages = {
        beforePick: t("diffTool.locationPicker.errorMessages.beforePick"),
        afterPick: t("diffTool.locationPicker.errorMessages.afterPick")
      };
    }
  }

  @action.bound
  generateDiff() {
    if (
      this.leftItem.currentDiscreteJulianDate === undefined ||
      this.rightItem.currentDiscreteJulianDate === undefined ||
      this.diffStyle === undefined
    ) {
      return;
    }

    const terria = this.props.viewState.terria;
    terria.overlays.remove(this.rightItem);
    terria.showSplitter = false;
    this.diffItem.showDiffImage(
      this.leftItem.currentDiscreteJulianDate,
      this.rightItem.currentDiscreteJulianDate,
      this.diffStyle
    );
  }

  @action.bound
  removeGeneratedDiff() {
    const terria = this.props.viewState.terria;
    this.diffItem.clearDiffImage();
    terria.overlays.add(this.rightItem);
    terria.showSplitter = true;
  }

  componentDidMount() {
    this.enterDiffTool();
  }

  componentWillUnmount() {
    this.leaveDiffTool();
  }

  render() {
    const { viewState, t } = this.props;
    const terria = viewState.terria;
    const isShowingDiff = this.diffItem.isShowingDiff;
    const isReadyToGenerateDiff =
      this.location &&
      this.leftItem.currentDiscreteJulianDate &&
      this.rightItem.currentDiscreteJulianDate &&
      this.diffStyle !== undefined;

    return (
      <>
        <MainPanel isMapFullScreen={viewState.isMapFullScreen}>
          {isShowingDiff && (
            <BackButton onClick={this.removeGeneratedDiff}>
              &lt; Back
            </BackButton>
          )}
          <Text textLight medium>
            Compute the difference image for two dates
          </Text>
          {!isShowingDiff && (
            <Selector
              value={this.sourceItem.uniqueId}
              onChange={this.changeSourceItem}
            >
              <option disabled>Select source item</option>
              {this.diffableItemsInWorkbench.map(item => (
                <option key={item.uniqueId} value={item.uniqueId}>
                  {item.name}
                </option>
              ))}
            </Selector>
          )}
          <Text large textLight css="margin-top: 1em;">
            Styles
          </Text>
          {!isShowingDiff && (
            <Selector
              value={this.previewStyle}
              onChange={this.changePreviewStyle}
            >
              <option disabled value="">
                Choose a preview style
              </option>
              {this.diffItem.styleSelector?.availableStyles.map(style => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </Selector>
          )}
          <Selector
            value={this.diffStyle || ""}
            onChange={this.changeDiffStyle}
          >
            <option disabled value="">
              Choose a difference style
            </option>
            {this.diffItem.availableDiffStyles?.map(style => (
              <option key={style.id} value={style.id}>
                {style.name}
              </option>
            ))}
          </Selector>
          {this.legendUrl && <img src={this.legendUrl} />}
          {isReadyToGenerateDiff && !isShowingDiff && (
            <GenerateButton onClick={this.generateDiff}>
              {t("diffTool.generateDiffButtonText")}
            </GenerateButton>
          )}
        </MainPanel>
        {!isShowingDiff && (
          <LocationPicker
            terria={terria}
            location={this.location}
            messages={this.locationPickerMessages}
            onPick={this.onUserPickLocation}
          />
        )}
        {!isShowingDiff && (
          <DatePanel>
            <DatePicker
              item={this.leftItem}
              popupStyle={Styles.leftDatePickerPopup}
            />
            <DatePicker
              item={this.rightItem}
              popupStyle={Styles.rightDatePickerPopup}
            />
          </DatePanel>
        )}
      </>
    );
  }
}

const MainPanel = styled(Box).attrs({
  column: true,
  positionAbsolute: true,
  padded: true,
  paddedRatio: 3,
  styledWidth: "324px",
  charcoalGreyBg: true
})`
  top: 70px;
  left: 0px;
  min-height: 220px;
  margin-left: ${props =>
    props.isMapFullScreen ? 16 : parseInt(props.theme.workbenchWidth) + 40}px;
  transition: margin-left 0.25s;
  div:last-of-type {
    margin-bottom: auto; /* aligns the last item to the bottom of the panel */
  }
`;

const BackButton = styled(Button).attrs({
  secondary: true
})``;

const GenerateButton = styled(Button).attrs({
  primary: true,
  fullWidth: true
})`
  margin-top: 20px;
`;

const Selector = styled.select`
  max-width: 100%;
  margin-bottom: 1em;
`;

const DatePanel = styled(Box).attrs({
  centered: true,
  positionAbsolute: true,
  charcoalGreyBg: true,
  fullWidth: true,
  styledHeight: "80px"
})`
  z-index: 99999;
  left: 0;
  bottom: 0;

  > div {
    flex: 1;
    display: flex;
    justify-content: center;
    max-height: 64px;
  }
`;

function duplicateSourceItem(
  sourceItem: DiffableItem,
  splitDirection: ImagerySplitDirection
): DiffableItem {
  const item = sourceItem.duplicateModel(createGuid()) as DiffableItem;
  item.setTrait(CommonStrata.user, "splitDirection", splitDirection);
  item.setTrait(CommonStrata.user, "show", true);
  return item;
}

function doesFeatureBelongToItem(
  feature: Feature,
  item: DiffableItem
): Boolean {
  if (!Mappable.is(item)) return false;
  const imageryProvider = feature.imageryLayer?.imageryProvider;
  if (imageryProvider === undefined) return false;
  return (
    item.mapItems.find(
      m => ImageryParts.is(m) && m.imageryProvider === imageryProvider
    ) !== undefined
  );
}

export default hoistStatics(withTranslation()(DiffTool), DiffTool);
