import { observer } from "mobx-react";
import React from "react";
import styled from "styled-components";
import { useTranslationIfExists } from "../../../Language/languageHelpers";
import Terria from "../../../Models/Terria";
import ViewerMode from "../../../Models/ViewerMode";
import Icon, { GLYPHS } from "../../Icon";
import MapIconButton from "../../MapIconButton/MapIconButton";
type Location = "TOP" | "BOTTOM";
type ScreenSize = "small" | "medium";
const Box = require("../../../Styled/Box").default;

type MapNavigationItemBaseType = {
  /**
   * Unique identifier of navigation item.
   */
  id: string;
  /**
   * Name of the navigation item.
   */
  name: string;
  /**
   * Title of the navigation item.
   */
  title?: string;
  /**
   * Glyph icon for the navigation item.
   */
  glyph?: any;
  /**
   * The location of the item.
   */
  location: Location;
  /**
   * Wheter item is visible at all.
   */
  hidden: boolean;
  /**
   * Custom renderer.
   */
  render?: React.ReactNode;
  order?: number;
  /**
   * Set the viewer this navigation item should be available.
   * Leave undefined if it should be visible in both viewers.
   */
  viewerMode?: ViewerMode;
  /**
   * On which screen size this navigation item should be available.
   * Leave undefined if it should be visible on all screen sizes.
   */
  screenSize?: ScreenSize;
  /**
   * MapIconButton props.
   */
  mapIconButtonProps?: { [spread: string]: any };
  /**
   * Height of the element. This is only a fallback if we can't determine the height.
   * The height should be correctly calculated for all non collapsed items on initial render.
   */
  height: number;
  /**
   * Width of the element. This is only a fallback if we can't determine the width.
   * The height should be correctly calculated for all non collapsed items on initial render.
   */
  width: number;
  /**
   * ReactRef for the navigation item.
   */
  itemRef: React.RefObject<HTMLDivElement>;
};

export type MapNavigationItemType =
  | (MapNavigationItemBaseType & {
      /**
       * Item is pinned so it can't and won't be collapsed.
       */
      pinned: true;
      /**
       * Item can't be collapsed.
       */
      forceCollapsed?: false;
      /**
       * On click action for the button.
       */
      onClick?: (props?: { [sprad: string]: any }) => void;
    })
  | (MapNavigationItemBaseType & {
      /**
       * If true item can't and won't be collapsed.
       */
      pinned: false;
      /**
       *
       */
      render?: undefined;
      /**
       * If true item will be shown as collapsed by default.
       * @default false
       */
      forceCollapsed?: boolean;
      /**
       * On click action for the button.
       */
      onClick: (props?: { [sprad: string]: any }) => void;
    })
  | (MapNavigationItemBaseType & {
      /**
       * If true item can't and won't be collapsed.
       */
      pinned: false;
      /**
       *
       */
      render?: React.ReactNode;
      /**
       * If true item will be shown as collapsed by default.
       * @default false
       */
      forceCollapsed?: boolean;
      /**
       * On click action for the button.
       */
      onClick?: (props?: { [sprad: string]: any }) => void;
    });

export type MapNavigationItemExtendedType = MapNavigationItemType & {
  collapsed?: boolean;
};

interface PropTypes {
  item: MapNavigationItemType;
  terria: Terria;
}

@observer
export class MapNavigationItem extends React.Component<PropTypes> {
  constructor(props: PropTypes) {
    super(props);
  }
  render() {
    const { item } = this.props;
    if (item.render) return <Control key={item.id}>{item.render}</Control>;
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
          closeIconElement={() => <Icon glyph={GLYPHS.closeTool} />}
        >
          {useTranslationIfExists(item.name)}
        </MapIconButton>
      </Control>
    );
  }
}

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
