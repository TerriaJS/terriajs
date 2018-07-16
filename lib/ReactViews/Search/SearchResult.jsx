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
        icon: PropTypes.string,
        theme: PropTypes.string
    },

    getDefaultProps() {
        return {
            icon: false,
            theme: "dark"
        };
    },

    render() {
        return (
            <li className={classNames(Styles.searchResult, {[Styles.dark]: this.props.theme === 'dark', [Styles.light]: this.props.theme === 'light'})}>
                <button type='button' onClick={this.props.clickAction} className={Styles.btn}>
                    {this.props.icon && <span className={Styles.icon}><Icon glyph={Icon.GLYPHS[this.props.icon]}/></span>}
                    <span className={Styles.resultName}>{this.props.name}</span>
                    <span className={Styles.arrowIcon}><Icon glyph={Icon.GLYPHS.right}/></span>
                </button>
            </li>
        );
    }
});

module.exports = SearchResult;
