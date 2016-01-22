'use strict';
const React = require('react');
const NowViewingItem = require('./NowViewingItem.jsx');
const ObserveModelMixin = require('./ObserveModelMixin');
const PureRenderMixin = require('react-addons-pure-render-mixin');
const defined = require('terriajs-cesium/Source/Core/defined');

const NowViewingContainer = React.createClass({
    propTypes: {
      nowViewing: React.PropTypes.array
    },

    getInitialState() {
      return {
        placeholderIndex: -1,
        draggedItemIndex: -1,
        items: this.props.nowViewing,
        selectedItem: null
      };
    },

    onDragStart(e) {
        if (defined(e.dataTransfer)) {
            e.dataTransfer.dropEffect = 'move';
            e.dataTransfer.setData('text', 'Dragging a Now Viewing item.');
        }
        else {
            e.originalEvent.dataTransfer.dropEffect = 'move';
            e.originalEvent.dataTransfer.setData('text', 'Dragging a Now Viewing item.');
        }

        const selectedIndex = parseInt(e.currentTarget.dataset.key, 10);

        this.setState({
          draggedItemIndex: selectedIndex,
          selectedItem: this.state.items[selectedIndex]
        });
    },

    onDragEnd(e) {
        if(this.state.placeholderIndex === -1) {
            this.state.items.splice(this.state.draggedItemIndex, 1);
            this.state.draggedItemIndex = -1;
            this.setState(this.state);
            return;
        }
    },

    onDragOverDropZone(e) {
        const placeholderIndex = parseInt(e.currentTarget.dataset.key, 10);
        if(placeholderIndex !== this.state.placeholderIndex) { this.setState({ placeholderIndex: placeholderIndex });}
        e.preventDefault();
    },

    onDragOverItem(e) {
        let over = parseInt(e.currentTarget.dataset.key, 10);
        if(e.clientY - e.currentTarget.offsetTop > e.currentTarget.offsetHeight / 2) { over++; }
        if(over !== this.state.placeholderIndex) { this.setState({ placeholderIndex: over }); }
        e.preventDefault();
    },

    onDrop(e) {
      if(this.state.placeholderIndex !== -1) {
        this.state.items.splice(this.state.placeholderIndex, 0, this.state.selectedItem);
        if(this.state.draggedItemIndex > this.state.placeholderIndex) {
          this.state.draggedItemIndex = this.state.draggedItemIndex + 1;
        }
        this.state.placeholderIndex = -1;
        this.setState(this.state);
      }
    },

    onDragLeave(){

    },

    renderNowViewingItem(item, i) {
       return <NowViewingItem nowViewingItem={item} index={i} key={'placeholder-' + i} onDragOver={this.onDragOverItem} onDragStart={this.onDragStart}/>;
    },

    renderPlaceholder(i) {
       return <li className={(this.state.placeholderIndex === i) ? 'nowViewing__drop-zone is-active' : 'nowViewing__drop-zone'} data-key={i} key={i} onDrop={this.onDrop} onDragOver={this.onDragOverDropZone} ></li>;
    },

    renderListElements() {
       const items = [];
       let i;

       for(i = 0; i < this.state.items.length; i++) {
        items.push(this.renderPlaceholder(i));
        items.push(this.renderNowViewingItem(this.state.items[i], i));
        }
        items.push(this.renderPlaceholder(i));
        return items;
    },

    render() {
      return <ul className="now-viewing__content list-reset" onDragLeave={this.onDragLeave} onDragEnd={this.onDragEnd}>
             {this.renderListElements()}
             </ul>;
    }
});
module.exports = NowViewingContainer;
