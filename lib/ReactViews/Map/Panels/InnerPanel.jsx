import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";

import { withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";

import Icon from "../../../Styled/Icon";
import Styles from "./panel.scss";

const InnerPanel = createReactClass({
  propTypes: {
    /**
     * A property that will be looked for on window click events - if it's set, the click event will not cause the
     * panel to close.
     */
    doNotCloseFlag: PropTypes.string,
    /** Disable closing on loss of focus and only allow with close button */
    disableCloseOnFocusLoss: PropTypes.bool,
    /** Will be called when the panel has finished hiding */
    onDismissed: PropTypes.func,
    /** Animate as modal instead of dropdown */
    showDropdownAsModal: PropTypes.bool,

    /** show panel centered instead of offset toward the left */
    showDropdownInCenter: PropTypes.bool,

    /** Relative width to draw from */
    modalWidth: PropTypes.number,
    /** Theme to style components */
    theme: PropTypes.object,
    /** How far the caret at the top of the panel should be from its left, as CSS (so #px or #% are both valid) */
    caretOffset: PropTypes.string,
    /** Will be passed as "ref" to the outermost element */
    innerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
    /** How far the dropdown should be offset from the left of the container. */
    dropdownOffset: PropTypes.string,

    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.element),
      PropTypes.element
    ]),
    t: PropTypes.func.isRequired
  },

  getDefaultProps() {
    return {
      onDismissed: () => {}
    };
  },

  getInitialState() {
    return {};
  },

  componentDidMount() {
    this.escKeyListener = (e) => {
      if (e.keyCode === 27) {
        this.close(e);
      }
    };
    window.addEventListener("click", this.close);
    window.addEventListener("keydown", this.escKeyListener, true);
    setTimeout(() => this.setState({ isOpenCss: true }));
  },

  componentWillUnmount() {
    this.cleanListeners();
  },

  cleanListeners() {
    window.removeEventListener("click", this.close);
    window.removeEventListener("keydown", this.escKeyListener, true);
  },

  forceClose() {
    this.cleanListeners();

    // If we're closing we want to immediately change the css class to cause it to animate shut, then when it's
    // finished actually stop it rendering with isOpen = false
    this.setState({
      isOpenCss: false
    });

    setTimeout(() => {
      this.props.onDismissed();
    }, 200); // TODO: Determine when it stops animating instead of duplicating the 200ms timeout?
  },

  close(e) {
    // Only close if this wasn't a click on an open/close button.
    if (
      (!this.props.doNotCloseFlag || !e[this.props.doNotCloseFlag]) &&
      !this.props.disableCloseOnFocusLoss
    ) {
      this.forceClose();
    }
  },

  render() {
    const {
      t,
      caretOffset,
      dropdownOffset,
      innerRef,
      modalWidth,
      showDropdownAsModal,
      showDropdownInCenter,
      theme,
      children
    } = this.props;
    return (
      <div
        className={classNames(
          // Until we break these few components out of sass, we'll use regular ol classnames
          "tjs-sc-InnerPanel",
          Styles.inner,
          theme.inner,
          { [Styles.isOpen]: this.state.isOpenCss },
          { [Styles.showDropdownAsModal]: showDropdownAsModal },
          { [Styles.showDropdownInCenter]: showDropdownInCenter }
        )}
        css={`
          background: ${(p) => p.theme.dark};
        `}
        ref={innerRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: modalWidth,
          left: dropdownOffset,
          // the modal should be right-aligned with the button
          right: "0px",
          transformOrigin: showDropdownInCenter
            ? "0 top"
            : caretOffset && `${caretOffset} top`
        }}
      >
        <button
          type="button"
          className={classNames(
            // Until we break these few components out of sass, we'll use regular ol classnames
            "tjs-sc-InnerPanelCloseButton",
            Styles.innerCloseBtn,
            {
              [Styles.innerCloseBtnForModal]: showDropdownAsModal
            }
          )}
          onClick={this.forceClose}
          title={t("general.close")}
          aria-label={t("general.close")}
          css={`
            svg {
              fill: ${(p) => p.theme.textLight};
            }
            &:hover,
            &:focus {
              svg {
                fill: ${(p) => p.theme.colorPrimary};
              }
            }
            ${(p) =>
              showDropdownAsModal &&
              `
                svg {
                  fill: ${p.theme.grey};
                }
            `}
          `}
        >
          <Icon glyph={Icon.GLYPHS.close} />
        </button>
        <If condition={defined(caretOffset) && !showDropdownAsModal}>
          <span
            className={classNames(Styles.caret, "tjs-sc-InnerPanel__caret")}
            style={{ left: caretOffset }}
            css={`
              background: ${(p) => p.theme.dark};
            `}
          />
        </If>
        <div className={Styles.content}>{children}</div>
      </div>
    );
  }
});

export default withTranslation()(InnerPanel);
