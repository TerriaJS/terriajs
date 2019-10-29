// import React from "react";
import EmptyWorkbenchMessage from "../ReactViews/SidePanel/EmptyWorkbenchMessage";

export const language = {
  AddDataBtnText: "Add Data",
  FeedbackBtnText: "Give Feedback",
  EmptyWorkbenchMessage: EmptyWorkbenchMessage

  /**
   * Alternatively, you can pass a message like:
   */
  // EmptyWorkbenchMessage: () => <div>Inline JSX</div>

  /** OR */

  // EmptyWorkbenchMessage: `
  //   <div>Your workbench is empty</div>
  //   <p>
  //     <strong>Click &apos;Add Data&apos; above to:</strong>
  //   </p>
  //   <ul>
  //     <li>Browse the Data Catalogue</li>
  //     <li>Load your own data onto the map</li>
  //   </ul>
  //   <p>
  //     <Icon glyph={Icon.GLYPHS.bulb} ></Icon>
  //     <strong>TIP:</strong><em>All your active data sets will be listed here</em>
  //   </p>
  //   `
};

export default language;
