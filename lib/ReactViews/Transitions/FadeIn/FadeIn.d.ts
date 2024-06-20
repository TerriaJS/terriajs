interface PropsType {
  isVisible: boolean;
  onEnter?: () => void;
  onExited?: () => void;
  transitionProps?: any;
}

declare const FadeIn: React.FC<PropsType>;
export default FadeIn;
