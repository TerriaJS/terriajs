'use strict';

import classNames from 'classnames'
import React from 'react';

import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './collapsible.scss';

const Collapsible = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        title: React.PropTypes.string,
        startsOpen: React.PropTypes.bool,
        children: React.PropTypes.any
    },

    getInitialState: function() {
        return {isOpen: this.props.startsOpen};
    },

    toggleOpen() {
        const isOpen = this.state.isOpen;
        this.setState({isOpen: !isOpen});
    },

    render() {
        let body;
        if (this.state.isOpen) {
            body = (
                <div className={Styles.body}>
                    {this.props.children}
                </div>
            );
        }
        return (
            <div className={Styles.root}>
                <div className={Styles.header}>
                    <button type='button'
                            onClick={this.toggleOpen}
                            className={classNames(Styles.btn, {[Styles.isOpen]: this.state.isOpen})}/>
                    <span>{this.props.title}</span>
                </div>
                {body}
            </div>
        );
    }
});
module.exports = Collapsible;
