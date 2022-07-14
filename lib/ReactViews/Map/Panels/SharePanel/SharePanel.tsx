"use strict";

import classNames from "classnames";
import { observer } from "mobx-react";
import React, { ChangeEvent } from "react";
import { Trans, WithTranslation, withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import Clipboard from "../../../Clipboard";
import Icon from "../../../../Styled/Icon";
import Loader from "../../../Loader";
import Input from "../../../../Styled/Input";
import { TextSpan } from "../../../../Styled/Text";
import DropdownStyles from "../panel.scss";
import {
  buildShareLink,
  buildShortShareLink,
  canShorten,
  isShareable
} from "./BuildShareLink";
import Styles from "./share-panel.scss";
import {
  Category,
  ShareAction
} from "../../../../Core/AnalyticEvents/analyticEvents";
import { downloadImg } from "./Print/PrintView";
import Checkbox from "../../../../Styled/Checkbox";
import Text from "../../../../Styled/Text";
import Terria from "../../../../Models/Terria";
import ViewState from "../../../../ReactViewModels/ViewState";
import { TFunction } from "i18next";
import { getName } from "../../../../ModelMixins/CatalogMemberMixin";
import Box from "../../../../Styled/Box";
import { EmbedSection } from "./AdvancedOptions/Embed";
import { ShareUrl } from "./ShareUrl/ShareUrl";
import { SharePanelContent } from "./SharePanelContent";

const MenuPanel = require("../../../StandardUserInterface/customizable/MenuPanel")
  .default;
const StorySharePanel = require("./StorySharePanel").default;

interface PropTypes extends WithTranslation {
  terria: Terria;
  storyShare: boolean;
  catalogShare?: boolean;
  catalogShareWithoutText?: boolean;
  modalWidth: number;
  viewState: ViewState;
  onUserClick: () => void;
  btnDisabled: boolean;
  t: TFunction;
}

interface SharePanelState {
  isOpen: boolean;
}

@observer
class SharePanel extends React.Component<PropTypes, SharePanelState> {
  static displayName = "SharePanel";

  constructor(props: PropTypes) {
    super(props);
    this.changeOpenState = this.changeOpenState.bind(this);
    this.closePanel = this.closePanel.bind(this);

    this.state = {
      isOpen: false
    };
  }

  changeOpenState(open: boolean) {
    this.setState({
      isOpen: open
    });

    if (open) {
      if (this.props.catalogShare || this.props.storyShare) {
        this.props.viewState.shareModalIsVisible = true;
      }
    }
  }

  closePanel() {
    this.setState({
      isOpen: false
    });
  }

  renderContentWithPrintAndEmbed() {
    const { terria, viewState } = this.props;

    return (
      <SharePanelContent
        terria={terria}
        viewState={viewState}
        closePanel={this.closePanel}
      />
    );
  }

  renderContent() {
    // if (this.props.catalogShare) {
    //   return this.renderContentForCatalogShare();
    // } else if (this.props.storyShare) {
    //   return this.renderContentForStoryShare();
    // } else {
    return this.renderContentWithPrintAndEmbed();
    // }
  }

  render() {
    const { t } = this.props;
    const {
      catalogShare,
      storyShare,
      catalogShareWithoutText,
      modalWidth
    } = this.props;
    const dropdownTheme = {
      btn: classNames({
        [Styles.btnCatalogShare]: catalogShare,
        [Styles.btnWithoutText]: catalogShareWithoutText
      }),
      outer: classNames(Styles.sharePanel, {
        [Styles.catalogShare]: catalogShare,
        [Styles.storyShare]: storyShare
      }),
      inner: classNames(Styles.dropdownInner, {
        [Styles.catalogShareInner]: catalogShare,
        [Styles.storyShareInner]: storyShare
      }),
      icon: "share"
    };

    const btnText = catalogShare
      ? t("share.btnCatalogShareText")
      : storyShare
      ? t("share.btnStoryShareText")
      : t("share.btnMapShareText");
    const btnTitle = catalogShare
      ? t("share.btnCatalogShareTitle")
      : storyShare
      ? t("share.btnStoryShareTitle")
      : t("share.btnMapShareTitle");

    return !storyShare ? (
      <MenuPanel
        theme={dropdownTheme}
        btnText={catalogShareWithoutText ? null : btnText}
        viewState={this.props.viewState}
        btnTitle={btnTitle}
        isOpen={this.state.isOpen}
        onOpenChanged={this.changeOpenState}
        showDropdownAsModal={catalogShare}
        modalWidth={modalWidth}
        smallScreen={this.props.viewState.useSmallScreenInterface}
        onDismissed={() => {
          if (catalogShare) this.props.viewState.shareModalIsVisible = false;
        }}
        onUserClick={this.props.onUserClick}
        disableCloseOnFocusLoss={this.props.viewState.retainSharePanel}
      >
        {this.state.isOpen && this.renderContent()}
      </MenuPanel>
    ) : (
      <StorySharePanel
        btnText={catalogShareWithoutText ? null : btnText}
        viewState={this.props.viewState}
        btnTitle={btnTitle}
        isOpen={this.state.isOpen}
        onOpenChanged={this.changeOpenState}
        showDropdownAsModal={storyShare}
        modalWidth={modalWidth}
        smallScreen={this.props.viewState.useSmallScreenInterface}
        btnDisabled={this.props.btnDisabled}
        onDismissed={() => {
          if (storyShare) this.props.viewState.shareModalIsVisible = false;
        }}
        onUserClick={this.props.onUserClick}
      >
        {this.state.isOpen && this.renderContent()}
      </StorySharePanel>
    );
  }
}

export default withTranslation()(SharePanel);
