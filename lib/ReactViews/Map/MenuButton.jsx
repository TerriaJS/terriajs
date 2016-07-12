import React from 'react';

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
            </a>
        </div>
    );
}

MenuButton.defaultProps = {
    href: '#'
};

MenuButton.propTypes = {
    href: React.PropTypes.string,
    caption: React.PropTypes.string.isRequired
};

export default MenuButton;
