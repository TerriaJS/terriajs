'use strict';

import Legend from './Legend';
import ObserveModelMixin from './../ObserveModelMixin';
import OpacitySection from './OpacitySection';
import React from 'react';
import ViewingControls from './ViewingControls';
import Voldemort from './Voldemort';
import ShortReport from './ShortReport';

const NowViewingItem = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        nowViewingItem: React.PropTypes.object.isRequired,
        index: React.PropTypes.number.isRequired,
        dragging: React.PropTypes.bool,
        onDragStart: React.PropTypes.func,
        onDragOver: React.PropTypes.func,
        onDragEnd: React.PropTypes.func,
        viewState: React.PropTypes.object.isRequired
    },

    toggleDisplay() {
        this.props.nowViewingItem.isLegendVisible = !this.props.nowViewingItem.isLegendVisible;
    },

    onDragStart(e) {
        this.props.onDragStart(e);
    },

    onDragOver(e) {
        this.props.onDragOver(e);
    },

    onDragEnd(e) {
        this.props.onDragEnd(e);
    },

    openModal() {
        this.props.setWrapperState({
            modalWindowIsOpen: true,
            activeTab: 1,
            previewed: this.props.nowViewingItem,
        });
    },

    render() {
        const nowViewingItem = this.props.nowViewingItem;
        let chartIcon;
        if (!nowViewingItem.isMappable) {
            // TODO: use real CSS.
            chartIcon = <i className='icon icon-line-chart' style={{float: 'left', fontSize: '140%', marginRight: '5px', color: '#CCC'}}></i>;
        }
        return (
            <li className={'now-viewing__item ' + (nowViewingItem.isLegendVisible === true ? 'is-open' : '') + ' ' + (this.props.dragging === true ? 'is-dragging' : '')} onDragOver ={this.onDragOver} data-key={this.props.index}>
                <ul className ="now-viewing__item__header">
                    <li><button type='button' draggable='true' data-key={this.props.index} onDragStart={this.onDragStart} onDragEnd={this.onDragEnd} className="btn btn--drag">{chartIcon}{nowViewingItem.name}</button></li>
                    <li><button type='button' onClick={this.toggleDisplay} className={'btn btn--toggle ' + (nowViewingItem.isLegendVisible === true ? 'is-open' : '')}></button></li>
                </ul>
                <div className ="now-viewing__item__inner">
                    <ViewingControls nowViewingItem={nowViewingItem} viewState={this.props.viewState} />
                    <OpacitySection nowViewingItem={nowViewingItem} />
                    <Legend nowViewingItem={nowViewingItem} />
                    <Voldemort nowViewingItem={nowViewingItem} />
                    <ShortReport nowViewingItem={nowViewingItem}/>
                </div>
            </li>
        );
    }
});

module.exports = NowViewingItem;
