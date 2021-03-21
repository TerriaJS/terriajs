import { TFunction } from "i18next";
import { action, computed } from "mobx";
import { observer } from "mobx-react";
import React from "react";
//@ts-ignore
import { sortable } from "react-anything-sortable";
import { WithTranslation, withTranslation } from "react-i18next";
import styled, { DefaultTheme } from "styled-components";
import getPath from "../../Core/getPath";
import isDefined from "../../Core/isDefined";
import CommonStrata from "../../Models/CommonStrata";
import ViewState from "../../ReactViewModels/ViewState";
import Box, { BoxSpan } from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import { Li } from "../../Styled/List";
import Icon, { StyledIcon } from "../Icon";
import PrivateIndicator from "../PrivateIndicator/PrivateIndicator";
import ChartItemSelector from "./Controls/ChartItemSelector";
import ColorScaleRangeSection from "./Controls/ColorScaleRangeSection";
import ConceptViewer from "./Controls/ConceptViewer";
import DateTimeSelectorSection from "./Controls/DateTimeSelectorSection";
import DimensionSelectorSection from "./Controls/DimensionSelectorSection";
import DisplayAsPercentSection from "./Controls/DisplayAsPercentSection";
import FilterSection from "./Controls/FilterSection";
import LeftRightSection from "./Controls/LeftRightSection";
import Legend from "./Controls/Legend";
import OpacitySection from "./Controls/OpacitySection";
import SatelliteImageryTimeFilterSection from "./Controls/SatelliteImageryTimeFilterSection";
import ShortReport from "./Controls/ShortReport";
import TimerSection from "./Controls/TimerSection";
import ViewingControls from "./Controls/ViewingControls";

interface IProps extends WithTranslation {
  theme: DefaultTheme;
  item: any;
  onMouseDown(): void;
  onTouchStart(): void;
  viewState: ViewState;
  className: any;
  style: any;
  t: TFunction;
  setWrapperState({}: any): void;
}

@observer
class WorkbenchItemRaw extends React.Component<IProps> {
  static displayName = "WorkbenchItem";
  constructor(props: IProps) {
    super(props);
  }

  @action.bound
  toggleDisplay() {
    this.props.item.setTrait(
      CommonStrata.user,
      "isOpenInWorkbench",
      !this.props.item.isOpenInWorkbench
    );
  }

  openModal() {
    this.props.setWrapperState({
      modalWindowIsOpen: true,
      activeTab: 1,
      previewed: this.props.item
    });
  }

  @action.bound
  toggleVisibility() {
    this.props.item.setTrait(CommonStrata.user, "show", !this.props.item.show);
  }

  @computed
  get isOpen(): boolean {
    return this.props.item.isOpenInWorkbench;
  }

  conceptViewer() {
    const item = this.props.item;
    if (
      isDefined(item.concepts) &&
      item.concepts.length > 0 &&
      item.displayChoicesBeforeLegend
    ) {
      <ConceptViewer item={item} />;
    }
  }

  render() {
    const { item, t } = this.props;
    return (
      <StyledLi
        style={this.props.style}
        isOpen={this.isOpen}
        className={this.props.className}
      >
        <Box fullWidth justifySpaceBetween padded>
          <Box fullWidth>
            {(true || item.supportsToggleShown) && (
              <Box left verticalCenter>
                <RawButton
                  onClick={() => this.toggleVisibility()}
                  title={t("workbench.toggleVisibility")}
                >
                  {item.show ? (
                    <StyledIcon
                      light
                      styledHeight={"14px"}
                      glyph={Icon.GLYPHS.checkboxOn}
                    />
                  ) : (
                    <StyledIcon
                      light
                      styledHeight={"14px"}
                      glyph={Icon.GLYPHS.checkboxOff}
                    />
                  )}
                </RawButton>
              </Box>
            )}
            <Box left fullWidth paddedHorizontally centered>
              <DraggableBox
                onMouseDown={this.props.onMouseDown}
                onTouchStart={this.props.onTouchStart}
                title={getPath(item, " → ")}
                fullWidth
              >
                {!(item as any).isMappable && (
                  <BoxSpan paddedHorizontally displayInlineBlock>
                    <StyledIcon
                      styledHeight={"18px"}
                      light
                      glyph={Icon.GLYPHS.lineChart}
                    />
                  </BoxSpan>
                )}
                {item.name}
              </DraggableBox>
            </Box>
          </Box>
          <Box centered paddedHorizontally>
            <RawButton onClick={() => this.toggleDisplay()}>
              {item.isPrivate && (
                <Box paddedHorizontally>
                  <PrivateIndicator inWorkbench />
                </Box>
              )}
              {item.isOpenInWorkbench ? (
                <StyledIcon styledHeight={"8px"} glyph={Icon.GLYPHS.opened} />
              ) : (
                <StyledIcon styledHeight={"8px"} glyph={Icon.GLYPHS.closed} />
              )}
            </RawButton>
          </Box>
        </Box>
        {item.isOpenInWorkbench && (
          <Box column paddedRatio={2}>
            <ViewingControls item={item} viewState={this.props.viewState} />
            <OpacitySection item={item} />
            <LeftRightSection item={item} />
            <TimerSection item={item} />
            {this.conceptViewer()}
            <ChartItemSelector item={item} />
            <FilterSection item={item} />
            <DateTimeSelectorSection item={item} />
            <SatelliteImageryTimeFilterSection item={item} />
            <DimensionSelectorSection item={item} />
            <ColorScaleRangeSection
              item={item}
              minValue={item.colorScaleMinimum}
              maxValue={item.colorScaleMaximum}
            />
            <DisplayAsPercentSection item={item} />
            {(item.shortReport ||
              (item.shortReportSections &&
                item.shortReportSections.length > 0)) && (
              <ShortReport item={item} />
            )}
            <Legend item={item} />
            {/* {defined(item.concepts) &&
              item.concepts.length > 0 &&
              !item.displayChoicesBeforeLegend && <ConceptViewer item={item} />} */}
          </Box>
        )}
      </StyledLi>
    );
  }
}

const DraggableBox = styled(Box)`
  cursor: move;
`;

const StyledLi = styled(Li)<{ isOpen: boolean }>`
  background: ${p => p.theme.darkWithOverlay};
  color: ${p => p.theme.textLight};
  border: 1px solid ${p => p.theme.overlay};
  margin-bottom: 5px;
  width: 100%;
`;

export default sortable(withTranslation()(WorkbenchItemRaw));
