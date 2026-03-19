import classNames from "classnames";
import { FC } from "react";
import styled from "styled-components";

// Import icon SVGs
import calendar from "../icons/calendar.svg";
import calendar2 from "../icons/calendar2.svg";
import about from "../icons/about.svg";
import add from "../icons/add.svg";
import arHover0 from "../icons/ar-hover0.svg";
import arHover1 from "../icons/ar-hover1.svg";
import arHover2 from "../icons/ar-hover2.svg";
import arOff from "../icons/ar-off.svg";
import arOn from "../icons/ar-on.svg";
import arRealign from "../icons/ar-realign.svg";
import arResetAlignment from "../icons/ar-reset-alignment.svg";
import arrowDown from "../icons/arrow-down.svg";
import backToStart from "../icons/back-to-start.svg";
import backward from "../icons/backward.svg";
import barChart from "../icons/bar-chart.svg";
import bulb from "../icons/bulb.svg";
import controls from "../icons/controls.svg";
import checkboxOff from "../icons/checkbox-off.svg";
import checkboxOn from "../icons/checkbox-on.svg";
import close from "../icons/close.svg";
import closeLight from "../icons/close-light.svg";
import closed from "../icons/closed.svg";
import collapse from "../icons/collapse.svg";
import decrease from "../icons/decrease.svg";
import disable from "../icons/disable.svg";
import download from "../icons/download.svg";
import downloadNew from "../icons/download-new.svg";
import enable from "../icons/enable.svg";
import expand from "../icons/expand.svg";
import expandAll from "../icons/expandAll.svg";
import eye from "../icons/eye.svg";
import externalLink from "../icons/external-link.svg";
import feedback from "../icons/feedback.svg";
import folder from "../icons/folder.svg";
import folderOpen from "../icons/folder-open.svg";
import forward from "../icons/forward.svg";
import geolocation from "../icons/geolocation.svg";
import gallery from "../icons/gallery.svg";
import help from "../icons/help.svg";
import helpThick from "../icons/help-thick.svg";
import increase from "../icons/increase.svg";
import left from "../icons/left.svg";
import lineChart from "../icons/line-chart.svg";
import link from "../icons/link.svg";
import loader from "../icons/loader.svg";
import location from "../icons/location.svg";
import location2 from "../icons/location2.svg";
import lock from "../icons/lock.svg";
import loop from "../icons/loop.svg";
import menu from "../icons/menu.svg";
import measure from "../icons/measure.svg";
import opened from "../icons/opened.svg";
import pause from "../icons/pause.svg";
import play from "../icons/play.svg";
import playStory from "../icons/play-story.svg";
import radioOff from "../icons/radio-off.svg";
import radioOn from "../icons/radio-on.svg";
import refresh from "../icons/refresh.svg";
import remove from "../icons/remove.svg";
import right from "../icons/right.svg";
import right2 from "../icons/right2.svg";
import revert from "../icons/revert.svg";
import search from "../icons/search.svg";
import selected from "../icons/selected.svg";
import settings from "../icons/settings.svg";
import share from "../icons/share.svg";
import showLess from "../icons/show-less.svg";
import showMore from "../icons/show-more.svg";
import sphere from "../icons/sphere.svg";
import map from "../icons/map.svg";
import splitter from "../icons/splitter.svg";
import splitterOn from "../icons/splitterOn.svg";
import splitterOff from "../icons/splitterOff.svg";
import difference from "../icons/difference.svg";
import diffImage from "../icons/splitter.svg";
import previous from "../icons/previous.svg";
import next from "../icons/next.svg";
import timeline from "../icons/timeline.svg";
import data from "../icons/data.svg";
import dataCatalog from "../icons/dataCatalog.svg";
import upload from "../icons/upload.svg";
import trashcan from "../icons/trashcan.svg";
import local from "../icons/localfile.svg";
import web from "../icons/remotefile.svg";
import compassInner from "../icons/compass-inner.svg";
import compassInnerArrows from "../icons/compass-inner-arrows.svg";
import compassOuter from "../icons/compass-outer.svg";
import compassOuterSkeleton from "../icons/compass-outer-skeleton.svg";
import compassOuterEnlarged from "../icons/compass-outer-enlarged.svg";
import compassRotationMarker from "../icons/compass-rotation-marker.svg";
import circleFull from "../icons/circlef-full.svg";
import circleEmpty from "../icons/circle-empty.svg";
import story from "../icons/story.svg";
import recapture from "../icons/recapture.svg";
import menuDotted from "../icons/menu-dotted.svg";
import cancel from "../icons/cancel.svg";
import user from "../icons/user.svg";
import datePicker from "../icons/date-picker-icon.svg";
import tour from "../icons/take-the-tour.svg";
import layers from "../icons/pulling-away-layers.svg";
import start from "../icons/getting-started-icon.svg";
import cube from "../icons/interact.svg";
import globe from "../icons/globe.svg";
import playInverted from "../icons/play-inverted.svg";
import video from "../icons/video.svg";
import compare from "../icons/compare.svg";
import lifesaver from "../icons/help-2.svg";
import geolocationThick from "../icons/location-thick.svg";
import minus from "../icons/minus.svg";
import plus from "../icons/plus.svg";
import zoomIn from "../icons/zoom-in.svg";
import zoomOut from "../icons/zoom-out.svg";
import zoomReset from "../icons/zoom-reset.svg";
import satellite from "../icons/satellite.svg";
import mapDataActive from "../icons/map-data-active.svg";
import mapDataInactive from "../icons/map-data-inactive.svg";
import uploadThin from "../icons/upload-thin.svg";
import oneTwoThree from "../icons/one-two-three.svg";
import accordionOpen from "../icons/accordion-open.svg";
import accordionClose from "../icons/accordion-close.svg";
import editor from "../icons/editor.svg";
import viewStory from "../icons/view-story.svg";
import editStory from "../icons/edit-story.svg";
import questionMark from "../icons/questionmark.svg";
import pedestrian from "../icons/pedestrian.svg";
import minimize from "../icons/minimize.svg";
import maximize from "../icons/maximize.svg";
import closeTool from "../icons/close-tool.svg";
import moreItems from "../icons/more-items.svg";
import info from "../icons/info.svg";
import leftSmall from "../icons/left-small.svg";
import rightSmall from "../icons/right-small.svg";
import compareLeftPanel from "../icons/compare-left-panel.svg";
import compareRightPanel from "../icons/compare-right-panel.svg";
import compareBothPanels from "../icons/compare-both-panels.svg";
import closeCircle from "../icons/close-circle.svg";
import plusList from "../icons/plus-list-20.svg";
import minusList from "../icons/dismiss-20.svg";
import switchOn from "../icons/switch-on.svg";
import switchOff from "../icons/switch-off.svg";
import dragDrop from "../icons/drag-drop.svg";
import warning from "../icons/warning.svg";

// Icon
export const GLYPHS = {
  calendar,
  calendar2,
  about,
  add,
  arHover0,
  arHover1,
  arHover2,
  arOff,
  arOn,
  arRealign,
  arResetAlignment,
  arrowDown,
  backToStart,
  backward,
  barChart,
  bulb,
  controls,
  checkboxOff,
  checkboxOn,
  close,
  closeLight,
  closed,
  collapse,
  decrease,
  disable,
  download,
  downloadNew,
  enable,
  expand,
  eye,
  expandAll,
  externalLink,
  feedback,
  folder,
  folderOpen,
  forward,
  geolocation,
  gallery,
  help,
  helpThick,
  increase,
  left,
  lineChart,
  link,
  loader,
  location,
  location2,
  lock,
  loop,
  menu,
  measure,
  opened,
  pause,
  play,
  playStory,
  radioOff,
  radioOn,
  refresh,
  remove,
  right,
  right2,
  revert,
  search,
  selected,
  settings,
  share,
  showLess,
  showMore,
  sphere,
  map,
  splitter,
  splitterOn,
  splitterOff,
  difference,
  diffImage,
  previous,
  next,
  timeline,
  data,
  dataCatalog,
  upload,
  trashcan,
  local,
  web,
  compassInner,
  compassInnerArrows,
  compassOuter,
  compassOuterSkeleton,
  compassOuterEnlarged,
  compassRotationMarker,
  circleFull,
  circleEmpty,
  story,
  recapture,
  menuDotted,
  cancel,
  user,
  datePicker,
  tour,
  layers,
  start,
  cube,
  globe,
  playInverted,
  video,
  compare,
  lifesaver,
  geolocationThick,
  minus,
  plus,
  zoomIn,
  zoomOut,
  zoomReset,
  satellite,
  mapDataActive,
  mapDataInactive,
  uploadThin,
  oneTwoThree,
  accordionOpen,
  accordionClose,
  editor,
  viewStory,
  editStory,
  questionMark,
  pedestrian,
  minimize,
  maximize,
  closeTool,
  moreItems,
  info,
  leftSmall,
  rightSmall,
  compareLeftPanel,
  compareRightPanel,
  compareBothPanels,
  closeCircle,
  plusList,
  minusList,
  switchOn,
  switchOff,
  dragDrop,
  warning
};

export interface IconGlyph {
  id: string;
}

export interface IconProps {
  glyph: IconGlyph;
  style?: any;
  className?: string;
  rotation?: number;
}
export const Icon: FC<IconProps> = (props: IconProps) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={classNames("icon", props.className)}
      style={props.style}
      transform={`rotate(${props.rotation ?? 0})`}
    >
      <use xlinkHref={"#" + props.glyph?.id} />
    </svg>
  );
};

export interface IStyledIconProps {
  displayInline?: boolean;
  styledWidth?: string;
  styledHeight?: string;
  light?: boolean;
  dark?: boolean;
  realDark?: boolean;
  fillColor?: string;
  opacity?: number;
}

export const StyledIcon = styled(Icon)<IStyledIconProps>`
  display: ${(props) => (props.displayInline ? `inline` : `block`)};
  ${(props) =>
    props.displayInline
      ? `
  display: inline;
  vertical-align: middle;`
      : `
  display: block;`}

  flex-shrink: 0;
  ${(props) => props.styledWidth && `width: ${props.styledWidth};`}
  ${(props) => props.styledHeight && `height: ${props.styledHeight};`}

  ${(props) => props.light && `fill: ${props.theme.textLight};`}
  ${(props) => props.dark && `fill: ${props.theme.textDark};`}

  // Until we sort out what "light / dark" means for components that have both
  // modes, use "realDark" to get real
  ${(props) => props.realDark && `fill: ${props.theme.dark};`}

  ${(props) => props.fillColor && `fill: ${props.fillColor};`}

  ${(props) => props.opacity && `opacity: ${props.opacity};`}
`;

export default Object.assign(Icon, { GLYPHS });
