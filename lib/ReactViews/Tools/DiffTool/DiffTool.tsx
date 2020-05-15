import hoistStatics from "hoist-non-react-statics";
import { action, computed, observable, reaction, runInAction } from "mobx";
import { observer } from "mobx-react";
import { IDisposer } from "mobx-utils";
import React, { useState } from "react";
import { TFunction } from "i18next";
import { WithTranslation, withTranslation } from "react-i18next";
import { DefaultTheme, withTheme } from "styled-components";
import styled, { useTheme } from "styled-components";
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
import { StyledIcon, GLYPHS } from "../../Icon";
import ViewState from "../../../ReactViewModels/ViewState";
import DatePicker from "./DatePicker";
import Styles from "./diff-tool.scss";
import LocationPicker from "./LocationPicker";

type DiffableItem = DiffableMixin.Instance;

const Box: any = require("../../../Styled/Box").default;
const Button: any = require("../../../Styled/Button").default;
const RawButton: any = require("../../../Styled/Button").RawButton;
const Text: any = require("../../../Styled/Text").default;
const Spacing: any = require("../../../Styled/Spacing").default;
import Select from "../../../Styled/Select";
const dateFormat = require("dateformat");

interface PropsType extends WithTranslation {
  viewState: ViewState;
  sourceItem: DiffableItem;
  theme: DefaultTheme;
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
          theme={this.props.theme}
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
    const name = this.props.sourceItem.name || "";
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
    return this.props.terria.workbench.items.filter(
      item => DiffableMixin.isMixedInto(item) && item.canDiffImages
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
    this.props.leftItem.setTrait(
      CommonStrata.user,
      "splitDirection",
      ImagerySplitDirection.LEFT
    );
    this.props.rightItem.setTrait(
      CommonStrata.user,
      "splitDirection",
      ImagerySplitDirection.RIGHT
    );
  }

  // i want to restructure the render so that there's 2 distinct "showing diff"
  // or not states, right now intertwining them means way too many conditionals
  // that confuse the required spacing etc.
  render() {
    const { terria, viewState, sourceItem, t, theme } = this.props;
    const isShowingDiff = this.diffItem.isShowingDiff;
    const isReadyToGenerateDiff =
      this.location &&
      this.leftDate &&
      this.rightDate &&
      this.diffStyle !== undefined;

    return (
      <Text large>
        <DiffAccordion viewState={viewState} t={t}>
          <MainPanel isMapFullScreen={viewState.isMapFullScreen}>
            {isShowingDiff && (
              <>
                <Box centered left>
                  <BackButton
                    css={`
                      color: ${theme.textLight};
                      border-color: ${theme.textLight};
                    `}
                    transparentBg
                    onClick={this.resetTool}
                  >
                    <Box centered>
                      <StyledIcon
                        css="transform:rotate(90deg);"
                        light
                        styledWidth="16px"
                        glyph={GLYPHS.arrowDown}
                      />
                      <Text noFontSize>{t("general.back")}</Text>
                    </Box>
                  </BackButton>
                </Box>
                <Spacing bottom={3} />
                <Text medium textLight>
                  {t("diffTool.differenceResultsTitle")}
                </Text>
                <Spacing bottom={2} />
              </>
            )}
            <Text textLight>{t("diffTool.computeDifference")}</Text>
            {isShowingDiff && <Spacing bottom={3} />}
            {!isShowingDiff && (
              <>
                <Spacing bottom={4} />
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
              </>
            )}
            {!isShowingDiff && (
              <>
                <Spacing bottom={4} />
                <Text textLight>{t("diffTool.styles")}</Text>
                <Spacing bottom={2} />
                <Selector
                  spacingBottom
                  value={this.previewStyle}
                  onChange={this.changePreviewStyle}
                >
                  <option disabled value="">
                    {t("diffTool.choosePreview")}
                  </option>
                  {this.diffItem.styleSelector?.availableStyles.map(style => (
                    <option key={style.id} value={style.id}>
                      {style.name}
                    </option>
                  ))}
                </Selector>
              </>
            )}
            <Selector
              value={this.diffStyle || ""}
              onChange={this.changeDiffStyle}
            >
              <option disabled value="">
                {t("diffTool.chooseDifference")}
              </option>
              {this.diffItem.availableDiffStyles?.map(style => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </Selector>
            {this.legendUrl && (
              <>
                <Spacing bottom={2} />
                <img width="100%" src={this.legendUrl} />
              </>
            )}
            {isReadyToGenerateDiff && !isShowingDiff && (
              <>
                <Spacing bottom={4} />
                <GenerateButton onClick={this.generateDiff}>
                  {t("diffTool.generateDiffButtonText")}
                </GenerateButton>
              </>
            )}
          </MainPanel>
        </DiffAccordion>
        {isShowingDiff && (
          // rushing a bunch of this inline css!
          <CloseDifferenceButton
            theme={theme}
            activeStyles
            onClick={this.resetTool}
          >
            <StyledIcon light styledWidth="19px" glyph={GLYPHS.closeLight} />
          </CloseDifferenceButton>
        )}
        {!isShowingDiff && (
          <LocationPicker
            terria={terria}
            location={this.location}
            title={t("diffTool.locationPicker.title")}
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
      </Text>
    );
  }
}

interface DiffAccordionProps {
  viewState: ViewState;
  t: TFunction;
}

const DiffAccordion: React.FC<DiffAccordionProps> = props => {
  const [showChildren, setShowChildren] = useState(true);
  const { t, viewState } = props;
  const theme = useTheme();
  return (
    <DiffAccordionWrapper isMapFullScreen={viewState.isMapFullScreen} column>
      <Box
        paddedVertically
        paddedHorizontally={2}
        centered
        justifySpaceBetween
        backgroundColor={theme.colorSplitter}
      >
        <Box centered>
          <StyledIcon styledWidth="20px" light glyph={GLYPHS.difference} />
          <Spacing right={1} />
          {/* font-size is non standard with what we have so far in terria,
          lineheight as well to hit nonstandard paddings */}
          <Text css={"font-size: 17px;line-height: 26px;"} textLight>
            {t("diffTool.title")}
          </Text>
        </Box>
        {/* margin-right 5px for the padded button offset - larger click area
        but visible should be inline with rest of box */}
        <Box centered css={"margin-right:-5px;"}>
          <RawButton onClick={() => viewState.closeTool()}>
            <Text textLight small semiBold uppercase>
              {t("diffTool.exit")}
            </Text>
          </RawButton>
          <Spacing right={1} />
          <RawButton onClick={() => setShowChildren(!showChildren)}>
            <Box paddedRatio={1} centered>
              <StyledIcon
                styledWidth="12px"
                light
                glyph={showChildren ? GLYPHS.opened : GLYPHS.closed}
              />
            </Box>
          </RawButton>
        </Box>
      </Box>
      {showChildren && props.children}
    </DiffAccordionWrapper>
  );
};

const DiffAccordionWrapper = styled(Box).attrs({
  column: true,
  positionAbsolute: true,
  styledWidth: "324px"
  // charcoalGreyBg: true
})`
  top: 70px;
  left: 0px;
  min-height: 220px;
  margin-left: ${props =>
    props.isMapFullScreen ? 16 : parseInt(props.theme.workbenchWidth) + 40}px;
  transition: margin-left 0.25s;
`;

const MainPanel = styled(Box).attrs({
  column: true,
  paddedRatio: 2,
  charcoalGreyBg: true
})``;

const BackButton = styled(Button).attrs({
  secondary: true
})``;

const CloseDifferenceButton = styled(RawButton)`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 60px;

  border-radius: 50%;
  padding: 13px;
  color: ${p => p.theme.textLight};
  border-color: ${p => p.theme.textLight};
  background-color: ${p => p.theme.colorPrimary};
`;

const GenerateButton = styled(Button).attrs({
  primary: true,
  fullWidth: true
})``;

const Selector = (props: any) => (
  <Box fullWidth column>
    <Select {...props}>{props.children}</Select>
    {props.spacingBottom && <Spacing bottom={2} />}
  </Box>
);

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

export default hoistStatics(withTranslation()(withTheme(DiffTool)), DiffTool);
