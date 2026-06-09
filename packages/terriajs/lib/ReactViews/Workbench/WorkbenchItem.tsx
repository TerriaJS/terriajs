import { action } from "mobx";
import { observer } from "mobx-react";
import { sortable } from "react-anything-sortable";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import getPath from "../../Core/getPath";
import CatalogMemberMixin, {
  getName
} from "../../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../../ModelMixins/MappableMixin";
import ReferenceMixin from "../../ModelMixins/ReferenceMixin";
import CommonStrata from "../../Models/Definition/CommonStrata";
import { BaseModel } from "../../Models/Definition/Model";
import ViewState from "../../ReactViewModels/ViewState";
import Box, { BoxSpan } from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import Checkbox from "../../Styled/Checkbox/Checkbox";
import Icon, { StyledIcon } from "../../Styled/Icon";
import { Li } from "../../Styled/List";
import { TextSpan } from "../../Styled/Text";
import Loader from "../Loader";
import PrivateIndicator from "../PrivateIndicator/PrivateIndicator";
import WorkbenchItemControls from "./Controls/WorkbenchItemControls";

interface IProps {
  item: BaseModel;
  onMouseDown(): void;
  onTouchStart(): void;
  viewState: ViewState;
  className: any;
  style: any;
  setWrapperState(): void;
}

const WorkbenchItemRaw: React.FC<IProps> = observer((props) => {
  const { item, style, className, viewState, onMouseDown, onTouchStart } =
    props;

  const { t } = useTranslation();
  const theme = useTheme();

  const toggleDisplay = action(() => {
    if (!CatalogMemberMixin.isMixedInto(item)) return;
    item.setTrait(
      CommonStrata.user,
      "isOpenInWorkbench",
      !item.isOpenInWorkbench
    );
  });

  const toggleVisibility = action(() => {
    if (MappableMixin.isMixedInto(item)) {
      item.setTrait(CommonStrata.user, "show", !item.show);
    }
  });

  /** If workbench item is CatalogMember use CatalogMemberTraits.isOpenInWorkbench
   * Otherwise, defaults to true
   */
  const isOpen =
    !CatalogMemberMixin.isMixedInto(item) || item.isOpenInWorkbench;

  const isLoading =
    (CatalogMemberMixin.isMixedInto(item) && item.isLoading) ||
    (ReferenceMixin.isMixedInto(item) && item.isLoadingReference);

  return (
    <StyledLi style={style} className={className}>
      <Box fullWidth justifySpaceBetween paddedRatio={3} styledMinHeight="38px">
        <Box fullWidth>
          <Box left fullWidth centered>
            <DraggableBox
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
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
              {MappableMixin.isMixedInto(item) ? (
                <Box left verticalCenter>
                  <Checkbox
                    id="workbenchtoggleVisibility"
                    isChecked={item.show}
                    isSwitch
                    title={t("workbench.toggleVisibility")}
                    onChange={toggleVisibility}
                    css={`
                      overflow-wrap: anywhere;
                      margin-right: 5px;
                    `}
                    textProps={{ medium: true, fullWidth: true }}
                  >
                    <TextSpan
                      medium
                      maxLines={!isOpen ? 2 : false}
                      title={getName(item)}
                    >
                      {getName(item)}
                    </TextSpan>
                  </Checkbox>
                </Box>
              ) : (
                <TextSpan
                  medium
                  textLight
                  maxLines={!isOpen ? 2 : false}
                  title={getName(item)}
                  css={`
                    overflow-wrap: anywhere;
                  `}
                >
                  {getName(item)}
                </TextSpan>
              )}
            </DraggableBox>
          </Box>
        </Box>
        {CatalogMemberMixin.isMixedInto(item) ? (
          <Box centered paddedHorizontally>
            {item.isPrivate && (
              <BoxSpan paddedHorizontally>
                <PrivateIndicator inWorkbench />
              </BoxSpan>
            )}
            <RawButton onClick={toggleDisplay}>
              <BoxSpan padded>
                {isOpen ? (
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
        ) : null}
      </Box>
      {isOpen && (
        <Box
          column
          gap={3}
          paddedRatio={3}
          css={{
            borderTop: `1px solid ${theme.grey}`,
            color: theme.greyLighter
          }}
        >
          <WorkbenchItemControls item={item} viewState={viewState} />
          {isLoading ? (
            <Box paddedVertically>
              <Loader light />
            </Box>
          ) : null}
        </Box>
      )}
    </StyledLi>
  );
});

WorkbenchItemRaw.displayName = "WorkbenchItem";

const DraggableBox = styled(Box)`
  cursor: move;
`;

const StyledLi = styled(Li)`
  background: ${(p) => p.theme.darkWithOverlay};
  color: ${(p) => p.theme.textLight};
  border-radius: 8px;
  border: 1px solid ${(p) => p.theme.grey};
  width: 100%;

  margin-bottom: 20px;
  &:last-child {
    margin-bottom: 0px;
  }
`;

export default sortable(WorkbenchItemRaw);
