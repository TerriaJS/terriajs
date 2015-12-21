'use strict';
var React = require('react');

var FileInput = React.createClass({
  propTypes: {
        onChange: React.PropTypes.func,
        accept: React.PropTypes.string
    },
  getInitialState: function() {
    return {
      value: 'Browse for local data',
      hasFocus: false
    };
  },

  handleChange: function(e) {
    this.setState({
      value: e.target.value.split(/(\\|\/)/g).pop()
    });
    if (this.props.onChange) {
      this.props.onChange(e);
    }
  },
  render: function() {
    return (<form className='file-input'>
            <input type='file' onChange={this.handleChange} accept={this.props.accept} />
            <label className='btn btn-file-input'>{this.state.value}</label>
            </form>);
  }
});

module.exports = FileInput;
