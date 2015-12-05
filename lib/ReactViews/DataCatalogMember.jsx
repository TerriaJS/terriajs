'use strict';
var React = require('react');
var DataCatalogItem = require('./DataCatalogItem.jsx');
var Loader = require('./Loader.jsx');
var DataCatalogMember = React.createClass({
    propTypes:{
        onClick:  React.PropTypes.func,
        member: React.PropTypes.object,
        items: React.PropTypes.array
    },

    getInitialState: function() {
        return {
            isOpen: false
        };
    },

    handleClick: function() {
        this.props.onClick(this);
    },

    render: function() {
        var member = this.props.member;
        var items = this.props.items;

        var content = '';

        if (this.state.isOpen === true) {
            if (items && items.length > 0) {
                content = items.map(function(item, i) {
                    return (<DataCatalogItem item={item} key={i}/>);
                });
            } else {
                content = <Loader/>;
            }
        }
        var iconClass = 'icon icon-chevron-' + (this.state.isOpen ? 'down' : 'right');
        return (
            <li>
            <button onClick={this.handleClick} className="btn btn-catalog-group">{member.name}<i className={iconClass}></i></button>
            <ul className='list-reset'>{content}</ul>
            </li>
        );
    }
});

module.exports = DataCatalogMember;
