// import React from "react";
import EmptyWorkbenchMessage from "../ReactViews/SidePanel/EmptyWorkbenchMessage";

const ADD_DATA = "Add Data";
const DISMISS_TEXT = "Don't show me this again";

export const language = {
  AddDataBtnText: ADD_DATA,
  FeedbackBtnText: "Give Feedback",
  EmptyWorkbenchMessage: EmptyWorkbenchMessage,

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

  // WelcomeMessage:
  //   "Access rich spatial data from multiple Australian government agencies, all from one convenient location.",
  WelcomeMessage:
    "Access rich spatial data from multiple data sources, all from one convenient location.",
  WelcomeMessagePrimaryBtn: ADD_DATA,
  WelcomeMessageSecondaryBtn: "Take a tour",
  WelcomeMessageDissmissText: DISMISS_TEXT
};

export default language;
