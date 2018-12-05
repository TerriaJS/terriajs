import React from 'react';
import ReactDOM from 'react-dom';
import interact from 'interactjs';

class DragWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        isDragging: 0
    }
}

  componentDidMount() {
      const dragMoveListener = (event)=>{
          this.setState({
              isDragging: 1
          })
         const target = event.target,
             // keep the dragged position in the data-x/data-y attributes
             x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
             y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

         // translate the element
         target.style.webkitTransform =
         target.style.transform =
           'translate(' + x + 'px, ' + y + 'px)';

         // update the posiion attributes
         target.setAttribute('data-x', x);
         target.setAttribute('data-y', y);
      }

      const onend = ()=>{
          setTimeout(()=>{
              this.setState({
                  isDragging: 0
              })
          }, 2000)
      }

      const bounds = {
          top: 0,
          right: 100,
          left: -100,
          bottom: 0
      }
      const node = ReactDOM.findDOMNode(this);
      interact(node)
        .draggable({
          inertia: true,
          onmove: dragMoveListener,
          // keep the element within the area of it's parent
          restrict: {
              restriction: 'parent',
              endOnly: true,
              elementRect: { left: 0, right: 1, top: 0, bottom: 1 }
          },
          onend: onend
        })
  }


  render() {
      return <div data-is-dragging={this.state.isDragging}>{this.props.children}</div>
  }
}

module.exports = DragWrapper;
