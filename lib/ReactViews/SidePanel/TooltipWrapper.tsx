/**
 * base tooltipwrapperraw repurposed from magda, with some a11y modifications
 */
import React from "react";
import { withTheme, DefaultTheme } from "styled-components";
import { useUID } from "react-uid";
const Box: any = require("../../Styled/Box").default;
const RawButton: any = require("../../Styled/Button").RawButton;

type Props = {
  theme: DefaultTheme;

  /** Does this require a click outside the tooltip to dismiss, or should it disappear after a delay?  */
  requireClickToDismiss?: boolean;
  /** Invoked when the tooltip is dismissed by the user - not called if the tooltip disappears automatically  */
  onDismiss?: () => void;
  /** Classname to apply to the wrapper element */
  className?: string;
  /**
   * When dismiss/launch actions are handled within render prop, use this to disable default listeners
   * if using this, ensure you handle the dismiss case externally otherwise the tooltip can get stuck on open
   */
  disableEventListeners?: boolean;
  /** Whether the tooltip should start in an open state */
  startOpen?: boolean;
  /** Whether the tooltip should show up above or below the element it wraps */
  orientation?: "below" | "above";
  /**
   * A function that returns a component that should launch the tooltip. If startOpen is false then it will show
   * the tooltip when hovered over. Accepts an "open" callback that can be used to force-launch the tooltip (e.g. on click) */
  launcher?: (launchObj: {
    state: State;
    launch: () => void;
    forceSetState: (bool?: boolean) => void;
  }) => React.ReactNode;
  /** Class to apply to the  actual tooltip */
  innerElementClassName?: string;
  /** Styles to apply to the  actual tooltip */
  innerElementStyles?: Object;
  /** The tooltip content itself, as higher-order function that provides a function to dismiss the tooltip */
  children: (dismiss: () => void) => React.ReactNode;
};

type State = {
  offset: number;
  open: boolean;
};

/**
 * @description Return a information tooltip, on hover show calculation method.
 */
class TooltipWrapperRaw extends React.Component<Props, State> {
  rootRef = React.createRef<HTMLDivElement>();
  tooltipTextElementRef = React.createRef<HTMLSpanElement>();
  state = {
    offset: 0,
    open: !!this.props.startOpen
  };

  componentDidMount() {
    if (!this.props.disableEventListeners) {
      document.addEventListener("mousedown", this.dismiss);
      document.addEventListener("touchstart", this.dismiss);
    }

    this.adjustOffset();
  }

  componentDidUpdate() {
    this.adjustOffset();
  }

  componentWillUnmount() {
    if (!this.props.disableEventListeners) {
      document.removeEventListener("mousedown", this.dismiss);
      document.addEventListener("touchstart", this.dismiss);
    }
  }

  dismiss = () => {
    this.props.onDismiss && this.props.onDismiss();
    this.setState({ open: false });
  };

  /**
   * Adjust the offset margin of the tooltiptext so it's at the centre of the launcher.
   */
  adjustOffset() {
    const tooltipTextElement = this.tooltipTextElementRef.current;
    const rootElement = this.rootRef.current;

    // Why .firstChild? Because we can't attach a ref to a render prop unless whatever's passed in passes the ref through to its first dom element
    const launcherElement = rootElement!.firstChild!;

    const launcherElementStyle =
      (launcherElement as any).currentStyle ||
      window.getComputedStyle(launcherElement as Element);

    const tooltipWidth = tooltipTextElement!.offsetWidth;
    const offset =
      (tooltipWidth +
        parseFloat(launcherElementStyle.marginLeft) +
        parseFloat(launcherElementStyle.marginRight) -
        parseFloat(launcherElementStyle.paddingRight) -
        parseFloat(launcherElementStyle.paddingLeft)) /
      2;
    // only update if the difference is big enough to prevent indefinite loop caused by browser sub pixel error
    if (Math.abs(this.state.offset - offset) > 5) {
      this.setState({
        offset: offset
      });
    }
  }

  forceSetState = (bool: boolean = true) => {
    this.setState({
      open: bool
    });
  };

  render() {
    const { orientation, theme, innerElementStyles } = this.props;
    const orientationBelow = orientation === "below";
    // default to above
    const orientationAbove =
      orientation === "above" || orientation === undefined;

    return (
      <div
        ref={this.rootRef}
        css={`
          position: relative;
          display: inline-block;
          vertical-align: -2px;
        `}
        // className={`tooltip ${className} ${openClass} `}
      >
        {/* Caution: if this is ever not the first element be sure to fix adjustOffset */}
        {this.props.launcher &&
          this.props.launcher({
            state: this.state,
            launch: () => this.forceSetState(true),
            forceSetState: this.forceSetState
          })}
        <Box
          paddedRatio={3}
          positionAbsolute
          rounded
          css={`
            visibility: ${this.state.open ? "visible" : "hidden"};
            background-color: ${theme.textDark};
            color: #fff;
            text-align: center;
            left: 50%;
            // transition-delay: 1s;
            // transition: visibility 1s ease;

            ${orientationAbove && `bottom: calc(100% + 10px);`}
            ${orientationBelow &&
              `top: calc(100% + 10px);`}

            @media screen and (hover: none) {
              transition: none !important;
            }
            &::after {
              content: "";
              position: absolute;
              left: 50%;
              margin-left: -10px;
              border-width: 10px;
              border-style: solid;
            }
            ${orientationBelow &&
              `&::after {
                bottom: 100%;
                border-color: transparent transparent ${theme.textDark} transparent;
            `}
            ${orientationAbove &&
              `&::after {
                top: 100%;
                border-color: ${theme.textDark} transparent transparent transparent;
            `}
          `}
          ref={this.tooltipTextElementRef}
          style={{
            marginLeft: "-" + this.state.offset + "px",
            ...innerElementStyles
          }}
        >
          {this.props.children(this.dismiss)}
        </Box>
      </div>
    );
  }
}
export const TooltipWrapper = withTheme(TooltipWrapperRaw);

type ButtonLauncherProps = {
  launcherComponent: () => React.ReactNode;
  children: () => React.ReactNode;
  dismissOnLeave?: boolean;
  [spread: string]: any;
};

export const TooltipWithButtonLauncher: React.SFC<ButtonLauncherProps> = props => {
  const { launcherComponent, children, dismissOnLeave, ...rest } = props;

  const idForAria = `ButtonLauncher-${useUID()}`;

  return (
    <TooltipWrapper
      innerElementStyles={{
        width: "200px"
      }}
      {...rest}
      disableEventListeners
      launcher={launchObj => {
        const restButtonProps = dismissOnLeave
          ? {
              onMouseOut: () => launchObj.forceSetState(false),
              onBlur: () => launchObj.forceSetState(false)
            }
          : {};
        return (
          <RawButton
            aria-expanded={launchObj.state.open}
            aria-describedby={idForAria}
            onClick={() => launchObj.forceSetState(!launchObj.state.open)}
            onFocus={launchObj.launch}
            onMouseOver={launchObj.launch}
            {...restButtonProps}
          >
            {launcherComponent()}
          </RawButton>
        );
      }}
    >
      {() => <span id={idForAria}>{children()}</span>}
    </TooltipWrapper>
  );
};

export default TooltipWrapper;
