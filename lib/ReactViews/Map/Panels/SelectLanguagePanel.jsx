import React from "react";
import createReactClass from "create-react-class";
import i18next from "i18next";
import classNames from "classnames";
import ObserveModelMixin from "../../ObserveModelMixin";
import { LANGUAGES } from "../../../Language/Languages";
import Styles from "./panel.scss";

const SelectLanguagePanel = createReactClass({
  displayName: "SelectLanguagePanel",
  mixins: [ObserveModelMixin],

  handleLngChange(e) {
    this.selectedLng = e.target.value;
    localStorage.setItem("i18nextLng", this.selectedLng);
    window.location.reload();
  },

  render() {
    document.body.dir = i18next.dir();
    return (
      <select
        className={classNames(Styles.button, Styles.selectLanguage)}
        defaultValue={this.selectedLng}
        ref={this.selectedLng}
        onChange={this.handleLngChange}
      >
        {LANGUAGES.map(lng => (
          <option key={lng.id} value={lng.code}>
            {lng.title}
          </option>
        ))}
      </select>
    );
  }
});

export default SelectLanguagePanel;
