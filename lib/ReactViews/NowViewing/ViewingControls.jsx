'use strict';

import ObserveModelMixin from './../ObserveModelMixin';
import React from 'react';

const ViewingControls = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        nowViewingItem: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    removeFromMap() {
        this.props.nowViewingItem.isEnabled = false;
    },

    toggleVisibility() {
        this.props.nowViewingItem.isShown = !this.props.nowViewingItem.isShown;
    },

    zoom() {
        this.props.nowViewingItem.zoomToAndUseClock();
    },

    previewItem() {
        this.props.viewState.viewCatalogItem(this.props.nowViewingItem);
    },

    render() {
        const nowViewingItem = this.props.nowViewingItem;
        return (
            <ul className="now-viewing__item__control">
                <li className='zoom'><button onClick={this.zoom} data-key={this.props.index} title="Zoom in data" className="btn">Zoom To</button></li>
                <li className='info'><button onClick={this.previewItem} className='btn' title='info'>info</button></li>
                <li className='remove'><button onClick={this.removeFromMap} title="Remove this data" className="btn">Remove</button></li>
                <li className='visibility'><button onClick={this.toggleVisibility} title="Data show/hide" className={'btn btn--visibility ' + (nowViewingItem.isShown ? 'is-visible' : '')}></button></li>
            </ul>
        );
    }
});
module.exports = ViewingControls;
