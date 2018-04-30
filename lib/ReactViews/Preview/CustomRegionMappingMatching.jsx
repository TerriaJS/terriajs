import React from "react";
import ObserveModelMixin from "../ObserveModelMixin";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";

import RegionProviderList from "../../Map/RegionProviderList";

const CustomRegionMappingMatching = createReactClass({
    displayName: "CustomRegionMappingMatching",
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: PropTypes.object.isRequired,
        viewState: PropTypes.object,
        previewed: PropTypes.object
    },

    componentDidMount() {
        const urls = Object.keys(RegionProviderList.metaList); // Probably only one URL
        if (urls.length === 1) {
            RegionProviderList.metaList[urls[0]]
                .then(rpList =>
                    rpList.regionProviders.filter(rp => rp.server.getTile)
                )
                .then(customRegionProviders => {
                    this.setState({
                        geoJsonProps: customRegionProviders.map(
                            rp => rp.aliases[0]
                        )
                    });
                });
        }
    },

    getInitialState() {
        return {
            csvColumn: "",
            geoJsonProp: "",
            geoJsonProps: []
        };
    },

    handleCsvColumnChange(evt) {
        this.setState({
            csvColumn: evt.target.value
        });
    },

    handleGeoJsonPropChange(evt) {
        this.setState({
            geoJsonProp: evt.target.value
        });
    },

    handleConfirm(evt) {
        // Add alias, reinitialise CsvCatalogItem
        const regionProviderAlias = this.state.geoJsonProp;
        const newAlias = this.state.csvColumn;

        const urls = Object.keys(RegionProviderList.metaList); // Probably only one URL
        if (urls.length === 1) {
            RegionProviderList.metaList[urls[0]]
                .then(
                    rpList =>
                        rpList.regionProviders.filter(
                            rp => rp.aliases[0] === regionProviderAlias
                        )[0]
                )
                .then(rp => {
                    rp.aliases.push(newAlias);
                    // Undo tagging the CsvCatalogItem a chart and reload it
                    this.props.previewed.isEnabled = false;
                    this.props.previewed.isMappable = true;
                    this.props.previewed._load().then(() => {
                        this.props.previewed.isEnabled = true;
                    });
                });
        }
    },

    render() {
        return (
            <div>
                <h3>
                    Match region column in this file against custom (GeoJSON)
                    region definitions
                </h3>
                Select csv column:
                <select
                    value={this.state.csvColumn}
                    onChange={this.handleCsvColumnChange}
                >
                    <option value="" />
                    {this.props.previewed._tableStructure.columns.map(
                        tableColumn => (
                            <option
                                key={tableColumn.name}
                                value={tableColumn.name}
                            >
                                {tableColumn.name}
                            </option>
                        )
                    )}
                </select>
                <br />
                Select geojson & property:
                <select
                    value={this.state.value}
                    onChange={this.handleGeoJsonPropChange}
                >
                    <option value="" />
                    {this.state.geoJsonProps.map(prop => (
                        <option key={prop} value={prop}>
                            {prop}
                        </option>
                    ))}
                </select>
                <br />
                <button onClick={this.handleConfirm}>Confirm join</button>
            </div>
        );
    }
});

module.exports = CustomRegionMappingMatching;
