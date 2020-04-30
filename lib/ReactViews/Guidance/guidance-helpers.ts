import {
  RelativePosition,
  TOUR_WIDTH
} from "../../ReactViewModels/defaultTourPoints";
export {
  RelativePosition,
  TOUR_WIDTH
} from "../../ReactViewModels/defaultTourPoints";

interface HelpScreen {
  rectangle: DOMRect;
  positionLeft: number;
  positionTop: number;
  offsetLeft?: number;
  offsetTop?: number;
}

/**
 * Work out the screen pixel value for left positioning based on helpScreen parameters.
 * @private
 */
export function calculateLeftPosition(helpScreen: HelpScreen) {
  const screenRect = helpScreen.rectangle;
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
 * Work out the screen pixel value for top positioning based on helpScreen parameters.
 * @private
 */
export function calculateTopPosition(helpScreen: HelpScreen) {
  const screenRect = helpScreen.rectangle;
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
