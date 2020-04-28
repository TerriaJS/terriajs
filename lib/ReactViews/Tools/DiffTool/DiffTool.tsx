import hoistStatics from "hoist-non-react-statics";
import { action, computed, observable, reaction, runInAction } from "mobx";
import { observer } from "mobx-react";
import { IDisposer } from "mobx-utils";
import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import styled from "styled-components";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";
import LatLonHeight from "../../../Core/LatLonHeight";
import PickedFeatures from "../../../Map/PickedFeatures";
import DiffableMixin from "../../../ModelMixins/DiffableMixin";
import CommonStrata from "../../../Models/CommonStrata";
import Feature from "../../../Models/Feature";
import Mappable, { ImageryParts } from "../../../Models/Mappable";
import SplitItemReference from "../../../Models/SplitItemReference";
import Terria from "../../../Models/Terria";
import ViewState from "../../../ReactViewModels/ViewState";
import DatePicker from "./DatePicker";
import Styles from "./diff-tool.scss";
import LocationPicker from "./LocationPicker";

type DiffableItem = DiffableMixin.Instance;

const Box: any = require("../../../Styled/Box").default;
const Button: any = require("../../../Styled/Button").default;
const Text: any = require("../../../Styled/Text").default;
const dateFormat = require("dateformat");

interface PropsType extends WithTranslation {
  viewState: ViewState;
  sourceItem: DiffableItem;
}

@observer
class DiffTool extends React.Component<PropsType> {
  static readonly toolName = "Image Difference";

  @observable private leftItem?: DiffableItem;
  @observable private rightItem?: DiffableItem;
  @observable private userSelectedSourceItem?: DiffableItem;

  private splitterItemsDisposer?: IDisposer;
  private originalSettings: any;

  @computed
  get sourceItem(): DiffableItem {
    return this.userSelectedSourceItem || this.props.sourceItem;
  }

  @action.bound
  changeSourceItem(sourceItem: DiffableItem) {
    this.userSelectedSourceItem = sourceItem;
  }

  @action
  async createSplitterItems() {
    try {
      const [leftItem, rightItem] = await Promise.all([
        createSplitItem(this.sourceItem, ImagerySplitDirection.LEFT),
        createSplitItem(this.sourceItem, ImagerySplitDirection.RIGHT)
      ]);
      runInAction(() => {
        this.leftItem = leftItem;
        this.rightItem = rightItem;
      });
    } catch {}
  }

  @action
  removeSplitterItems() {
    this.leftItem && removeSplitItem(this.leftItem);
    this.rightItem && removeSplitItem(this.rightItem);
  }

  @action
  enterDiffTool() {
    // Start the reaction that splits the sourceItem into left & right items
    this.splitterItemsDisposer = reaction(
      () => this.sourceItem,
      () => {
        this.removeSplitterItems();
        this.createSplitterItems();
      },
      { fireImmediately: true }
    );

    const viewState = this.props.viewState;
    const terria = viewState.terria;
    this.originalSettings = {
      showSplitter: terria.showSplitter,
      isMapFullScreen: viewState.isMapFullScreen
    };
    terria.showSplitter = true;
    viewState.isMapFullScreen = true;
    this.sourceItem.setTrait(CommonStrata.user, "show", false);
  }

  @action
  leaveDiffTool() {
    const viewState = this.props.viewState;
    const terria = viewState.terria;
    const originalSettings = this.originalSettings;
    this.removeSplitterItems();
    this.splitterItemsDisposer?.();
    terria.showSplitter = originalSettings.showSplitter;
    viewState.isMapFullScreen = originalSettings.isMapFullScreen;
    this.sourceItem.setTrait(CommonStrata.user, "show", true);
  }

  componentDidMount() {
    this.enterDiffTool();
  }

  componentWillUnmount() {
    this.leaveDiffTool();
  }

  render() {
    if (this.leftItem && this.rightItem) {
      return (
        <Main
          {...this.props}
          terria={this.props.viewState.terria}
          sourceItem={this.sourceItem}
          changeSourceItem={this.changeSourceItem}
          leftItem={this.leftItem}
          rightItem={this.rightItem}
        />
      );
    } else return null;
  }
}

interface MainPropsType extends PropsType {
  terria: Terria;
  leftItem: DiffableItem;
  rightItem: DiffableItem;
  changeSourceItem: (newSourceItem: DiffableItem) => void;
}

@observer
class Main extends React.Component<MainPropsType> {
  @observable private location?: LatLonHeight;
  @observable private locationPickerMessages: {
    beforePick: string;
    afterPick: string;
  };

  constructor(props: MainPropsType) {
    super(props);
    this.locationPickerMessages = {
      beforePick: props.t("diffTool.locationPicker.initialMessages.beforePick"),
      afterPick: props.t("diffTool.locationPicker.initialMessages.afterPick")
    };
  }

  @computed
  get diffItem() {
    return this.props.leftItem;
  }

  @computed
  get diffItemName() {
    const name = this.diffItem.name || "";
    const firstDate = this.leftDate;
    const secondDate = this.rightDate;
    const format = "yyyy/mm/dd";
    if (!firstDate || !secondDate) {
      return name;
    } else {
      const d1 = dateFormat(firstDate, format);
      const d2 = dateFormat(secondDate, format);
      return `${name} - difference for dates ${d1}, ${d2}`;
    }
  }

  @computed
  get diffableItemsInWorkbench(): DiffableItem[] {
    return this.props.terria.workbench.items.filter(item =>
      DiffableMixin.isMixedInto(item)
    ) as DiffableItem[];
  }

  @computed
  get previewStyle(): string | undefined {
    return this.diffItem.styleSelector?.activeStyleId;
  }

  @computed
  get diffStyle(): string | undefined {
    return this.diffItem.diffStyleId;
  }

  @computed
  get leftDate(): JulianDate | undefined {
    return this.props.leftItem.currentDiscreteJulianDate;
  }

  @computed
  get rightDate(): JulianDate | undefined {
    return this.props.rightItem.currentDiscreteJulianDate;
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
  changeSourceItem(e: React.ChangeEvent<HTMLSelectElement>) {
    const newSourceItem = this.diffableItemsInWorkbench.find(
      item => item.uniqueId === e.target.value
    );
    if (newSourceItem) this.props.changeSourceItem(newSourceItem);
  }

  @action.bound
  changePreviewStyle(e: React.ChangeEvent<HTMLSelectElement>) {
    const styleId = e.target.value;
    this.props.leftItem.styleSelector?.chooseActiveStyle(
      CommonStrata.user,
      styleId
    );
    this.props.rightItem.styleSelector?.chooseActiveStyle(
      CommonStrata.user,
      styleId
    );
  }

  @action.bound
  changeDiffStyle(e: React.ChangeEvent<HTMLSelectElement>) {
    this.diffItem.setTrait(CommonStrata.user, "diffStyleId", e.target.value);
  }

  @action.bound
  onUserPickLocation(
    pickedFeatures: PickedFeatures,
    pickedLocation: LatLonHeight
  ) {
    const { leftItem, rightItem, t } = this.props;
    const feature = pickedFeatures.features.find(
      f =>
        doesFeatureBelongToItem(f as Feature, leftItem) ||
        doesFeatureBelongToItem(f as Feature, rightItem)
    );

    if (feature) {
      leftItem.setTimeFilterFeature(feature, pickedFeatures.providerCoords);
      rightItem.setTimeFilterFeature(feature, pickedFeatures.providerCoords);
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
      this.leftDate === undefined ||
      this.rightDate === undefined ||
      this.diffStyle === undefined
    ) {
      return;
    }

    const terria = this.props.terria;
    terria.overlays.remove(this.props.leftItem);
    terria.overlays.remove(this.props.rightItem);
    terria.workbench.add(this.diffItem);

    this.diffItem.setTrait(CommonStrata.user, "name", this.diffItemName);
    this.diffItem.showDiffImage(this.leftDate, this.rightDate, this.diffStyle);
    terria.showSplitter = false;
  }

  @action.bound
  resetTool() {
    const terria = this.props.terria;
    this.diffItem.clearDiffImage();
    terria.overlays.add(this.props.leftItem);
    terria.overlays.add(this.props.rightItem);
    terria.workbench.remove(this.diffItem);
    this.props.terria.showSplitter = true;
  }

  render() {
    const { terria, viewState, sourceItem, t } = this.props;
    const isShowingDiff = this.diffItem.isShowingDiff;
    const isReadyToGenerateDiff =
      this.location &&
      this.leftDate &&
      this.rightDate &&
      this.diffStyle !== undefined;

    return (
      <>
        <MainPanel isMapFullScreen={viewState.isMapFullScreen}>
          {isShowingDiff && (
            <BackButton onClick={this.resetTool}>&lt; Back</BackButton>
          )}
          <Text textLight medium>
            Compute the difference image for two dates
          </Text>
          {!isShowingDiff && (
            <Selector
              value={sourceItem.uniqueId}
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
              item={this.props.leftItem}
              popupStyle={Styles.leftDatePickerPopup}
            />
            <DatePicker
              item={this.props.rightItem}
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

async function createSplitItem(
  sourceItem: DiffableItem,
  splitDirection: ImagerySplitDirection
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
    terria.overlays.add(newItem);
    return newItem;
  });
}

function removeSplitItem(item: DiffableItem) {
  const terria = item.terria;
  terria.overlays.remove(item);
  if (item.sourceReference && terria.workbench.contains(item) === false) {
    terria.removeModelReferences(item.sourceReference);
  }
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
