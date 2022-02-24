const ANIMATION_TIMEOUT = 500;

const transitionEnd = (element: Element | null) =>
  new Promise<void>((resolve, reject) => {
    if (!element) {
      reject("Animation: Element is null");
    } else {
      const onEnd = () => {
        element.removeEventListener("transitionend", onEnd);
        resolve();
      };
      element.addEventListener("transitionend", onEnd);
    }
  });

let timeoutID: ReturnType<typeof setTimeout>;
const animationTimeout = () =>
  new Promise<void>((_, reject) => {
    timeoutID = setTimeout(() => {
      reject("Animation timed out. Did you forget to animate the element?");
    }, ANIMATION_TIMEOUT);
  });

/**
 *
 * @param element - HTML element that will fire the transitionend event due to a CSS animation
 * @returns Promise that will resolve when the element finishes its animation or reject if it is not detected within ANIMATION_DURATION ms
 */

export const animateEnd = (element: Element | null) =>
  Promise.race([transitionEnd(element), animationTimeout()]).finally(() =>
    clearTimeout(timeoutID)
  );
