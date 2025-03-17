interface PropsType {
  isVisible: boolean;
  onEnter?: () => void;
  onExited?: () => void;
  transitionProps?: any;
  children: React.ReactNode;
}

declare const SlideUpFadeIn: React.FC<PropsType>;
export default SlideUpFadeIn;
