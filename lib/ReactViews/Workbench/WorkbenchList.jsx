import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import Sortable from 'react-anything-sortable';

import WorkbenchItem from './WorkbenchItem';
import ObserveModelMixin from '../ObserveModelMixin';
import { observer } from 'mobx-react';


import Styles from './workbench-list.scss';
import '!!style-loader!css-loader?sourceMap!react-anything-sortable/sortable.css';
import '!!style-loader!css-loader?sourceMap!./sortable.css';

const WorkbenchList = observer(createReactClass({
    displayName: 'WorkbenchList',
    // mixins: [ObserveModelMixin],

    propTypes: {
        terria: PropTypes.object.isRequired,
        viewState: PropTypes.object.isRequired
    },

    onSort(sortedArray, currentDraggingSortData, currentDraggingIndex) {
        let draggedItemIndex = this.props.terria.workbench.items.indexOf(currentDraggingSortData);
        const addAtIndex = currentDraggingIndex;
        this.props.terria.workbench.items.splice(draggedItemIndex, 1);
        this.props.terria.workbench.items.splice(addAtIndex, 0, currentDraggingSortData);

        // while (draggedItemIndex < addAtIndex) {
        //     this.props.terria.nowViewing.lower(currentDraggingSortData);
        //     ++draggedItemIndex;
        // }

        // while (draggedItemIndex > addAtIndex) {
        //     this.props.terria.nowViewing.raise(currentDraggingSortData);
        //     --draggedItemIndex;
        // }
    },

    render() {
        return (
            <ul className={Styles.workbenchContent}>
                <Sortable onSort={this.onSort} direction="vertical" dynamic={true}>
                    <For each="item" of={this.props.terria.workbench.items}>
                        <WorkbenchItem item={item}
                                       sortData={item}
                                       key={item.uniqueId}
                                       viewState={this.props.viewState}
                        />
                    </For>
                </Sortable>
            </ul>
        );
    },
}));

module.exports = WorkbenchList;
