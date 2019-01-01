import React from 'react';
import PropTypes from 'prop-types';
import interact from 'interactjs';

class DragWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        isDragging: 0
    };
}

  componentDidMount() {
      const dragMoveListener = (event)=>{
          this.setState({
              isDragging: 1
          });
         const target = event.target;
             // keep the dragged position in the data-x/data-y attributes
         const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
         const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

         // translate the element
         target.style.webkitTransform =
         target.style.transform =
           'translate(' + x + 'px, ' + y + 'px)';

         // update the posiion attributes
         target.setAttribute('data-x', x);
         target.setAttribute('data-y', y);
     };

      const onend = ()=> {
          setTimeout(()=> {
              this.setState({
                  isDragging: 0
              });
          }, 2000);
      };

      const node = this.node;
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
      });
  }

  render() {
      return <div style={this.props.styles} data-is-dragging={this.state.isDragging} ref={node => this.node = node} >{this.props.children}</div>;
  }
}

DragWrapper.propTypes = {
	children: PropTypes.node.isRequired,
    styles: PropTypes.object
};

module.exports = DragWrapper;
