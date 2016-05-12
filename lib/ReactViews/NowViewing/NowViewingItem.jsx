'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';
import React from 'react';
import classNames from 'classnames';

import ObserveModelMixin from './../ObserveModelMixin';
import Legend from './Controls/Legend';
import OpacitySection from './Controls/OpacitySection';
import ViewingControls from './Controls/ViewingControls';
import Voldemort from './Controls/Voldemort';
import ShortReport from './Controls/ShortReport';

import Styles from './now-viewing-item.scss';

const NowViewingItem = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        nowViewingItem: React.PropTypes.object.isRequired,
        dragging: React.PropTypes.bool,
        onDragStart: React.PropTypes.func,
        onDragOver: React.PropTypes.func,
        onDragEnd: React.PropTypes.func,
        viewState: React.PropTypes.object.isRequired,
        setWrapperState: React.PropTypes.func
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

    toggleVisibility() {
        this.props.nowViewingItem.isShown = !this.props.nowViewingItem.isShown;
    },

    render() {
        const nowViewingItem = this.props.nowViewingItem;

        return (
            <li className={classNames(
                Styles.nowViewingItem,
                {
                    [Styles.isOpen]: nowViewingItem.isLegendVisible,
                    [Styles.isDragging]: this.props.dragging
                })}
                onDragOver={this.onDragOver}>

                <ul className={Styles.header}>
                    <If condition={nowViewingItem.supportsToggleShown}>
                        <li className={Styles.visibilityColumn}>
                            <button type='button'
                                    onClick={this.toggleVisibility}
                                    title="Data show/hide"
                                    className={classNames(
                                        Styles.btnVisibility,
                                        {
                                            [Styles.btnVisibilityVisible]: nowViewingItem.isShown,
                                            [Styles.btnVisibilityInvisible]: !nowViewingItem.isShown
                                        }
                                    )}
                            />
                        </li>
                    </If>
                    <li className={Styles.nameColumn}>
                        <button type='button'
                                draggable='true'
                                onDragStart={this.onDragStart}
                                onDragEnd={this.onDragEnd}
                                className={classNames(Styles.btn)}>
                            <If condition={!nowViewingItem.isMappable}>
                                <i className={classNames(Styles.icon, Styles.iconLineChart)} />
                            </If>
                            {nowViewingItem.name}
                        </button>
                    </li>
                    <li className={Styles.toggleColumn}>
                        <button type='button'
                                onClick={this.toggleDisplay}
                                className={classNames(
                                    Styles.btnToggle,
                                    {[Styles.btnToggleIsOpen]: nowViewingItem.isLegendVisible}
                                )}
                        />
                    </li>
                </ul>

                <If condition={nowViewingItem.isLegendVisible}>
                    <div className={Styles.inner}>
                        <ViewingControls nowViewingItem={nowViewingItem} viewState={this.props.viewState}/>
                        <OpacitySection nowViewingItem={nowViewingItem}/>
                        <Legend nowViewingItem={nowViewingItem}/>
                        <If condition={(defined(nowViewingItem.concepts) && nowViewingItem.concepts.length > 0)}>
                            <Voldemort nowViewingItem={nowViewingItem}/>
                        </If>
                        <If condition={nowViewingItem.shortReport || (nowViewingItem.shortReportSections && nowViewingItem.shortReportSections.length)}>
                            <ShortReport nowViewingItem={nowViewingItem}/>
                        </If>
                    </div>
                </If>
            </li>
        );
    }
});

module.exports = NowViewingItem;
