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
        RegionProviderList.fromUrl(
            this.props.terria.configParameters.regionMappingDefinitionsUrl,
            this.props.terria.corsProxy
        ).then(rpList =>
            rpList.regionProviders.filter(rp => rp.server.getTile)
        )
        .then(customRegionProviders => {
            this.setState({
                geoJsonRegionProviders: customRegionProviders
            });
        });
    },

    getInitialState() {
        return {
            csvColumn: "",
            geoJsonRegionProvider: undefined,
            geoJsonRegionProviders: []
        };
    },

    handleCsvColumnChange(evt) {
        this.setState({
            csvColumn: evt.target.value
        });
    },

    handleGeoJsonRegionProviderChange(evt) {
        this.setState({
            geoJsonRegionProvider: this.state.geoJsonRegionProviders.find(rp => rp.regionType === evt.target.value)
        });
    },

    handleConfirm(evt) {
        this.props.previewed.tableStyle.updateFromJson({
            regionVariable: this.state.csvColumn,
            regionType: this.state.geoJsonRegionProvider.regionType
        });
        // Undo tagging the CsvCatalogItem a chart and reload it
        this.props.previewed.isEnabled = false;
        this.props.previewed.isMappable = true;
        this.props.previewed._load().then(() => {
            this.props.previewed.isEnabled = true;
        });
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
                    onChange={this.handleGeoJsonRegionProviderChange}
                >
                    <option value="" />
                    {this.state.geoJsonRegionProviders.map(rp => (
                        <option key={rp.regionType} value={rp.regionType}>
                            {rp.regionType}
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
