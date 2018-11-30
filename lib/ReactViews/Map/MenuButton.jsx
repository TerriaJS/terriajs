import React from 'react';
import Icon from '../Icon.jsx';
import PropTypes from 'prop-types';
import Styles from './menu-button.scss';

/**
 * Basic button for use in the menu part at the top of the map.
 *
 * @constructor
 */
function MenuButton(props) {
    return (
        <div>
            <a className={Styles.btnAboutLink}
               href={props.href}
               target={props.href !== '#' ? '_blank' : undefined}
               title={props.caption}>
                <span>{props.caption}</span>
                {props.href !== '#' && <Icon glyph={Icon.GLYPHS.externalLink}/>}
            </a>
        </div>
    );
}

MenuButton.defaultProps = {
    href: '#'
};

MenuButton.propTypes = {
    href: PropTypes.string,
    caption: PropTypes.string.isRequired
};

export default MenuButton;
