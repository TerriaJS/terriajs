import PropTypes from "prop-types";

export default {
  propTypes: {
    theme: PropTypes.object,
    children: PropTypes.any,
    btnTitle: PropTypes.string,
    btnText: PropTypes.string,
    btnDisabled: PropTypes.bool,
    onOpenChanged: PropTypes.func,
    isOpen: PropTypes.bool,
    forceClosed: PropTypes.bool,
    onDismissed: PropTypes.func,
    disableCloseOnFocusLoss: PropTypes.bool
  },

  getDefaultProps() {
    return {
      theme: {},
      onOpenChanged: undefined,
      onDismissed: () => {}
    };
  },

  changeOpenState(newValue: any) {
    // @ts-expect-error TS(2339)
    if (this.props.onOpenChanged !== undefined) {
      // @ts-expect-error TS(2339)
      this.props.onOpenChanged(newValue);
    } else {
      // @ts-expect-error TS(2339)
      this.setState({
        localIsOpen: newValue
      });
    }
  },

  onDismissed() {
    this.changeOpenState(false);
    // @ts-expect-error TS(2339)
    this.props.onDismissed();
  },

  isOpen() {
    if (
      // @ts-expect-error TS(2339)
      this.props.isOpen !== undefined &&
      // @ts-expect-error TS(2339)
      this.props.onOpenChanged !== undefined
    ) {
      // @ts-expect-error TS(2339)
      return this.props.isOpen;
    } else {
      // @ts-expect-error TS(2339)
      return this.state.localIsOpen;
    }
  },

  openPanel(e: any) {
    if (!this.isOpen()) {
      // Tag this event so that we know not to react to it when it hits the window.
      // We could just set stopPropagation on it, but this would mean that clicks on other buttons that stopPropagation
      // would cause the panel not to close.
      e.nativeEvent[this.getDoNotCloseFlag()] = true;

      this.changeOpenState(true);
    }
  },

  // @ts-expect-error TS(7023)
  getDoNotCloseFlag() {
    // @ts-expect-error TS(2339)
    return `do-not-react-${this.props.btnText}-${this.props.btnTitle}-${this.props.theme.btn}`;
  }
};
