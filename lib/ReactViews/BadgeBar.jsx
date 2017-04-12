import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import Styles from './badge-bar.scss';

const BadgeBar = createReactClass({
    propTypes: {
        label: PropTypes.string,
        badge: PropTypes.number,
        buttonCaption: PropTypes.string,
        children: PropTypes.node
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
