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
    onDismissed: PropTypes.func
  },

  getDefaultProps() {
    return {
      theme: {},
      onOpenChanged: undefined,
      onDismissed: () => {}
    };
  },

  changeOpenState(newValue) {
    if (this.props.onOpenChanged !== undefined) {
      this.props.onOpenChanged(newValue);
    } else {
      this.setState({
        localIsOpen: newValue
      });
    }
  },

  onDismissed() {
    this.changeOpenState(false);
    this.props.onDismissed();
  },

  isOpen() {
    if (
      this.props.isOpen !== undefined &&
      this.props.onOpenChanged !== undefined
    ) {
      return this.props.isOpen;
    } else {
      return this.state.localIsOpen;
    }
  },

  openPanel(e) {
    if (!this.isOpen()) {
      // Tag this event so that we know not to react to it when it hits the window.
      // We could just set stopPropagation on it, but this would mean that clicks on other buttons that stopPropagation
      // would cause the panel not to close.
      e.nativeEvent[this.getDoNotCloseFlag()] = true;

      this.changeOpenState(true);
    }
  },

  getDoNotCloseFlag() {
    return `do-not-react-${this.props.btnText}-${this.props.btnTitle}-${
      this.props.theme.btn
    }`;
  }
};
