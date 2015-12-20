'use strict';
var React = require('react');
var Dropdown = React.createClass({
    propTypes: {
        options: React.PropTypes.array,
        selected: React.PropTypes.object
    },

    getDefaultProps: function() {
      return {
        options: [],
        selected: undefined
      };
    },

    getInitialState: function(){
      return {
        isOpen: false
      };
    },

    componentDidMount: function(){

    },

    componentWillUnmount: function(){

    },

    toggleList: function(){
      this.setState({
        isOpen: !this.state.isOpen
      });
    },

    render: function() {
      var that = this;

        return (<div className={'dropdown mb2 ' + (this.state.isOpen ? 'is-open' : '')}>
                  <button onClick={this.toggleList} className='btn btn-dropdown' >{this.props.selected.name}<i className='icon icon-chevron-down right'></i></button>
                    <ul className='list-reset dropdown__list'><li><button onClick={this.toggleList} className='btn btn-small right'><i className='icon icon-close'></i></button></li>{this.props.options.map(function(option, i){ return (<li key ={i}><button className={'btn btn-dropdown-option ' + (option === that.props.selected ? 'is-selected' : '')}>{option.name}</button></li>); })}
                    </ul>
                </div>);
    }
});
module.exports = Dropdown;
