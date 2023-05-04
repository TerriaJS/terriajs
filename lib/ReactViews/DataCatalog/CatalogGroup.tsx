import React, { FC, useRef, useEffect, MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import { observer } from "mobx-react";

import PrivateIndicator from "../PrivateIndicator/PrivateIndicator";

import Loader from "../Loader";
import Icon, { StyledIcon, GLYPHS } from "../../Styled/Icon";
import Box, { BoxSpan } from "../../Styled/Box";
import Text, { TextSpan } from "../../Styled/Text";
import Ul, { Li } from "../../Styled/List";
import { RawButton } from "../../Styled/Button";

import Spacing from "../../Styled/Spacing";

const CatalogGroupBox = styled(Box).attrs({
  centered: true,
  fullWidth: true,
  gap: true,
  paddedRatio: 1.6,
  pr: 0
})<{ selected: boolean }>`
  &:hover,
  &:focus {
    cursor: pointer;
    color: ${(props) => props.theme.textLight};
    background-color: ${(props) => props.theme.modalHighlight};
  }
  ${(props) =>
    props.selected &&
    `
      color: ${props.theme.textLight};
      background-color: ${props.theme.modalHighlight};
    `}
  text-align: left;
  word-break: normal;
  overflow-wrap: anywhere;

  @media (max-width: ${(p) => p.theme.sm}px) {
    font-size: 0.9rem;
    padding-top: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid ${(p) => p.theme.greyLighter};
  }
`;

interface ICatalogGroupProps {
  text: string;
  isPrivate: boolean;
  title: string;
  topLevel: boolean;
  open: boolean;
  loading: boolean;
  emptyMessage?: string;

  onClick: () => void;
  selected?: boolean;

  trashable?: boolean;
  onTrashClick?: () => void;

  displayGroup: boolean;
  allItemsLoaded?: boolean;
  addRemoveButtonFunction?: (event: MouseEvent<HTMLButtonElement>) => void;
}

const FolderIcon: FC<{ open: boolean }> = ({ open }) => {
  return open ? (
    <StyledIcon styledWidth="14px" glyph={GLYPHS.folderOpen} />
  ) : (
    <StyledIcon styledWidth="14px" glyph={GLYPHS.folder} />
  );
};

const GroupCaret: FC<{ open: boolean }> = ({ open }) => {
  return open ? (
    <StyledIcon styledWidth="10px" glyph={GLYPHS.opened} />
  ) : (
    <StyledIcon styledWidth="10px" glyph={GLYPHS.closed} />
  );
};

/**
 * Dumb component that encapsulated the display logic for a catalog group.
 */
const CatalogGroup: FC<ICatalogGroupProps> = (props) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const elementRef = useRef<HTMLLIElement>();

  const {
    topLevel,
    trashable,
    open,
    selected,
    children,
    loading,
    emptyMessage,
    displayGroup,
    allItemsLoaded,
    addRemoveButtonFunction
  } = props;

  useEffect(() => {
    if (selected) {
      elementRef?.current?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }, []);

  return (
    <Li ref={elementRef as any}>
      <Text>
        <CatalogGroupBox
          title={props.title}
          onClick={props.onClick}
          selected={selected ?? false}
        >
          {!topLevel ? <FolderIcon open={open} /> : null}
          <BoxSpan justifySpaceBetween flex={1} verticalCenter>
            <TextSpan semiBold primary={!selected && props.isPrivate}>
              {props.text}
            </TextSpan>
            <BoxSpan centered gap={2} pr={2}>
              {props.isPrivate && <PrivateIndicator />}
              {displayGroup === true && (
                <RawButton
                  type="button"
                  onClick={
                    addRemoveButtonFunction ? addRemoveButtonFunction : () => {}
                  }
                  title={
                    allItemsLoaded
                      ? t("models.catalog.removeAll")
                      : t("models.catalog.addAll")
                  }
                >
                  <StyledIcon
                    glyph={
                      allItemsLoaded
                        ? Icon.GLYPHS.minusList
                        : Icon.GLYPHS.plusList
                    }
                    styledWidth="20px"
                  />
                </RawButton>
              )}
              <BoxSpan>
                <GroupCaret open={open} />
              </BoxSpan>
              {trashable && (
                <RawButton
                  type="button"
                  onClick={props.onTrashClick}
                  title={t("dataCatalog.groupRemove")}
                >
                  <StyledIcon glyph={GLYPHS.trashcan} styledWidth="20px" />
                </RawButton>
              )}
            </BoxSpan>
          </BoxSpan>
        </CatalogGroupBox>
      </Text>
      {props.open && (
        <Ul
          column
          pt
          css={`
            border-left: ${theme.greyLighter};
            padding-left: 10px;
          `}
        >
          {loading && (
            <Li key="loader">
              <Loader />
            </Li>
          )}
          {!loading && !children && emptyMessage ? (
            <li key="empty">
              <Text>{emptyMessage}</Text>
            </li>
          ) : (
            children
          )}
        </Ul>
      )}
    </Li>
  );
};

export default observer(CatalogGroup);
