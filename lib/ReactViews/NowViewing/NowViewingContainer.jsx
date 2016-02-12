'use strict';

import React from 'react';
import NowViewingItem from './NowViewingItem.jsx';
import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from './../ObserveModelMixin';
import arrayContains from '../../Core/arrayContains';

const NowViewingContainer = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        nowViewingItems: React.PropTypes.array.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    getInitialState() {
        return {
            placeholderIndex: -1,
            draggedItemIndex: -1,
            selectedItem: null
        };
    },

    onDragStart(e) {
        if (defined(e.dataTransfer)) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text', 'Dragging a Now Viewing item.');
        } else {
            e.originalEvent.dataTransfer.effectAllowed = 'move';
            e.originalEvent.dataTransfer.setData('text', 'Dragging a Now Viewing item.');
        }

        const _draggedItemIndex = parseInt(e.currentTarget.dataset.key, 10);

        this.setState({
            draggedItemIndex: _draggedItemIndex,
            selectedItem: this.props.nowViewingItems[_draggedItemIndex]
        });
    },

    onDragEnd(e) {
        if(e.dataTransfer.dropEffect === 'move') {
            this.props.nowViewingItems.splice(this.state.draggedItemIndex, 1);
            this.state.draggedItemIndex = -1;
            this.state.placeholderIndex = -1;
            this.setState(this.state);
            return;
        }
        if(this.state.placeholderIndex !== -1 || this.state.draggedItemIndex !== -1) {
            this.setState({
                placeholderIndex: -1,
                draggedItemIndex: -1
            });
        }
    },

    onDragOverDropZone(e) {
        if (e.dataTransfer.types && arrayContains(e.dataTransfer.types, 'Files')) {
            return;
        }
        const _placeholderIndex = parseInt(e.currentTarget.dataset.key, 10);
        if(_placeholderIndex !== this.state.placeholderIndex) { this.setState({ placeholderIndex: _placeholderIndex });}
        e.preventDefault();
        e.stopPropagation();
    },

    onDragOverItem(e) {
        if (e.dataTransfer.types && arrayContains(e.dataTransfer.types, 'Files')) {
            return;
        }

        let over = parseInt(e.currentTarget.dataset.key, 10);
        if(e.clientY - e.currentTarget.offsetTop > e.currentTarget.offsetHeight / 2) { over++; }
        if(over !== this.state.placeholderIndex) { this.setState({ placeholderIndex: over }); }
        e.preventDefault();
        e.stopPropagation();
    },

    onDrop(e) {
        if(this.state.placeholderIndex !== -1) {
            this.props.nowViewingItems.splice(this.state.placeholderIndex, 0, this.state.selectedItem);
            if(this.state.draggedItemIndex > this.state.placeholderIndex) {
                this.state.draggedItemIndex = this.state.draggedItemIndex + 1;
            }
            this.state.placeholderIndex = -1;
            this.setState(this.state);
        }
    },

    onDragLeaveContainer(e) {
        const x = e.clientX;
        const y = e.clientY;
        const top = e.currentTarget.offsetTop;
        const bottom = top + e.currentTarget.offsetHeight;
        const left = e.currentTarget.offsetLeft;
        const right = left + e.currentTarget.offsetWidth;
        if(y <= top || y >= bottom || x <= left || x >= right) { this.resetHover(); }
    },

    resetHover(e) {
        if(this.state.placeholderIndex !== -1) {
            this.setState({ placeholderIndex: -1 });
        }
    },

    renderNowViewingItem(item, i) {
        return <NowViewingItem nowViewingItem={item}
                               index={i}
                               key={'placeholder-' + i}
                               dragging={this.state.draggedItemIndex === i}
                               onDragOver={this.onDragOverItem}
                               onDragStart={this.onDragStart}
                               onDragEnd={this.onDragEnd}
                               viewState={this.props.viewState}
                />;
    },

    renderPlaceholder(i) {
        return <li className={(this.state.placeholderIndex === i) ? 'drop-zone is-active' : 'drop-zone'} data-key={i} key={i} onDragOver={this.onDragOverDropZone} ></li>;
    },

    renderListElements() {
        const items = [];
        let i;

        const nowViewingItems = this.props.nowViewingItems;

        for (i = 0; i < nowViewingItems.length; i++) {
            items.push(this.renderPlaceholder(i));
            items.push(this.renderNowViewingItem(nowViewingItems[i], i));
        }
        items.push(this.renderPlaceholder(i));
        return items;
    },

    render() {
        return (
            <ul className="now-viewing__content" onDragLeave={this.onDragLeaveContainer} onDrop={this.onDrop}>
              {this.renderListElements()}
            </ul>);
    }
});

module.exports = NowViewingContainer;
