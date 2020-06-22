import React from "react";

import createReactClass from "create-react-class";

import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";

import Styles from "./mappable-preview.scss";
import { observer } from "mobx-react";

import ExportableData from "../../Models/ExportableData";
import FileSaver from "file-saver";

/**
 * CatalogItem ExportData.
 */
const ExportData = observer(
  createReactClass({
    displayName: "ExportData",

    propTypes: {
      item: PropTypes.object.isRequired
    },

    exportData(previewed) {
      previewed
        .exportData()
        .then(data => {
          if (typeof data === "string") {
            window.open(data);
          } else {
            FileSaver.saveAs(data.file, data.name);
          }
        })
        .catch(e => {
          if (e instanceof TerriaError) {
            this.props.previewed.terria.error.raiseEvent(e);
          }
        });
    },

    render() {
      const catalogItem = this.props.item;

      return (
        <If condition={catalogItem && ExportableData.is(catalogItem)}>
          <div className={Styles.metadata}>
            <button onClick={this.exportData.bind(this, catalogItem)}>
              Export data
            </button>
          </div>
        </If>
      );
    }
  })
);

export default withTranslation()(ExportData);
