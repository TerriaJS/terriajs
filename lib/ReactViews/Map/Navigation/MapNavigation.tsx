import { TFunction } from "i18next";
import { debounce } from "lodash-es";
import {
  action,
  computed,
  IReactionDisposer,
  observable,
  reaction,
  runInAction
} from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import styled, { DefaultTheme, withTheme } from "styled-components";
import isDefined from "../../../Core/isDefined";
import { useTranslationIfExists } from "../../../Language/languageHelpers";
import Terria from "../../../Models/Terria";
import ViewState from "../../../ReactViewModels/ViewState";
import Prompt from "../../Generic/Prompt";
import { Medium } from "../../Generic/Responsive";
import Icon, { GLYPHS } from "../../Icon";
import MapIconButton from "../../MapIconButton/MapIconButton";
import MapNavigationModel, {
  MapNavigationItem,
  MapNavigationItemExtended
} from "./MapNavigationModel";
import { registerMapNavigations } from "./registerMapNavigations";

const Box = require("../../../Styled/Box").default;
const Text = require("../../../Styled/Text").default;

interface StyledMapNavigationProps {
  trainerBarVisible: boolean;
  theme: DefaultTheme;
}

/**
 * TODO: fix this so that we don't need to override pointer events like this.
 * a fix would look like breaking up the top and bottom parts, so there is
 * no element "drawn/painted" between the top and bottom parts of map
 * navigation
 */
const StyledMapNavigation = styled.div<StyledMapNavigationProps>`
  position: absolute;
  right: 5px;
  z-index: 1;
  bottom: 25px;
  @media (min-width: ${props => props.theme.sm}px) {
    top: 80px;
    bottom: 50px;
    right: 16px;
  }
  @media (max-width: ${props => props.theme.mobile}px) {
    & > div {
      flex-direction: row;
    }
  }
  pointer-events: none;
  button {
    pointer-events: auto;
  }
  ${p =>
    p.trainerBarVisible &&
    `
    top: ${Number(p.theme.trainerHeight) + Number(p.theme.mapNavigationTop)}px;
  `}
`;

export const Control = styled(Box).attrs({
  centered: true,
  column: true
})`
  pointer-events: auto;
  @media (min-width: ${props => props.theme.sm}px) {
    margin: 0;
    padding-top: 10px;
    height: auto;
  }
  @media (max-width: ${props => props.theme.mobile}px) {
    padding-right: 10px;
    margin-bottom: 5px;
  }
  text-align: center;
`;

const ControlWrapper = styled(Box)`
  @media (min-width: ${props => props.theme.sm}px) {
    & > :first-child {
      margin-top: 0 !important;
      padding-top: 0 !important;
    }
  }
`;

interface PropTypes extends WithTranslation {
  viewState: ViewState;
  theme: DefaultTheme;
  t: TFunction;
  navItems: any[];
}

enum Orientation {
  HORIZONTAL,
  VERTICAL
}

@observer
class MapNavigation extends React.Component<PropTypes> {
  static displayName = "MapNavigation";
  private navigationRef = React.createRef<HTMLDivElement>();
  private resizeListener: () => any;
  private viewState: ViewState;
  private itemSizeInBar: Map<string, number>;
  @observable private model: MapNavigationModel;
  @observable private overflows: boolean;
  private activeItemDisposer: IReactionDisposer | undefined;
  constructor(props: PropTypes) {
    super(props);
    registerMapNavigations(props.viewState);
    this.viewState = props.viewState;
    this.model = props.viewState.terria.mapNavigationModel;
    this.resizeListener = debounce(() => this.updateNavigation(), 250);
    this.itemSizeInBar = new Map<string, number>();
    this.computeSizes(this.model.enabledItems);
    this.overflows = this.model.enabledItems.some(item => item.forceCollapsed);
    this.activeItemDisposer = reaction(
      () => this.model.activeItem,
      () => {
        this.updateNavigation();
      }
    );
  }

  componentDidMount() {
    this.computeSizes(this.model.enabledItems);
    this.updateNavigation();
    window.addEventListener("resize", this.resizeListener, false);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resizeListener);
    if (this.activeItemDisposer) {
      this.activeItemDisposer();
    }
  }

  @computed
  get orientation(): Orientation {
    return this.viewState.useSmallScreenInterface
      ? Orientation.HORIZONTAL
      : Orientation.VERTICAL;
  }

  private computeSizes(items: MapNavigationItemExtended[]): void {
    items.forEach(item => {
      if (this.orientation === Orientation.VERTICAL) {
        if (item.itemRef && item.itemRef.current) {
          this.itemSizeInBar.set(item.id, item.itemRef.current.offsetHeight);
        } else {
          this.itemSizeInBar.set(item.id, item.height);
        }
      } else {
        if (item.itemRef && item.itemRef.current) {
          this.itemSizeInBar.set(item.id, item.itemRef.current.offsetWidth);
        } else {
          this.itemSizeInBar.set(item.id, item.width);
        }
      }
    });
  }

  /**
   * Check if we need to collapse navigation items and determine which one need to be collapsed.
   */
  @action
  private updateNavigation(): void {
    if (!this.navigationRef.current) {
      // navigation bar has not been rendered yet so there is nothing to update.
      return;
    }
    if (this.computeSizes.length !== this.model.enabledItems.length) {
      this.computeSizes(this.model.enabledItems);
    }
    let itemsToShowId = this.model.enabledItems
      .filter(item => filterViewerScreenSize(item, this.viewState))
      .map(item => item.id);
    // items we have to show in the navigation bar
    let pinnedItemsId = this.model.pinnedItems
      .filter(item => filterViewerScreenSize(item, this.viewState))
      .map(item => item.id);
    // items that are possible to be collapsed
    let possibleToCollapseId = itemsToShowId.filter(
      itemId => !pinnedItemsId.includes(itemId)
    );
    let overflows = false;
    let maxVisible = itemsToShowId.length;
    let size = 0;
    if (this.overflows) {
      size += 42; //this.options.overflowActionSize;
    }
    const limit =
      this.orientation === Orientation.VERTICAL
        ? this.navigationRef.current.clientHeight
        : this.navigationRef.current.parentElement?.parentElement
        ? this.navigationRef.current.parentElement?.parentElement?.clientWidth -
          100
        : this.navigationRef.current.clientWidth;

    for (let i = 0; i < itemsToShowId.length && size <= limit; i++) {
      size += this.itemSizeInBar.get(itemsToShowId[i]) || 0;
      if (size > limit) {
        maxVisible = i;
      }
    }
    if (pinnedItemsId.length > maxVisible) {
      possibleToCollapseId.forEach(id => {
        this.model.collapseItem(id);
      });
      //there is nothing else we can do, we have to show all items as it is.
      return;
    }
    overflows = itemsToShowId.length > maxVisible;

    if (overflows) {
      maxVisible = maxVisible - pinnedItemsId.length;
      size -= this.itemSizeInBar.get(possibleToCollapseId[maxVisible]) || 0;
      possibleToCollapseId = possibleToCollapseId.slice(0, maxVisible);
      if (!this.overflows) {
        // overflow is not currently visible so add its height here
        size += 42; //this.options.overflowActionSize;
      }
    }

    // Check if we need to make extra room for the overflow action
    if (size > limit) {
      size -= this.itemSizeInBar.get(possibleToCollapseId.pop()!)!;
    }

    if (
      this.model.activeItem &&
      possibleToCollapseId.every(
        itemId => !!this.model.activeItem && itemId !== this.model.activeItem.id
      )
    ) {
      const removedItem = possibleToCollapseId.pop()!;
      size =
        size -
        this.itemSizeInBar.get(removedItem)! +
        this.itemSizeInBar.get(this.model.activeItem.id)!;
      possibleToCollapseId.push(this.model.activeItem.id);
    }

    // The active composite might have bigger size than the removed composite, check for overflow again
    if (size > limit) {
      possibleToCollapseId.length
        ? possibleToCollapseId.splice(possibleToCollapseId.length - 2, 1)
        : possibleToCollapseId.pop();
    }

    if (overflows) {
      this.overflows = true;
    } else {
      this.overflows = this.model.enabledItems.some(
        item => item.forceCollapsed
      );
    }
    itemsToShowId = [...pinnedItemsId, ...possibleToCollapseId];
    this.model.enabledItems.forEach(item => {
      if (!itemsToShowId.includes(item.id)) {
        this.model.collapseItem(item.id);
      } else {
        this.model.uncollapseItem(item.id);
      }
    });
  }

  render() {
    const { viewState, t } = this.props;
    const terria = viewState.terria;
    let items = terria.mapNavigationModel.visibleItems.filter(item =>
      filterViewerScreenSize(item, this.viewState)
    );
    let bottomItems: MapNavigationItemExtended[] | undefined;
    if (!this.overflows && this.orientation !== Orientation.HORIZONTAL) {
      bottomItems = items.filter(item => item.location === "BOTTOM");
      items = items.filter(item => item.location === "TOP");
    }
    return (
      <StyledMapNavigation trainerBarVisible={viewState.trainerBarVisible}>
        <Box
          centered
          column
          justifySpaceBetween
          fullHeight
          alignItemsFlexEnd
          ref={this.navigationRef}
        >
          <ControlWrapper
            column={this.orientation === Orientation.VERTICAL}
            css={`
              ${this.orientation === Orientation.HORIZONTAL &&
                `margin-bottom: 5px;`}
            `}
          >
            {items.map(item =>
              item.render ? (
                <Control key={item.id}>{item.render}</Control>
              ) : (
                <MapNavigationItemRender
                  key={item.id}
                  item={item}
                  terria={terria}
                />
              )
            )}
            {this.overflows && (
              <Control key={"asdd"}>
                <MapIconButton
                  expandInPlace
                  iconElement={() => <Icon glyph={GLYPHS.add} />}
                  title={t("mapNavigation.additionalToolsTitle")}
                  onClick={() =>
                    runInAction(() => {
                      viewState.showCollapsedNavigation = true;
                    })
                  }
                >
                  {t("mapNavigation.additionalTools")}
                </MapIconButton>
              </Control>
            )}
          </ControlWrapper>
          <ControlWrapper column={this.orientation === Orientation.VERTICAL}>
            {bottomItems?.map(item =>
              item.render ? (
                <Control key={item.id}>{item.render}</Control>
              ) : (
                <MapNavigationItemRender
                  key={item.id}
                  item={item}
                  terria={terria}
                />
              )
            )}
            <Medium>
              <Prompt
                content={
                  <div>
                    <Text bold extraLarge textLight>
                      {t("helpPanel.promptMessage")}
                    </Text>
                  </div>
                }
                displayDelay={500}
                dismissText={t("helpPanel.dismissText")}
                dismissAction={() => {
                  runInAction(() =>
                    viewState.toggleFeaturePrompt("help", false, true)
                  );
                }}
                caretTopOffset={75}
                caretLeftOffset={265}
                caretSize={15}
                promptWidth={273}
                promptTopOffset={20}
                promptLeftOffset={-330}
                isVisible={viewState.featurePrompts.indexOf("help") >= 0}
              />
            </Medium>
          </ControlWrapper>
        </Box>
      </StyledMapNavigation>
    );
  }
}

export default withTranslation()(withTheme(MapNavigation));

interface ItemPropTypes {
  item: MapNavigationItem;
  terria: Terria;
}

@observer
class MapNavigationItemRender extends React.Component<ItemPropTypes> {
  constructor(props: ItemPropTypes) {
    super(props);
  }
  render() {
    const { item } = this.props;
    return (
      <Control ref={item.itemRef}>
        <MapIconButton
          expandInPlace
          iconElement={() => <Icon glyph={item.glyph} />}
          title={useTranslationIfExists(item.title || item.name)}
          onClick={() => {
            if (item.onClick) {
              this.props.terria.mapNavigationModel.activateItem(item.id);
              item.onClick();
            }
          }}
          disabled={item.mapIconButtonProps?.disabled}
          primary={item.mapIconButtonProps?.primary}
          splitter={item.mapIconButtonProps?.splitter}
        >
          {useTranslationIfExists(item.name)}
        </MapIconButton>
      </Control>
    );
  }
}

export function filterViewerScreenSize(
  item: MapNavigationItemExtended,
  viewState: ViewState
) {
  const currentViewer = viewState.terria.mainViewer.viewerMode;
  if (viewState.useSmallScreenInterface) {
    return (
      (!isDefined(item.viewerMode) || item.viewerMode === currentViewer) &&
      (!isDefined(item.screenSize) || item.screenSize === "small")
    );
  } else {
    return (
      (!isDefined(item.viewerMode) || item.viewerMode === currentViewer) &&
      (!isDefined(item.screenSize) || item.screenSize === "medium")
    );
  }
}
