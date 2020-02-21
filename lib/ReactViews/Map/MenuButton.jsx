import React from "react";
import Icon from "../Icon.jsx";
import PropTypes from "prop-types";
import Styles from "./menu-button.scss";

/**
 * Basic button for use in the menu part at the top of the map.
 *
 * @constructor
 */
function MenuButton(props) {
  return (
    <div>
      <Choose>
        <When condition={props.href}>
          <a
            className={Styles.btnAboutLink}
            href={props.href}
            target={props.href !== "#" ? props.target || "_blank" : undefined}
            title={props.caption}
          >
            {props.href !== "#" && <Icon glyph={Icon.GLYPHS.externalLink} />}
            <span>{props.caption}</span>
          </a>
        </When>
        <Otherwise>
          <button onClick={props.onClick} className={Styles.btnAboutLink}>
            {props.caption}
          </button>
        </Otherwise>
      </Choose>

      {/* <a
        className={Styles.btnAboutLink}
        href={props.href}
        target={props.href !== "#" ? props.target || "_blank" : undefined}
        title={props.caption}
      >
        {props.href !== "#" && <Icon glyph={Icon.GLYPHS.externalLink} />}
        <span>{props.caption}</span>
      </a> */}
    </div>
  );
}

MenuButton.defaultProps = {
  onClick: () => {}
};

MenuButton.propTypes = {
  href: PropTypes.string,
  onClick: PropTypes.func,
  caption: PropTypes.string
};

export default MenuButton;
