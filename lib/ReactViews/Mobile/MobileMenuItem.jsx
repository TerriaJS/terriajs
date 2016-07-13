import React from 'react';

import Styles from './mobile-menu-item.scss';

/** A simple text item in the mobile menu */
export default function MobileMenuItem(props) {
    return (
        <div className={Styles.root}>
            <Choose>
                <When condition={props.href}>
                    <a href={props.href} target="_blank" onClick={props.onClick}
                       className={Styles.link}>{props.caption}</a>
                </When>
                <Otherwise>
                    <button onClick={props.onClick} className={Styles.link}>{props.caption}</button>
                </Otherwise>
            </Choose>
        </div>
    );
}

MobileMenuItem.propTypes = {
    href: React.PropTypes.string,
    onClick: React.PropTypes.func,
    caption: React.PropTypes.string
};

MobileMenuItem.defaultProps = {
    onClick: () => {}
};
