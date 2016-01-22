'use strict';
const React = require('react');
const DataCatalogItem = require('./DataCatalogItem.jsx');
const Loader = require('./Loader.jsx');
const when = require('terriajs-cesium/Source/ThirdParty/when');

const DataCatalogGroup = React.createClass({
    propTypes: {
        onClick: React.PropTypes.func,
        group: React.PropTypes.object,
        items: React.PropTypes.array
    },

    getInitialState() {
        // This is to make state update
        return {
            openId: ''
        };
    },

    handleClick(e) {
        let that = this;
        if (that.props.group.isOpen === false) {
            that.setState({
                openId: new Date()
            });

            when(that.props.group.load()).then(()=>{
                that.setState({
                    openId: new Date()
                });
            });
        } else {
            that.setState({
                openId: new Date()
            });
        }
        //Should not change prop here
        that.props.group.isOpen = !that.props.group.isOpen;
    },

    renderGroup(group) {
        if (group.isOpen === true) {
            if (group.items && group.items.length > 0) {
                return group.items.map((member, i)=>{
                    if (member.isGroup) {
                        return (<DataCatalogGroup group={member} key={i} />);
                    } else {
                        return (<DataCatalogItem item={member} key={i}/>);
                    }
                });
            } else {
                return <Loader/>;
            }
        }
    },

    render() {
        let group = this.props.group;
        return (
            <li>
              <button className ={'btn btn-catalogue ' + (group.isOpen ? 'is-open' : '')} onClick={this.handleClick} >{group.name} <i className={'icon ' + (group.isOpen ? 'icon-chevron-down' : 'icon-chevron-right')}></i></button>
              <ul className="data-catalog-group list-reset">
                {this.renderGroup(group)}
              </ul>
            </li>
            );
    }
});

module.exports = DataCatalogGroup;
