import React from 'react';
import Styles from './badge-bar.scss';

const BadgeBar = React.createClass({
    propTypes: {
        label: React.PropTypes.string,
        badge: React.PropTypes.number,
        buttonCaption: React.PropTypes.string,
        children: React.PropTypes.node
    },

    render() {
        return (
            <ul className={Styles.header}>
                <li>
                    <label className={Styles.title}>{this.props.label}</label>
                </li>
                <li>
                    <label className={Styles.labelBadge}>[ {this.props.badge} ]</label>
                </li>
                <li>
                    {this.props.children}
                </li>
            </ul>
        );
    }
});

export default BadgeBar;
