'use strict';
var React = require('react');

//Use this as drop down rather than the html <select> tag so we have more consistent styling
var Dropdown = React.createClass({
    propTypes: {
        options: React.PropTypes.array,
        selected: React.PropTypes.object,
        selectOption: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {
            options: [],
            selected: undefined
        };
    },

    getInitialState: function() {
        return {
            isOpen: false
        };
    },

    componentWillUnmount: function() {
        this.setState({
            isOpen: false
        });
    },

    toggleList: function() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    select: function(option, event) {
        this.props.selectOption(option);
        //close drop down on select
        this.setState({
            isOpen: false
        });
    },

    render: function() {
        var that = this;

        return (<div className={'dropdown mb2 ' + (this.state.isOpen ? 'is-open' : '')}>
                  <button onClick={this.toggleList} className='btn btn-dropdown' >{this.props.selected.name}<i className='icon icon-chevron-down right'></i></button>
                    <ul className='list-reset dropdown__list'><li><button onClick={this.toggleList} className='btn btn-small right'><i className='icon icon-close'></i></button></li>{this.props.options.map(function(option, i) {
                return (<li key ={i}><button onClick={that.select.bind(null, option)} className={'btn btn-dropdown-option ' + (option === that.props.selected ? 'is-selected' : '')}>{option.name}</button></li>);
            })}
                    </ul>
                </div>);
    }
});
module.exports = Dropdown;
