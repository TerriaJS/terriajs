'use strict';

import AbsPercentageWorkbenchSection from './Controls/AbsPercentageWorkbenchSection';
import classNames from 'classnames';
import ConceptViewer from './Controls/ConceptViewer';
import defined from 'terriajs-cesium/Source/Core/defined';
import Legend from './Controls/Legend';
import ObserveModelMixin from './../ObserveModelMixin';
import OpacitySection from './Controls/OpacitySection';
import React from 'react';
import ShortReport from './Controls/ShortReport';
import Styles from './workbench-item.scss';
import ViewingControls from './Controls/ViewingControls';

const WorkbenchItem = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        item: React.PropTypes.object.isRequired,
        dragging: React.PropTypes.bool,
        onDragStart: React.PropTypes.func,
        onDragOver: React.PropTypes.func,
        onDragEnd: React.PropTypes.func,
        viewState: React.PropTypes.object.isRequired,
        setWrapperState: React.PropTypes.func
    },

    toggleDisplay() {
        this.props.item.isLegendVisible = !this.props.item.isLegendVisible;
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
            previewed: this.props.item,
        });
    },

    toggleVisibility() {
        this.props.item.isShown = !this.props.item.isShown;
    },

    render() {
        const workbenchItem = this.props.item;

        return (
            <li className={classNames(
                Styles.workbenchItem,
                {
                    [Styles.isOpen]: workbenchItem.isLegendVisible,
                    [Styles.isDragging]: this.props.dragging
                })}
                onDragOver={this.onDragOver}>

                <ul className={Styles.header}>
                    <If condition={workbenchItem.supportsToggleShown}>
                        <li className={Styles.visibilityColumn}>
                            <button type='button'
                                    onClick={this.toggleVisibility}
                                    title="Data show/hide"
                                    className={classNames(
                                        Styles.btnVisibility,
                                        {
                                            [Styles.btnVisibilityVisible]: workbenchItem.isShown,
                                            [Styles.btnVisibilityInvisible]: !workbenchItem.isShown
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
                            <If condition={!workbenchItem.isMappable}>
                                <i className={classNames(Styles.icon, Styles.iconLineChart)} />
                            </If>
                            {workbenchItem.name}
                        </button>
                    </li>
                    <li className={Styles.toggleColumn}>
                        <button type='button'
                                onClick={this.toggleDisplay}
                                className={classNames(
                                    Styles.btnToggle,
                                    {[Styles.btnToggleIsOpen]: workbenchItem.isLegendVisible}
                                )}
                        />
                    </li>
                    <li className={Styles.headerClearfix} />
                </ul>

                <If condition={workbenchItem.isLegendVisible}>
                    <div className={Styles.inner}>
                        <ViewingControls item={workbenchItem} viewState={this.props.viewState}/>
                        <OpacitySection item={workbenchItem}/>
                        <If condition={workbenchItem.type === 'abs-itt'}>
                            <AbsPercentageWorkbenchSection item={workbenchItem}/>
                        </If>
                        <Legend item={workbenchItem}/>
                        <If condition={(defined(workbenchItem.concepts) && workbenchItem.concepts.length > 0)}>
                            <ConceptViewer item={workbenchItem}/>
                        </If>
                        <If condition={workbenchItem.shortReport || (workbenchItem.shortReportSections && workbenchItem.shortReportSections.length)}>
                            <ShortReport item={workbenchItem}/>
                        </If>
                    </div>
                </If>
            </li>
        );
    }
});

module.exports = WorkbenchItem;
