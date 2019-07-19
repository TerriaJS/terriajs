"use strict";

import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import ObserveModelMixin from "../ObserveModelMixin";
import DataCatalogItem from "./DataCatalogItem.jsx";
import DataCatalogGroup from "./DataCatalogGroup.jsx";

/**
 * Component that is either a {@link CatalogItem} or a {@link DataCatalogMember} and encapsulated this choosing logic.
 */
export default createReactClass({
  mixins: [ObserveModelMixin],

  displayName: "DataCatalogMember",

  propTypes: {
    member: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    manageIsOpenLocally: PropTypes.bool,
    removable: PropTypes.bool,
    terria: PropTypes.object
  },

  render() {
    if (this.props.member.isGroup) {
      return (
        <DataCatalogGroup
          group={this.props.member}
          viewState={this.props.viewState}
          manageIsOpenLocally={this.props.manageIsOpenLocally}
          removable={this.props.removable}
          terria={this.props.terria}
        />
      );
    } else {
      return (
        <DataCatalogItem
          item={this.props.member}
          viewState={this.props.viewState}
          removable={this.props.removable}
          terria={this.props.terria}
        />
      );
    }
  }
});
