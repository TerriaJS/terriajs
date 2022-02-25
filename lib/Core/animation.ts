/**
 * The purpose of this module is to provide a standard way to perform actions after an animations ends.
 * The advantage is that the code is more tightly coupled together and we don't have to guess when the animation ends.
 * There is also a timeout fallback that will reject the Promise if the animation end event is not fired in time.
 * 
 * Old code:
 *
  triggerSomeAnimation();
  setTimeout(function() {
    somePostAction();
  }, 200);
 * 
 * New code: 
  animateEnd(this.elementRef.current).finally(somePostAction);
  triggerAnimation();
 * 
 *   
 */

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

const animationTimeout = (
  timeoutID: ReturnType<typeof setTimeout> | undefined
) =>
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

export const animateEnd = (element: Element | null) => {
  let timeoutID: ReturnType<typeof setTimeout> | undefined = undefined;
  return Promise.race([
    transitionEnd(element),
    animationTimeout(timeoutID)
  ]).finally(() => timeoutID && clearTimeout(timeoutID));
};
