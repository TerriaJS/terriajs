'use strict';

import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';

const Collapsible = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        title: React.PropTypes.string,
        startsOpen: React.PropTypes.bool
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
                <div className='collapsible-body'>
                    {this.props.children}
                </div>
            );
        }
        return (
            <div className='collapsible'>
                <div className='collapsible-header'>
                    <button type='button' onClick={this.toggleOpen} className={'btn btn--toggle ' + (this.state.isOpen === true ? 'is-open' : '')}></button>
                    <span>{this.props.title}</span>
                </div>
                {body}
            </div>
        );
    }
});
module.exports = Collapsible;
