'use strict';
const React = require('react');

// Use this as drop down rather than the html <select> tag so we have more consistent styling
const Dropdown = React.createClass({
    propTypes: {
        options: React.PropTypes.array,
        selected: React.PropTypes.object,
        selectOption: React.PropTypes.func
    },

    getDefaultProps() {
        return {
            options: [],
            selected: undefined
        };
    },

    getInitialState() {
        return {
            isOpen: false
        };
    },

    componentWillMount() {
        window.addEventListener('click', this.closeDropDownWhenClickOtherPlaces);
    },

    componentWillUnmount() {
        this.setState({
            isOpen: false
        });
        window.removeEventListener('click', this.closeDropDownWhenClickOtherPlaces);
    },

    closeDropDownWhenClickOtherPlaces() {
        this.setState({
            isOpen: false
        });
    },

    toggleList(event) {
        event.stopPropagation();
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    select(option, event) {
        event.stopPropagation();
        this.props.selectOption(option);
        // close drop down on select
        this.setState({
            isOpen: false
        });
    },

    renderOptions() {
        const that = this;
        return that.props.options.map((option, i)=>{
            return (<li key ={i}><button onClick={that.select.bind(null, option)} className={'btn btn--dropdown-option ' + (option === that.props.selected ? 'is-selected' : '')}>{option.name}</button></li>);
        });
    },

    render() {
        return (<div className={'dropdown ' + (this.state.isOpen ? 'is-open' : '')}>
                  <button onClick={this.toggleList} className='btn btn--dropdown' >{this.props.selected.name}</button>
                  <ul className='dropdown__list'>{this.renderOptions()}</ul>
                </div>);
    }
});
module.exports = Dropdown;
