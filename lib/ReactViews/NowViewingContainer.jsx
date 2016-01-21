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
      draggedItemIndex: 0
    };
  },

  onDragStart(e) {
    if (!e.currentTarget || !e.currentTarget.parentElement.parentElement) {
      return;
    }
    this.setState({
      isOpen: false,
      draggedItemIndex: parseInt(e.currentTarget.dataset.key)
    });

    e.dataTransfer.effectAllowed = ALLOWED_DROP_EFFECT;

    if (defined(e.dataTransfer)) {
        e.dataTransfer.setData('text', 'Dragging a Now Viewing item.');
    } else {
        e.originalEvent.dataTransfer.setData('text', 'Dragging a Now Viewing item.');
    }

    return true;
  },

  onDragEnd(e) {
    this.setState({
      // Temp
      isOpen: true,
      draggedItemIndex: parseInt(e.currentTarget.dataset.key)
    });
    // if(this.state.isDropped){
    //   if (this.state.placeholderIndex  >= this.state.draggedItemIndex) {
    //         --this.state.placeholderIndex;
    //     }
    //     while (this.state.draggedItemIndex > this.state.placeholderIndex) {
    //         --this.state.draggedItemIndex;
    //     }
    //     while (this.state.draggedItemIndex < this.state.placeholderIndex) {
    //         ++this.state.draggedItemIndex;
    //     }
    // }
    this.setState(this.state);
    console.log(this.state);
  },

  onDragOverDropZone(e) {
    let placeholderIndex = parseInt(e.currentTarget.dataset.key);
    if(placeholderIndex !== this.state.placeholderIndex) { this.setState({ placeholderIndex: placeholderIndex });}
  },

  onDragOverItem(e){
    let over = parseInt(e.currentTarget.dataset.key);
    if(e.clientY - e.currentTarget.offsetTop > e.currentTarget.offsetHeight / 2) { over++; }
    if(over !== this.state.placeholderIndex) { this.setState({ placeholderIndex: over }); }
  },

  onDrop(e){
    let placeholderIndex = parseInt(e.currentTarget.dataset.key);
    if(placeholderIndex !== this.state.placeholderIndex) { this.setState({ placeholderIndex: placeholderIndex });}

    this.setState({
      isDropped: true
    });
    console.log('drop');
  },

  renderNowViewingItem(item, i) {
   return <NowViewingItem nowViewingItem={item} index={i} key={'placeholder-' + i} />;
  },

  renderPlaceholder(i) {
   return <li className='nowViewing__drop-zone' data-key={i} key={i} onDragOver={this.onDragOverDropZone} ></li>;
  },

  renderListElements() {
   const items = [];
   const nowViewing = this.props.nowViewing;
   let i;

   for(i = 0; i < nowViewing.length; i++) {
    items.push(this.renderPlaceholder(i));
    items.push(this.renderNowViewingItem(nowViewing[i], i));
    }
    items.push(this.renderPlaceholder(i));
    return items;
  },

  render() {
    return <ul className="now-viewing__content list-reset" onDrop={this.onDrop}>
           {this.renderListElements()}
           </ul>;
  }
});
module.exports = NowViewingContainer;
