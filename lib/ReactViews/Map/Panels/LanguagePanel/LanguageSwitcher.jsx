"use strict";

import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import ObserverModelMixin from "../../../ObserveModelMixin";
import MenuPanel from "../../../StandardUserInterface/customizable/MenuPanel.jsx";
import LanguageItem from "./LanguageItem.jsx";

import Styles from "./language-switcher.scss";
import DropdownStyles from "../panel.scss";
import classNames from "classnames";
import i18next from "i18next";
import defined from "terriajs-cesium/Source/Core/defined";

import { withTranslation } from "react-i18next";

const LanguageSwitcher = createReactClass({
  displayName: "LanguageSwitcher",
  mixins: [ObserverModelMixin],

  propTypes: {
    viewState: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  },
  currentLanguage: "",
  allLanguages: [],

  getInitialState() {
    return {
      isOpen: false
    };
  },

  onOpenChanged(open) {
    this.setState({
      isOpen: open
    });
  },

  changeLanguage(key) {
    this.onOpenChanged(false);
    i18next.changeLanguage(key);
    this.currentLanguage = key;
  },

  onInit(t) {
    if (defined(i18next.language)) {
      this.currentLanguage = i18next.language;
    }

    if (defined(i18next.options.resources)) {
      this.allLanguages = [];
      for (const key in i18next.options.resources) {
        this.allLanguages.push(
          new LanguageItem({
            key: key,
            name: t("languageName." + key)
          })
        );
      }
    }
  },

  render() {
    const { t } = this.props;
    this.onInit(t);
    const dropdownTheme = {
      btn: Styles.btnShare,
      outer: Styles.sharePanel,
      inner: Styles.dropdownInner
    };
    return (
      <MenuPanel
        theme={dropdownTheme}
        btnText={"language"}
        viewState={this.props.viewState}
        isOpen={this.state.isOpen}
        btnTitle={"tooltip"}
        onOpenChanged={this.onOpenChanged}
        // forceClosed={this.props.viewState.showSatelliteGuidance}
        smallScreen={this.props.viewState.useSmallScreenInterface}
      >
        <If condition={this.state.isOpen}>
          <div className={classNames(DropdownStyles.section, Styles.language)}>
            <ul className={Styles.languageSelector}>
              <For each="language" of={this.allLanguages}>
                <li key={language.key} className={Styles.listItem}>
                  <button
                    onClick={() => {
                      this.changeLanguage(language.key);
                    }}
                    className={classNames(Styles.btnLanguage, {
                      [Styles.isActive]: language.key === this.currentLanguage
                    })}
                  >
                    {language.name}
                  </button>
                </li>
              </For>
            </ul>
          </div>
        </If>
      </MenuPanel>
    );
  }
});

export default withTranslation()(LanguageSwitcher);
