import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { withTranslation } from "react-i18next";

import Styles from "./RCPanel.scss";
import Icon from "../../../Icon.jsx";

class RCInnerPanel extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { showDropdownAsModal, onDismissed, children, t } = this.props;
    return (
      <div
        className={classNames(
          Styles.inner,
          { [Styles.isOpen]: showDropdownAsModal },
          { [Styles.showDropdownAsModal]: showDropdownAsModal }
        )}
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          className={classNames(Styles.innerCloseBtn, {
            [Styles.innerCloseBtnForModal]: showDropdownAsModal
          })}
          onClick={onDismissed}
          title={t("general.close")}
          aria-label={t("general.close")}
        >
          <Icon glyph={Icon.GLYPHS.close} />
        </button>

        <span className={Styles.caret} />
        <div className={Styles.content}>{children}</div>
      </div>
    );
  }
}
RCInnerPanel.propTypes = {
  onDismissed: PropTypes.func.isRequired,
  showDropdownAsModal: PropTypes.bool.isRequired
};
export default withTranslation()(RCInnerPanel);
