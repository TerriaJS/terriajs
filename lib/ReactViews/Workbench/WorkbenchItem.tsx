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
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import CommonStrata from "../../Models/Definition/CommonStrata";
import ViewState from "../../ReactViewModels/ViewState";
import Box, { BoxSpan } from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import Checkbox from "../../Styled/Checkbox/Checkbox";
import Icon, { StyledIcon } from "../../Styled/Icon";
import { Li } from "../../Styled/List";
import Spacing from "../../Styled/Spacing";
import { TextSpan } from "../../Styled/Text";
import Loader from "../Loader";
import PrivateIndicator from "../PrivateIndicator/PrivateIndicator";
import ChartItemSelector from "./Controls/ChartItemSelector";
import ColorScaleRangeSection from "./Controls/ColorScaleRangeSection";
import DateTimeSelectorSection from "./Controls/DateTimeSelectorSection";
import DimensionSelectorSection from "./Controls/DimensionSelectorSection";
import DisplayAsPercentSection from "./Controls/DisplayAsPercentSection";
import FilterSection from "./Controls/FilterSection";
import LeftRightSection from "./Controls/LeftRightSection";
import Legend from "./Controls/Legend";
import OpacitySection from "./Controls/OpacitySection";
import SatelliteImageryTimeFilterSection from "./Controls/SatelliteImageryTimeFilterSection";
import { ScaleWorkbenchInfo } from "./Controls/ScaleWorkbenchInfo";
import ShortReport from "./Controls/ShortReport";
import TimerSection from "./Controls/TimerSection";
import ViewingControls from "./Controls/ViewingControls";
import ReferenceMixin from "../../ModelMixins/ReferenceMixin";
import { DEFAULT_PLACEMENT } from "../../Models/SelectableDimensions";

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

  @action.bound
  toggleVisibility() {
    this.props.item.setTrait(CommonStrata.user, "show", !this.props.item.show);
  }

  @computed
  get isOpen(): boolean {
    return this.props.item.isOpenInWorkbench;
  }

  render() {
    const { item, t } = this.props;

    const isLoading =
      (CatalogMemberMixin.isMixedInto(item) && item.isLoading) ||
      (ReferenceMixin.isMixedInto(item) && item.isLoadingReference);

    return (
      <StyledLi style={this.props.style} className={this.props.className}>
        <Box fullWidth justifySpaceBetween padded>
          <Box fullWidth>
            <Box left fullWidth paddedHorizontally centered>
              <DraggableBox
                onMouseDown={this.props.onMouseDown}
                onTouchStart={this.props.onTouchStart}
                title={getPath(item, " → ")}
                fullWidth
              >
                {!(item as any).isMappable && !isLoading && (
                  <BoxSpan paddedHorizontally displayInlineBlock>
                    <Box padded>
                      <StyledIcon
                        styledHeight={"18px"}
                        light
                        glyph={Icon.GLYPHS.lineChart}
                      />
                    </Box>
                  </BoxSpan>
                )}
                {true || item.supportsToggleShown ? (
                  <Box
                    left
                    verticalCenter
                    css={`
                      padding-left: 5px;
                    `}
                  >
                    <Checkbox
                      id="workbenchtoggleVisibility"
                      isChecked={item.show}
                      title={t("workbench.toggleVisibility")}
                      onChange={() => this.toggleVisibility()}
                      css={`
                        overflow-wrap: anywhere;
                      `}
                      textProps={{ medium: true }}
                    >
                      <TextSpan medium>{item.name}</TextSpan>
                    </Checkbox>
                  </Box>
                ) : (
                  <TextSpan
                    medium
                    textLight
                    css={`
                      overflow-wrap: anywhere;
                    `}
                  >
                    {item.name}
                  </TextSpan>
                )}
              </DraggableBox>
            </Box>
          </Box>
          <Box centered paddedHorizontally>
            <RawButton onClick={() => this.toggleDisplay()}>
              {item.isPrivate && (
                <BoxSpan paddedHorizontally>
                  <PrivateIndicator inWorkbench />
                </BoxSpan>
              )}
              <BoxSpan padded>
                {item.isOpenInWorkbench ? (
                  <StyledIcon
                    styledHeight={"8px"}
                    light
                    glyph={Icon.GLYPHS.opened}
                  />
                ) : (
                  <StyledIcon
                    styledHeight={"8px"}
                    light
                    glyph={Icon.GLYPHS.closed}
                  />
                )}
              </BoxSpan>
            </RawButton>
          </Box>
        </Box>
        {item.isOpenInWorkbench && (
          <>
            <Spacing bottom={1} />
            <Box column paddedHorizontally={2}>
              <ViewingControls item={item} viewState={this.props.viewState} />
              <OpacitySection item={item} />
              <ScaleWorkbenchInfo item={item} />
              <LeftRightSection item={item} />
              <TimerSection item={item} />
              <ChartItemSelector item={item} />
              <FilterSection item={item} />
              <DateTimeSelectorSection item={item} />
              <SatelliteImageryTimeFilterSection item={item} />
              <DimensionSelectorSection
                item={item}
                placement={DEFAULT_PLACEMENT}
              />
              <ColorScaleRangeSection
                item={item}
                minValue={item.colorScaleMinimum}
                maxValue={item.colorScaleMaximum}
              />
              {item.shortReport ||
              (item.shortReportSections &&
                item.shortReportSections.length > 0) ? (
                <ShortReport item={item} />
              ) : null}
              <Legend item={item} />
              <DimensionSelectorSection item={item} placement={"belowLegend"} />
              {isLoading ? (
                <Box paddedVertically>
                  <Loader light />
                </Box>
              ) : null}
            </Box>
            <Spacing bottom={2} />
          </>
        )}
      </StyledLi>
    );
  }
}

const DraggableBox = styled(Box)`
  cursor: move;
`;

const StyledLi = styled(Li)`
  background: ${p => p.theme.darkWithOverlay};
  color: ${p => p.theme.textLight};
  border-radius: 2px;
  margin-bottom: 5px;
  width: 100%;
`;

export default sortable(withTranslation()(WorkbenchItemRaw));
