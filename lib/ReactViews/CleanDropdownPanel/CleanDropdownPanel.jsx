"use strict";

// proptypes are in mixin
/* eslint react/prop-types:0*/

import React from "react";
import createReactClass from "create-react-class";
import classNames from "classnames";
// import Icon from "../../Icon";
import InnerPanel from "../Map/Panels/InnerPanel";
import BaseOuterPanel from "../Map/Panels/BaseOuterPanel";

// import Styles from "./panel.scss";
import Styles from "../Map/Panels/panel.scss";

// import defined from "terriajs-cesium/Source/Core/defined";

const CleanDropdownPanel = createReactClass({
  displayName: "CleanDropdownPanel",
  mixins: [BaseOuterPanel],

  getInitialState() {
    return {
      localIsOpen: false,
      caretOffset: undefined,
      dropdownOffset: undefined
    };
  },

  onInnerMounted(innerElement) {
    const centerInnerDropdown = this.props.showDropdownInCenter;
    if (centerInnerDropdown) {
      this.setState({
        caretOffset: "50%",
        dropdownOffset: "50%"
      });
    } else if (innerElement && this.buttonElement) {
      // how much further right the panel is from the button
      const offset = this.buttonElement.offsetLeft - innerElement.offsetLeft;
      // if the panel is left of the button leave its offset as is, otherwise move it right so it's level with the button.
      const dropdownOffset =
        offset < innerElement.offsetLeft ? offset : innerElement.offsetLeft;
      // offset the caret to line up with the middle of the button - note that the caret offset is relative to the panel, whereas
      // the offsets for the button/panel are relative to their container.
      const caretOffset = Math.max(
        this.buttonElement.clientWidth / 2 -
          10 -
          (dropdownOffset - this.buttonElement.offsetLeft),
        0
      );

      this.setState({
        caretOffset: caretOffset >= 0 && caretOffset + "px",
        dropdownOffset: dropdownOffset + "px"
      });
    } else {
      this.setState({
        caretOffset: undefined,
        dropdownOffset: undefined
      });
    }
  },

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.forceClosed) {
      this.onDismissed();
    }
  },

  render() {
    return (
      <div
        className={classNames(Styles.panel, this.props.theme.outer)}
        css={`
          .InnerPannelCloseButton {
            svg:not(:hover):not(:focus) {
              fill: ${p => p.theme.textLight};
            }
            svg {
              height: 12px;
              width: 12px;
            }
          }
          max-width: calc(100vw - 10px);
        `}
        ref={element => (this.buttonElement = element)}
      >
        <If condition={this.isOpen()}>
          <InnerPanel
            showDropdownInCenter={this.props.showDropdownInCenter}
            showDropdownAsModal={this.props.showDropdownAsModal}
            modalWidth={this.props.modalWidth}
            onDismissed={this.onDismissed}
            innerRef={this.onInnerMounted}
            doNotCloseFlag={this.getDoNotCloseFlag()}
            theme={this.props.theme}
            caretOffset={this.state.caretOffset}
            dropdownOffset={this.state.dropdownOffset}
          >
            {this.props.children}
          </InnerPanel>
        </If>
      </div>
    );
  }
});

export default CleanDropdownPanel;
