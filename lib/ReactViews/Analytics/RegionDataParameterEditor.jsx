'use strict';

/*global require*/
import defined from 'terriajs-cesium/Source/Core/defined';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import VarType from '../../Map/VarType';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';

const RegionDataParameterEditor = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        previewed: React.PropTypes.object,
        parameter: React.PropTypes.object,
        parameterValues: React.PropTypes.object
    },

    componentWillMount() {
        this.catalogItemDetails = {};
        knockout.defineProperty(this, 'value', {
            get: function() {
                return this.props.parameterValues[this.props.parameter.id];
            },
            set: function(value) {
                this.props.parameterValues[this.props.parameter.id] = value;
            }
        });
    },

    regionProvider() {
        return this.props.parameter.getRegionProvider(this.props.parameterValues);
    },

    catalogItemsWithMatchingRegion() {
        return this.props.parameter.getEnabledItemsWithMatchingRegionType(this.props.parameterValues);
    },

    toggleActive(catalogItem, column) {
        const newValue = !this.isActive(catalogItem, column);

        if (newValue) {
            this.value[column.name] = {
                regionProvider: this.regionProvider,
                regionColumn: catalogItem.regionMapping.regionDetails[0].column,
                valueColumn: column
            };

            // If only one dataset can be active at a time, deactivate all others.
            if (this.props.parameter.singleSelect) {
                for (const columnName in this.value) {
                    if (this.value.hasOwnProperty(columnName) && columnName !== column.name) {
                        this.value[columnName] = false;
                    }
                }
            }
        } else {
            this.value[column.name] = false;
            this.getCatalogItemDetails(this.catalogItemDetails, catalogItem).isEntirelyActive = false;
        }
    },

    isActive(catalogItem, column) {
        if (!defined(this.value)) {
            this.value = {};
        }

        if (!defined(this.value[column.name])) {
            this.value[column.name] = false;
            knockout.track(this.value, [column.name]);

            if (!this.props.parameter.singleSelect || Object.keys(this.value).length === 1) {
                this.value[column.name] = {
                    regionProvider: this.props.parameter.getRegionProvider(this.props.parameterValues),
                    regionColumn: catalogItem.regionMapping.regionDetails[0].column,
                    valueColumn: column
                };
            }
        }

        return defined(this.value[column.name]) &&
               this.value[column.name] &&
               this.value[column.name].regionColumn === catalogItem.regionMapping.regionDetails[0].column &&
               this.value[column.name].valueColumn === column;
    },

    getCatalogItemDetails(catalogItemDetails, catalogItem) {
        if (!defined(catalogItemDetails[catalogItem.uniqueId])) {
            catalogItemDetails[catalogItem.uniqueId] = {
                isOpen: true,
                isEntirelyActive: true
            };
            knockout.track(catalogItemDetails, [catalogItem.uniqueId]);
            knockout.track(catalogItemDetails[catalogItem.uniqueId], ['isOpen', 'isEntirelyActive']);
        }

        return catalogItemDetails[catalogItem.uniqueId];
    },

    toggleEntireCatalogItem(catalogItem) {
        const details = this.getCatalogItemDetails(this.catalogItemDetails, catalogItem);
        details.isEntirelyActive = !details.isEntirelyActive;

        const columns = catalogItem.regionMapping.tableStructure.columns;
        for (let i = 0; i < columns.length; ++i) {
            const column = columns[i];
            if (this.columnIsScalar(catalogItem, column)) {
                const isActive = this.isActive(catalogItem, column);
                if ((!isActive && details.isEntirelyActive) || (isActive && !details.isEntirelyActive)) {
                    this.toggleActive(catalogItem, column);
                }
            }
        }
    },

    catalogItemIsOpen(catalogItem) {
        const details = this.getCatalogItemDetails(this.catalogItemDetails, catalogItem);
        return details.isOpen;
    },

    toggleOpenCatalogItem(catalogItem) {
        const details = this.getCatalogItemDetails(this.catalogItemDetails, catalogItem);
        details.isOpen = !details.isOpen;
    },

    isEntireCatalogItemActive(catalogItem) {
        const details = this.getCatalogItemDetails(this.catalogItemDetails, catalogItem);
        return details.isEntirelyActive;
    },

    renderContnt() {
        if(this.catalogItemsWithMatchingRegion().length > 0) {
            return <ul className='parameter-editor-tree'>{this.catalogItemsWithMatchingRegion().map((catalogItem, i)=>
                <li key ={i}><button onClick={this.toggleOpenCatalogItem.bind(this, catalogItem)}
                                     className={`btn btn--catalogue ${this.catalogItemIsOpen(catalogItem) ? 'is-open' : ''}`}>{catalogItem.name}</button>{this.catalogItemIsOpen(catalogItem) && this.renderItemChildren(catalogItem)}</li>
            )}</ul>;
        }
        return <div className="parameter-editor-important-note">
                    No characteristics are available because you have not added any data to the map for this region type, {this.regionProvider() ? this.regionProvider().regionType : 'None'}.
                    You may use your own data with this analysis by creating a CSV following the <a target="_blank" href="https://github.com/NICTA/nationalmap/wiki/csv-geo-au">csv-geo-au</a> guidelines and dragging and dropping it onto the map.
                </div>;
    },

    renderItemChildren(catalogItem) {
        return <ul className='parameter-editor-tree'>{catalogItem.regionMapping.tableStructure.columns.map((column, i)=>{
            if (column.type === VarType.SCALAR) {
                return <li key ={i}
                           className='clearfix data-catalog-item'>
                            <button onClick={this.toggleActive.bind(this, catalogItem)}
                                    className={`btn btn--catalog-item ${this.isActive(catalogItem, column) ? 'is-active' : ''}`}
                            >{column.name}</button>
                            <button onClick={this.toggleActive.bind(this, catalogItem)} title="add to map"
                                    className={`btn btn--catalog-item--action ${this.isActive(catalogItem, column) ? 'btn--remove-from-map' : 'btn--add-to-map'}`}></button>
                        </li>;
            }
        })}</ul>;
    },

    render() {
        return <div className='parameter-editor'>
                    {this.renderContnt()}
               </div>;
    }
});
module.exports = RegionDataParameterEditor;
