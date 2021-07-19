import React, { Children } from "react";
import PropTypes from "prop-types";
import createReactClass from "create-react-class";
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
      <div className={classNames(Styles.badgebar)}>
        <ul className={classNames(Styles.list)}>
          <li>
            <label className={Styles.title}>
              {this.props.label}
              {this.props.badge ? ` (${this.props.badge})` : null}
            </label>
          </li>
          {Children.map(this.props.children, (child, i) => (
            <li key={i}>{child}</li>
          ))}
        </ul>
      </div>
    );
  }
});

export default BadgeBar;
