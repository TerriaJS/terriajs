import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import Icon from "../Icon";
import Styles from './search-result.scss';
import classNames from 'classnames';

// A Location item when doing Bing map searvh or Gazetter search
const SearchResult = createReactClass({
    propTypes: {
        name: PropTypes.string.isRequired,
        clickAction: PropTypes.func.isRequired,
        showPin: PropTypes.bool,
        theme: PropTypes.string
    },

    getDefaultProps() {
        return {
            showPin: true,
            theme: "dark"
        };
    },

    render() {
        return (
            <li className={classNames(Styles.searchResult, {[Styles.dark]: this.props.theme === 'dark', [Styles.light]: this.props.theme === 'light'})}>
                <button type='button' onClick={this.props.clickAction} className={classNames(Styles.btn, {[Styles.btnLocationName]: this.props.showPin})}>
                    {this.props.showPin ? <span className={Styles.locationIcon}><Icon glyph={Icon.GLYPHS.location}/></span> : null}
                    <span>{this.props.name}</span>
                    <span className={Styles.arrowIcon}><Icon glyph={Icon.GLYPHS.right}/></span>
                </button>
            </li>
        );
    }
});

module.exports = SearchResult;
