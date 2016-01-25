'use strict';
const React = require('react');
const DataCatalogItem = require('./DataCatalogItem.jsx');
const Loader = require('./Loader.jsx');
const when = require('terriajs-cesium/Source/ThirdParty/when');

const DataCatalogGroup = React.createClass({
    propTypes: {
        onClick: React.PropTypes.func,
        group: React.PropTypes.object,
        items: React.PropTypes.array,
        previewed: React.PropTypes.object,
        setPreview: React.PropTypes.func
    },

    getInitialState() {
        // This is to make state update
        return {
            openId: ''
        };
    },

    handleClick(e) {
        const that = this;
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
        that.props.group.isOpen = !that.props.group.isOpen;
    },

    renderGroup(group) {
        if (group.isOpen === true) {
            if (group.items && group.items.length > 0) {
                return group.items.map((member, i)=>{
                    if (member.isGroup) {
                        return (<DataCatalogGroup group={member}
                                                  key={i}
                                                  previewed={this.props.previewed}
                                                  setPreview={this.props.setPreview}
                                 />);
                    }
                    return (<DataCatalogItem item={member}
                                             key={i}
                                             previewed={this.props.previewed}
                                             setPreview={this.props.setPreview}
                            />);
                });
            }
            return <Loader/>;
        }
    },

    render() {
        const group = this.props.group;
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
