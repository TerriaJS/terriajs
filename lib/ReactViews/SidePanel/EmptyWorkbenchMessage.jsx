import React from "react";
import Icon from "../Icon";

import { ADD_DATA } from "../../Language/defaults";

export const EmptyWorkbenchMessage = () => (
  <>
    <div>Your workbench is empty</div>
    <p>
      <strong>Click &apos;{ADD_DATA}&apos; above to:</strong>
    </p>
    <ul>
      <li>Browse the Data Catalogue</li>
      <li>Load your own data onto the map</li>
    </ul>
    <p>
      <Icon glyph={Icon.GLYPHS.bulb} />
      <strong>TIP:</strong>
      <em>All your active data sets will be listed here</em>
    </p>
  </>
);
export default EmptyWorkbenchMessage;
