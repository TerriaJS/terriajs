import React from 'react';
import {init} from 'pell';
import PropTypes from 'prop-types';
import '!!style-loader!css-loader?sourceMap!pell/dist/pell.css';

export default class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {html: null}
    this.onChange = this.onChange.bind(this);
  }
  static getDerivedStateFromProps(props, state) {
    if (props.html !== state.html) {
      return {
        html: props.html
      }
    }
    return state;
  }
    componentDidMount() {
      this.editor = init({
            element: this.node,
            onChange: this.onChange, 
            actions: this.props.actions,
      }); 
      this.editor.content.innerHTML = this.props.html;
  }

  onChange(html) {
    this.props.onChange(html);
    this.setState({
      html
    })
  }

  componentWillUnmount() {
    this.editor = undefined;
  }
  render() {
    return (<div ref={node => this.node = node}></div>);
  }
}

Editor.propTypes  = {
  html: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  actions: PropTypes.array
};

Editor.defaultProps = { actions: ['bold', 'underline', 'image', 'link']};
