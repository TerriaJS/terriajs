import React from 'react';
import Styles from './mobile-menu-item.scss';

export default function MobileMenuItem(props) {
    return (
        <li className={Styles.root}>
            <Choose>
                <When condition={props.href}>
                    <a href={props.href} onClick={props.onClick} className={Styles.link}>{props.caption}</a>
                </When>
                <Otherwise>
                    <button onClick={props.onClick} className={Styles.link}>{props.caption}</button>
                </Otherwise>
            </Choose>
        </li>
    );
}
