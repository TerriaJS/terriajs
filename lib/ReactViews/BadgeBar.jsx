import React from "react";
import PropTypes from "prop-types";
import createReactClass from "create-react-class";
import defined from "terriajs-cesium/Source/Core/defined";
import Styles from "./badge-bar.scss";
import classNames from "classnames";

const BadgeBar = createReactClass({
  propTypes: {
    label: PropTypes.string,
    badge: PropTypes.number,
    smallBadge: PropTypes.bool,
    buttonCaption: PropTypes.string,
    children: PropTypes.node
  },

  render() {
    return (
      <ul
        className={classNames(Styles.header, {
          [Styles.smallBadge]: this.props.smallBadge
        })}
      >
        <li>
          <label className={Styles.title}>{this.props.label}</label>
        </li>
        {defined(this.props.badge) && (
          <li>
            <label className={Styles.labelBadge}>({this.props.badge})</label>
          </li>
        )}
        <li>{this.props.children}</li>
      </ul>
    );
  }
});

export default BadgeBar;
