import React from 'react';
import WorkbenchItem from './WorkbenchItem.jsx';
import ObserveModelMixin from './../ObserveModelMixin';
import arrayContains from '../../Core/arrayContains';
import Styles from './workbench-list.scss';
import classNames from 'classnames';

const WorkbenchList = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    getInitialState() {
        return {
            placeholderIndex: -1,
            draggedItem: null
        };
    },

    onDragStart(item, index, e) {
        const dataTransfer = e.dataTransfer || e.originalEvent.dataTransfer;
        dataTransfer.effectAllowed = 'move';
        dataTransfer.setData('text', 'Dragging a Now Viewing item.');

        this.setState({
            draggedItem: item,
            placeholderIndex: index
        });
    },

    onDragOverDropZone(placeholderIndex, e) {
        const dataTransfer = e.dataTransfer || e.originalEvent.dataTransfer;

        if ((dataTransfer.types && arrayContains(dataTransfer.types, 'Files')) || !this.state.draggedItem) {
            return;
        }

        if (placeholderIndex !== this.state.placeholderIndex) {
            this.setState({placeholderIndex: placeholderIndex});
        }

        dataTransfer.dropEffect = 'move';
        e.preventDefault();
        e.stopPropagation();
    },

    onDragOverItem(over, e) {
        const dataTransfer = e.dataTransfer || e.originalEvent.dataTransfer;

        if ((dataTransfer.types && arrayContains(dataTransfer.types, 'Files')) || !this.state.draggedItem) {
            return;
        }

        if (e.clientY - e.currentTarget.offsetTop > e.currentTarget.offsetHeight / 2) {
            over++;
        }

        if (over !== this.state.placeholderIndex) {
            this.setState({placeholderIndex: over});
        }

        dataTransfer.dropEffect = 'move';
        e.preventDefault();
        e.stopPropagation();
    },

    onDrop(e) {
        if (this.state.placeholderIndex >= 0) {
            const draggedItemIndex = this.props.terria.nowViewing.items.indexOf(this.state.draggedItem);
            this.props.terria.nowViewing.items.splice(draggedItemIndex, 1);

            const addAtIndex = this.state.placeholderIndex > draggedItemIndex ? this.state.placeholderIndex - 1 : this.state.placeholderIndex;
            this.props.terria.nowViewing.items.splice(addAtIndex, 0, this.state.draggedItem);
        }

        this.resetHover();
    },

    onDragEnd(e) {
        this.resetHover();
    },

    onDragLeaveContainer(e) {
        const x = e.clientX;
        const y = e.clientY;
        const top = e.currentTarget.offsetTop;
        const bottom = top + e.currentTarget.offsetHeight;
        const left = e.currentTarget.offsetLeft;
        const right = left + e.currentTarget.offsetWidth;
        if (y <= top || y >= bottom || x <= left || x >= right) {
            this.setState({placeholderIndex: -1});
        }
    },

    resetHover() {
        this.setState({placeholderIndex: -1, draggedItem: null});
    },

    render() {
        return (
            <ul className={Styles.workbenchContent} onDragLeave={this.onDragLeaveContainer} onDrop={this.onDrop}>
                <For each="item" of={this.props.terria.nowViewing.items} index="i">
                    {this.renderDropzone(i)}
                    <WorkbenchItem item={item}
                                   key={item.uniqueId}
                                   dragging={this.state.draggedItem === item}
                                   onDragOver={this.onDragOverItem.bind(this, i)}
                                   onDragStart={this.onDragStart.bind(this, item, i)}
                                   onDragEnd={this.onDragEnd}
                                   viewState={this.props.viewState}
                    />
                </For>
                {this.renderDropzone(this.props.terria.nowViewing.items.length)}
            </ul>
        );
    },

    renderDropzone(index) {
        return (
            <li className={classNames(Styles.dropZone, {[Styles.isActive]: this.state.placeholderIndex === index})}
                key={'dropzone' + index}
                onDragOver={this.onDragOverDropZone.bind(this, index)}
            />
        );
    }
});

module.exports = WorkbenchList;
