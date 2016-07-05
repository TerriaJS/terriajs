import React from 'react';
import Icon from "../Icon.jsx";
import Styles from './search-result.scss';
import classNames from 'classnames';

// A Location item when doing Bing map searvh or Gazetter search
const LocationItem = React.createClass({
    propTypes: {
        name: React.PropTypes.string.isRequired,
        clickAction: React.PropTypes.func.isRequired,
        showPin: React.PropTypes.bool,
        theme: React.PropTypes.string
    },

    getDefaultProps() {
        return {
            showPin: true,
            theme: "dark"
        };
    },

    render() {
        return (
            <li className={classNames(Styles.locationItem, {[Styles.dark]: this.props.theme === 'dark', [Styles.light]: this.props.theme === 'light'})}>
                <button type='button' onClick={this.props.clickAction} className={classNames(Styles.btn, {[Styles.btnLocationName]: this.props.showPin})}>
                    {this.props.showPin ? <span className={Styles.locationIcon}><Icon glyph={Icon.GLYPHS.location}/></span> : null}
                    <span>{this.props.name}</span>
                    <span className={Styles.arrowIcon}><Icon glyph={Icon.GLYPHS.right}/></span>
                </button>
            </li>
        );
    }
});

module.exports = LocationItem;
