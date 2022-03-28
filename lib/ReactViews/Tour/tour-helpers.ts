// helpers for the app Tour in general
import { TourPoint } from "../../ReactViewModels/defaultTourPoints";
import isDefined from "../../Core/isDefined";

import {
  RelativePosition,
  TOUR_WIDTH
} from "../../ReactViewModels/defaultTourPoints";
export {
  RelativePosition,
  TOUR_WIDTH
} from "../../ReactViewModels/defaultTourPoints";

// We need isDefined across these as we are dealing with numbers, 0 is falsy
export function getOffsetsFromTourPoint(tourPoint: TourPoint) {
  // Offsets
  const offsetTop = isDefined(tourPoint?.offsetTop) ? tourPoint.offsetTop : 15;
  const offsetRight = isDefined(tourPoint?.offsetRight)
    ? tourPoint.offsetRight
    : 0;
  const offsetLeft = isDefined(tourPoint?.offsetLeft)
    ? tourPoint.offsetLeft
    : 0;

  // TODO(wing): caret could easily be smarter than manually positioning it,
  // take the rectangle from the highlighted component and set the base offset
  // around that. manually position it for now
  const caretOffsetTop = isDefined(tourPoint?.caretOffsetTop)
    ? tourPoint.caretOffsetTop
    : -3;
  const caretOffsetRight = isDefined(tourPoint?.caretOffsetRight)
    ? tourPoint.caretOffsetRight
    : 20;
  const caretOffsetLeft = isDefined(tourPoint?.caretOffsetLeft)
    ? tourPoint.caretOffsetLeft
    : 20;

  // todo: more stuff that could be structured better
  const indicatorOffsetTop = isDefined(tourPoint?.indicatorOffsetTop)
    ? tourPoint.indicatorOffsetTop
    : -20;
  const indicatorOffsetRight = isDefined(tourPoint?.indicatorOffsetRight)
    ? tourPoint.indicatorOffsetRight
    : 3;
  const indicatorOffsetLeft = isDefined(tourPoint?.indicatorOffsetLeft)
    ? tourPoint.indicatorOffsetLeft
    : 3;
  return {
    offsetTop,
    offsetLeft,
    offsetRight,
    caretOffsetTop,
    caretOffsetLeft,
    caretOffsetRight,
    indicatorOffsetTop,
    indicatorOffsetLeft,
    indicatorOffsetRight
  };
}

interface HelpScreen {
  rectangle: DOMRect;
  positionLeft: number;
  positionRight: number;
  positionTop: number;
  offsetLeft?: number;
  offsetRight?: number;
  offsetTop?: number;
}

/**
 * Work out the screen pixel value for left positioning based on helpScreen parameters.
 * @private
 */
export function calculateLeftPosition(helpScreen: HelpScreen) {
  const screenRect = helpScreen.rectangle;
  if (!screenRect) {
    console.log("no rectangle in helpScreen");
    return 0;
  }
  let leftPosition = 0;
  if (helpScreen.positionLeft === RelativePosition.RECT_LEFT) {
    leftPosition = screenRect.left;
  } else if (helpScreen.positionLeft === RelativePosition.RECT_RIGHT) {
    leftPosition = screenRect.right;
  } else if (helpScreen.positionLeft === RelativePosition.RECT_TOP) {
    leftPosition = screenRect.top;
  } else if (helpScreen.positionLeft === RelativePosition.RECT_BOTTOM) {
    leftPosition = screenRect.bottom;
  }

  leftPosition += helpScreen.offsetLeft || 0;
  return leftPosition;
}

/**
 * Work out the screen pixel value for left positioning based on helpScreen parameters.
 * @private
 */
export function calculateRightPosition(helpScreen: HelpScreen) {
  const screenRect = helpScreen.rectangle;
  if (!screenRect) {
    console.log("no rectangle in helpScreen");
    return 0;
  }
  let rightPosition = 0;
  if (helpScreen.positionRight === RelativePosition.RECT_RIGHT) {
    rightPosition = screenRect.right;
  } else if (helpScreen.positionRight === RelativePosition.RECT_LEFT) {
    rightPosition = screenRect.left;
  } else if (helpScreen.positionRight === RelativePosition.RECT_TOP) {
    rightPosition = screenRect.top;
  } else if (helpScreen.positionRight === RelativePosition.RECT_BOTTOM) {
    rightPosition = screenRect.bottom;
  }

  rightPosition -= helpScreen.offsetRight || 0;
  rightPosition -= screenRect.left || 0;
  return rightPosition;
}

/**
 * Work out the screen pixel value for top positioning based on helpScreen parameters.
 * @private
 */
export function calculateTopPosition(helpScreen: HelpScreen) {
  const screenRect = helpScreen.rectangle;
  if (!screenRect) {
    console.log("no rectangle in helpScreen");
    return 0;
  }
  let topPosition = 0;
  if (helpScreen.positionTop === RelativePosition.RECT_LEFT) {
    topPosition = screenRect.left;
  } else if (helpScreen.positionTop === RelativePosition.RECT_RIGHT) {
    topPosition = screenRect.right;
  } else if (helpScreen.positionTop === RelativePosition.RECT_TOP) {
    topPosition = screenRect.top;
  } else if (helpScreen.positionTop === RelativePosition.RECT_BOTTOM) {
    topPosition = screenRect.bottom;
  }

  topPosition += helpScreen.offsetTop || 0;
  return topPosition;
}
