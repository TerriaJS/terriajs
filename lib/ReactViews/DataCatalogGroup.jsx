'use strict';

import DataCatalogItem from './DataCatalogItem.jsx';
import defined from 'terriajs-cesium/Source/Core/defined';
import Loader from './Loader.jsx';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';

const DataCatalogGroup = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        group: React.PropTypes.object,
        previewedCatalogItem: React.PropTypes.object,
        onPreviewedCatalogItemChanged: React.PropTypes.func,
        isOpen: React.PropTypes.bool,
        onToggleOpen: React.PropTypes.func,
        userData: React.PropTypes.bool
    },

    getDefaultProps: function() {
        return {
            userData: false
        };
    },

    toggleOpen(e) {
        if (defined(this.props.onToggleOpen)) {
            this.props.onToggleOpen();
        } else {
            this.props.group.toggleOpen();
        }
    },

    renderGroup(group, isOpen) {
        if (isOpen === true) {
            if (group.isLoading) {
                return <Loader/>;
            }

            if (group.items && group.items.length > 0) {
                return group.items.map((member, i)=>{
                    if (member.isGroup) {
                        return (<DataCatalogGroup group={member}
                                                  key={i}
                                                  previewedCatalogItem={this.props.previewedCatalogItem}
                                                  onPreviewedCatalogItemChanged={this.props.onPreviewedCatalogItemChanged}
                                                  userData={this.props.userData}
                                 />);
                    }
                    return (<DataCatalogItem item={member}
                                             key={i}
                                             previewedCatalogItem={this.props.previewedCatalogItem}
                                             onPreviewedCatalogItemChanged={this.props.onPreviewedCatalogItemChanged}
                                             userData={this.props.userData}
                            />);
                });
            }
            return <li className ='label no-results'> No data </li>;
        }
    },

    render() {
        const group = this.props.group;
        const isOpen = defined(this.props.isOpen) ? this.props.isOpen : group.isOpen;

        return (
            <li>
              <button className ={'btn btn-catalogue ' + (isOpen ? 'is-open' : '')} onClick={this.toggleOpen} >{group.name} <i className={'icon ' + (isOpen ? 'icon-caret-down' : 'icon-caret-right')}></i></button>
              <ul className="data-catalog-group list-reset">
                {this.renderGroup(group, isOpen)}
              </ul>
            </li>
            );
    }
});

module.exports = DataCatalogGroup;
