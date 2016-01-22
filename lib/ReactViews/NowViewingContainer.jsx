'use strict';
const React = require('react');
const NowViewingItem = require('./NowViewingItem.jsx');
const ObserveModelMixin = require('./ObserveModelMixin');
const PureRenderMixin = require('react-addons-pure-render-mixin');

const NowViewingContainer = React.createClass({
  propTypes: {
    nowViewing: React.PropTypes.array
  },

  getInitialState() {
    return {
      placeholderIndex: 0,
      isDropped: false,
      draggedItemIndex: 0,
      items: this.props.nowViewing
    };
  },

  onDragStart(i) {
    this.setState({
      draggedItemIndex: i
    });
  },

  onDragEnd(e) {
   let item = this.state.items[this.state.draggedItemIndex];
   this.state.items.splice(this.state.draggedItemIndex, 1);
   this.state.items.splice(this.state.placeholder, 0, item);

  },

  onDragOverDropZone(e) {
    const placeholderIndex = parseInt(e.currentTarget.dataset.key);
    if(placeholderIndex !== this.state.placeholderIndex) { this.setState({ placeholderIndex: placeholderIndex });}
    e.preventDefault();
  },

  onDragOverItem(i) {
   console.log('over item');
    // let over = parseInt(e.currentTarget.dataset.key);
    // if(e.clientY - e.currentTarget.offsetTop > e.currentTarget.offsetHeight / 2) { over++; }
    // if(over !== this.state.placeholderIndex) { this.setState({ placeholderIndex: over }); }
  },

  onDrop(e) {
    this.setState({
      isDropped: true
    });
  },

  onDragLeave(){

  },

  renderNowViewingItem(item, i) {
   return <NowViewingItem nowViewingItem={item} index={i} key={'placeholder-' + i} onDragOver={this.onDragOverItem} onDragStart={this.onDragStart}/>;
  },

  renderPlaceholder(i) {
   return <li className='nowViewing__drop-zone' data-key={i} key={i} onDrop={this.onDrop} onDragOver={this.onDragOverDropZone} ></li>;
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
    return <ul className="now-viewing__content list-reset" onDragEnd={this.onDragEnd} onDragLeave={this.onDragLeave}>
           {this.renderListElements()}
           </ul>;
  }
});
module.exports = NowViewingContainer;
