'use strict';
const React = require('react');

// When uploading a file
// use an button element to have consistent stylying
const FileInput = React.createClass({
    propTypes: {
        onChange: React.PropTypes.func,
        accept: React.PropTypes.string
    },
    getInitialState() {
        return {
            value: 'Browse for local data'
        };
    },

    handleChange(e) {
        this.setState({
            value: e.target.value.split(/(\\|\/)/g).pop()
        });
        if (this.props.onChange) {
            this.props.onChange(e);
        }
    },
    render() {
        return (
            <form className='file-input'>
                <input type='file' onChange={this.handleChange} accept={this.props.accept} />
                <label className='btn btn--file-input'>{this.state.value ? this.state.value : 'Browse for local data'}</label>
            </form>);
    }
});

module.exports = FileInput;
