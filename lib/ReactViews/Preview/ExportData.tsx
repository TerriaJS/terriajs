import React from "react";

import { withTranslation, WithTranslation } from "react-i18next";

import Styles from "./mappable-preview.scss";
import { observer } from "mobx-react";

import ExportableData from "../../Models/ExportableData";
import TerriaError from "../../Core/TerriaError";
import isDefined from "../../Core/isDefined";
const FileSaver = require("file-saver");

interface PropsType extends WithTranslation {
  item: ExportableData;
}

export async function exportData(item: ExportableData) {
  const data = await item.exportData();
  if (!isDefined(data)) {
    return;
  }
  if (typeof data === "string") {
    window.open(data);
  } else if ("file" in data && "name" in data) {
    FileSaver.saveAs(data.file, data.name);
  }
}

/**
 * CatalogItem ExportData.
 */
@observer
class ExportData extends React.Component<PropsType> {
  exportData(item: ExportableData) {
    exportData(item).catch(e => {
      if (e instanceof TerriaError) {
        this.props.item.terria.error.raiseEvent(e);
      }
    });
  }

  render() {
    const catalogItem = this.props.item;

    if (!catalogItem || !ExportableData.is(catalogItem)) return;

    return (
      <div className={Styles.metadata}>
        <button onClick={this.exportData.bind(this, catalogItem)}>
          Export data
        </button>
      </div>
    );
  }
}
export default withTranslation()(ExportData);
