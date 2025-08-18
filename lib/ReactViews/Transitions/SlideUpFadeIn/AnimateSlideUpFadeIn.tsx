import { FC, ReactNode, useState } from "react";
import { SlideUpFadeIn } from "./SlideUpFadeIn";

interface PropsType {
  /**
   * Triggers enter animation when true and exit animation when false
   */
  isVisible: boolean;

  /**
   * The component to render when the animation enters
   */
  renderOnVisible: () => ReactNode;
}

/**
 * A wrapper for SlideUpFadeIn
 */
const AnimateSlideUpFadeIn: FC<PropsType> = ({
  isVisible,
  renderOnVisible
}) => {
  const [children, setChildren] = useState<ReactNode>(null);
  return (
    <SlideUpFadeIn
      isVisible={isVisible}
      onEnter={() => setChildren(renderOnVisible())}
    >
      <>{children}</>
    </SlideUpFadeIn>
  );
};

export default AnimateSlideUpFadeIn;
