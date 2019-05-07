import React from "react";
import Icon from "../Icon.jsx";
import PropTypes from "prop-types";

import Styles from "./mobile-menu-item.scss";

/** A simple text item in the mobile menu */
export default function MobileMenuItem(props) {
  return (
    <div className={Styles.root}>
      <Choose>
        <When condition={props.href}>
          <a
            href={props.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={props.onClick}
            className={Styles.link}
          >
            {props.caption}
            {props.href !== "#" && <Icon glyph={Icon.GLYPHS.externalLink} />}
          </a>
        </When>
        <Otherwise>
          <button onClick={props.onClick} className={Styles.link}>
            {props.caption}
          </button>
        </Otherwise>
      </Choose>
    </div>
  );
}

MobileMenuItem.propTypes = {
  href: PropTypes.string,
  onClick: PropTypes.func,
  caption: PropTypes.string
};

MobileMenuItem.defaultProps = {
  onClick: () => {}
};
