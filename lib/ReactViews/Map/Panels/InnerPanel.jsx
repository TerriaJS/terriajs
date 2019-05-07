import React from "react";
import PropTypes from "prop-types";
import createReactClass from "create-react-class";
import classNames from "classnames";

import defined from "terriajs-cesium/Source/Core/defined";

import Styles from "./panel.scss";

const InnerPanel = createReactClass({
  propTypes: {
    /**
     * A property that will be looked for on window click events - if it's set, the click event will not cause the
     * panel to close.
     */
    doNotCloseFlag: PropTypes.string,
    /** Will be called when the panel has finished hiding */
    onDismissed: PropTypes.func,
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
    ])
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
    window.addEventListener("click", this.close);
    setTimeout(() => this.setState({ isOpenCss: true }));
  },

  componentWillUnmount() {
    window.removeEventListener("click", this.close);
  },

  close(e) {
    // Only close if this wasn't a click on an open/close button.
    if (!this.props.doNotCloseFlag || !e[this.props.doNotCloseFlag]) {
      window.removeEventListener("click", this.close);

      // If we're closing we want to immediately change the css class to cause it to animate shut, then when it's
      // finished actually stop it rendering with isOpen = false
      this.setState({
        isOpenCss: false
      });

      setTimeout(() => {
        this.props.onDismissed();
      }, 200); // TODO: Determine when it stops animating instead of duplicating the 200ms timeout?
    }
  },

  render() {
    return (
      <div
        className={classNames(Styles.inner, this.props.theme.inner, {
          [Styles.isOpen]: this.state.isOpenCss
        })}
        ref={this.props.innerRef}
        onClick={e => e.stopPropagation()}
        style={{
          left: this.props.dropdownOffset,
          transformOrigin:
            this.props.caretOffset && `${this.props.caretOffset} top`
        }}
      >
        <If condition={defined(this.props.caretOffset)}>
          <span
            className={Styles.caret}
            style={{ left: this.props.caretOffset }}
          />
        </If>
        <div className={Styles.content}>{this.props.children}</div>
      </div>
    );
  }
});

export default InnerPanel;
