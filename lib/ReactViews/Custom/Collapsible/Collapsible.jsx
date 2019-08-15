import classNames from "classnames";
import React from "react";
import PropTypes from "prop-types";
import createReactClass from "create-react-class";
import Icon from "../../Icon";
import Styles from "./collapsible.scss";

const Collapsible = createReactClass({
  propTypes: {
    title: PropTypes.string,
    startsOpen: PropTypes.bool,
    isInverse: PropTypes.bool,
    children: PropTypes.any
  },

  getInitialState: function() {
    return { isOpen: this.props.startsOpen };
  },

  toggleOpen() {
    const isOpen = this.state.isOpen;
    this.setState({ isOpen: !isOpen });
  },

  render() {
    let body;
    if (this.state.isOpen) {
      body = <div className={Styles.body}>{this.props.children}</div>;
    }
    const classObject = {
      [Styles.isOpen]: this.state.isOpen,
      [Styles.isInverse]: this.props.isInverse
    };
    return (
      <div className={Styles.root}>
        <div className={Styles.header}>
          <button
            type="button"
            onClick={this.toggleOpen}
            className={classNames(Styles.btn, classObject)}
          >
            <Icon
              glyph={
                this.state.isOpen ? Icon.GLYPHS.opened : Icon.GLYPHS.closed
              }
            />
          </button>
          <span>{this.props.title}</span>
        </div>
        {body}
      </div>
    );
  }
});
module.exports = Collapsible;
