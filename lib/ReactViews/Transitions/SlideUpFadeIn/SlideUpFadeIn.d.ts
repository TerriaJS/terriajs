interface PropsType {
  isVisible: boolean;
  onEnter?: () => void;
  onExited?: () => void;
  transitionProps?: any;
}

declare const SlideUpFadeIn: React.FC<PropsType>;
export default SlideUpFadeIn;
