import React from 'react';

import defined from 'terriajs-cesium/Source/Core/defined';

import Styles from './mobile-menu-item.scss';

export default function MobileMenuItem(props) {
    return (
        <div className={Styles.root}>
            <Choose>
                <When condition={props.href}>
                    <a href={props.href} onClick={props.onClick} className={Styles.link}>{props.caption}</a>
                </When>
                <Otherwise>
                    <button onClick={props.onClick} className={Styles.link}>{props.caption}</button>
                </Otherwise>
            </Choose>
        </div>
    );
}

MobileMenuItem.defaultProps = {
    onClick: () => {}
};
