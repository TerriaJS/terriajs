"use strict";

import classNames from "classnames";
import { observer } from "mobx-react";
import React, { ChangeEvent } from "react";
import { Trans, WithTranslation, withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import Icon from "../../../../Styled/Icon";
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
import { downloadImg } from "./Print/PrintView";
import Checkbox from "../../../../Styled/Checkbox";
import Terria from "../../../../Models/Terria";
import ViewState from "../../../../ReactViewModels/ViewState";
import { TFunction } from "i18next";
import { getName } from "../../../../ModelMixins/CatalogMemberMixin";
import Box from "../../../../Styled/Box";
import ShareUrlClipboard from "./ShareUrlClipboard";

const MenuPanel = require("../../../StandardUserInterface/customizable/MenuPanel")
  .default;
const StorySharePanel = require("./StorySharePanel").default;

interface PropTypes extends WithTranslation {
  terria: Terria;
  shortenUrls?: boolean;
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
  shareUrl: string;
  isDownloading: boolean;
  advancedIsOpen: boolean;
  placeholder: string | undefined;
  errorMessage: string | undefined;
  includeStoryInShare: boolean;
}

@observer
class SharePanel extends React.Component<PropTypes, SharePanelState> {
  static displayName = "SharePanel";
  private _unsubscribeFromPrintMediaChange?: () => void;
  private _oldPrint?: () => void;
  private _message: HTMLDivElement | undefined;

  constructor(props: PropTypes) {
    super(props);
    // React components using ES6 classes no longer autobind this to non React methods
    this.changeOpenState = this.changeOpenState.bind(this);
    this.onIncludeStoryInShareClicked = this.onIncludeStoryInShareClicked.bind(
      this
    );
    this.onAddWebDataClicked = this.onAddWebDataClicked.bind(this);
    this.onShortenClicked = this.onShortenClicked.bind(this);
    this.afterBrowserPrint = this.afterBrowserPrint.bind(this);
    this.beforeBrowserPrint = this.beforeBrowserPrint.bind(this);

    this.state = {
      isOpen: false,
      shareUrl: "",
      isDownloading: false,
      advancedIsOpen: false,
      placeholder: undefined,
      errorMessage: undefined,
      includeStoryInShare: true // moved from viewState to local state
    };
  }

  componentDidMount() {
    if (this.props.terria.configParameters.interceptBrowserPrint) {
      window.addEventListener("beforeprint", this.beforeBrowserPrint, false);
      window.addEventListener("afterprint", this.afterBrowserPrint, false);

      const handlePrintMediaChange = (evt: MediaQueryListEvent) => {
        if (evt.matches) {
          this.beforeBrowserPrint();
        } else {
          this.afterBrowserPrint();
        }
      };

      if (window.matchMedia) {
        const matcher = window.matchMedia("print");
        matcher.addEventListener("change", handlePrintMediaChange); // MediaQueryList.addListener() is deprecated replaced with addEventListener()
        this._unsubscribeFromPrintMediaChange = function() {
          matcher.removeEventListener("change", handlePrintMediaChange);
        };
      }

      this._oldPrint = window.print;
      window.print = () => {
        this.print();
      };
    }
  }
  print() {
    throw new Error("Method not implemented.");
  }

  componentWillUnmount() {
    window.removeEventListener("beforeprint", this.beforeBrowserPrint, false);
    window.removeEventListener("afterprint", this.afterBrowserPrint, false);
    if (this._unsubscribeFromPrintMediaChange) {
      this._unsubscribeFromPrintMediaChange();
    }

    if (this._oldPrint) {
      window.print = this._oldPrint;
    }
  }

  beforeBrowserPrint() {
    const { t } = this.props;
    this.afterBrowserPrint();
    this._message = document.createElement("div");
    this._message.innerText = t("share.browserPrint", {
      appName: this.props.terria.appName
    });
    window.document.body.insertBefore(
      this._message,
      window.document.body.childNodes[0]
    );
  }

  afterBrowserPrint() {
    if (this._message) {
      window.document.body.removeChild(this._message);
      this._message = undefined;
    }
    this.changeOpenState(true);
  }

  advancedIsOpen() {
    return this.state.advancedIsOpen;
  }

  toggleAdvancedOptions = (e: React.MouseEvent<HTMLButtonElement>) => {
    this.setState((prevState: SharePanelState) => ({
      advancedIsOpen: !prevState.advancedIsOpen
    }));
  };

  updateForShortening() {
    const { t } = this.props;
    this.setState({
      shareUrl: ""
    });

    if (this.shouldShorten()) {
      this.setState({
        placeholder: t("share.shortLinkShortening")
      });
      buildShortShareLink(this.props.terria, this.props.viewState, {
        includeStories: this.props.storyShare || this.state.includeStoryInShare
      })
        .then(shareUrl => this.setState({ shareUrl }))
        .catch(() => {
          this.setUnshortenedUrl();
          this.setState({
            errorMessage: t("share.shortLinkError")
          });
        });
    } else {
      this.setUnshortenedUrl();
    }
  }

  setUnshortenedUrl() {
    this.setState({
      shareUrl: buildShareLink(this.props.terria, this.props.viewState, {
        includeStories: this.props.storyShare || this.state.includeStoryInShare
      })
    });
  }

  isUrlShortenable() {
    return canShorten(this.props.terria);
  }

  shouldShorten() {
    const localStoragePref = this.props.terria.getLocalProperty(
      "shortenShareUrls"
    );

    return (
      this.isUrlShortenable() &&
      (localStoragePref || !defined(localStoragePref))
    );
  }

  onShortenClicked(e: ChangeEvent<HTMLInputElement>) {
    if (this.shouldShorten()) {
      this.props.terria.setLocalProperty("shortenShareUrls", false);
    } else if (this.isUrlShortenable()) {
      this.props.terria.setLocalProperty("shortenShareUrls", true);
    } else {
      return;
    }

    this.updateForShortening();
    this.forceUpdate();
  }

  changeOpenState(open: boolean) {
    this.setState({
      isOpen: open
    });

    if (open) {
      this.updateForShortening(); // TODO: how to pass this to ShareUrlClipboard?
      if (this.props.catalogShare || this.props.storyShare) {
        this.props.viewState.shareModalIsVisible = true;
      }
    }
  }

  onAddWebDataClicked() {
    this.setState({
      isOpen: false
    });
    this.props.viewState.openUserData();
  }

  hasUserAddedData() {
    return this.props.terria.catalog.userAddedDataGroup.members.length > 0;
  }

  onIncludeStoryInShareClicked(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ includeStoryInShare: event.target.checked }, () => {
      this.updateForShortening();
    });
  }

  renderWarning() {
    const unshareableItems = this.props.terria.catalog.userAddedDataGroup.memberModels.filter(
      model => !isShareable(this.props.terria)(model.uniqueId || "")
    );

    return (
      <>
        {unshareableItems.length > 0 && (
          <div className={Styles.warning}>
            <Trans i18nKey="share.localDataNote">
              <p className={Styles.paragraph}>
                <strong>Note:</strong>
              </p>
              <p className={Styles.paragraph}>
                The following data sources will NOT be shared because they
                include data from this local system. To share these data
                sources, publish their data on a web server and{" "}
                <a
                  className={Styles.warningLink}
                  onClick={this.onAddWebDataClicked}
                >
                  add them using a url
                </a>
                .
              </p>
            </Trans>
            <ul className={Styles.paragraph}>
              {unshareableItems.map((item, i) => {
                return (
                  <li key={i}>
                    <strong>{getName(item)}</strong>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </>
    );
  }

  renderContent() {
    if (this.props.catalogShare) {
      return this.renderContentForCatalogShare();
    } else if (this.props.storyShare) {
      return this.renderContentForStoryShare();
    } else {
      return this.renderContentWithPrintAndEmbed();
    }
  }

  renderContentForStoryShare() {
    const { t, terria, viewState } = this.props;

    return (
      <div className={Styles.clipboardForCatalogShare}>
        <ShareUrlClipboard
          t={t}
          terria={terria}
          viewState={viewState}
          shareUrl={this.state.shareUrl}
          shareMode="storyShare"
          placeholder={this.state.placeholder}
        />
        {this.renderWarning()}
      </div>
    );
  }

  renderContentForCatalogShare() {
    const { t, terria, viewState } = this.props;
    return (
      <div className={Styles.clipboardForCatalogShare}>
        <ShareUrlClipboard
          t={t}
          terria={terria}
          viewState={viewState}
          shareUrl={this.state.shareUrl}
          shareMode="catalogShare"
          placeholder={this.state.placeholder}
        />
        {this.renderWarning()}
      </div>
    );
  }

  renderContentWithPrintAndEmbed() {
    const { t, terria, viewState } = this.props;
    // TODO: how to create iframeCode if we move shareUrl to ShareUrlClipboard?
    const iframeCode = this.state.shareUrl.length
      ? `<iframe style="width: 720px; height: 600px; border: none;" src="${this.state.shareUrl}" allowFullScreen mozAllowFullScreen webkitAllowFullScreen></iframe>`
      : "";

    return (
      <div>
        <div>
          <ShareUrlClipboard
            t={t}
            terria={terria}
            viewState={viewState}
            shareUrl={this.state.shareUrl}
            shareMode="printAndEmbedShare"
            placeholder={this.state.placeholder}
          />
          {this.renderWarning()}
        </div>

        <hr className={Styles.thinLineDivider} />
        <div className={DropdownStyles.section}>
          <div>{t("share.printTitle")}</div>
          <div className={Styles.explanation}>
            {t("share.printExplanation")}
          </div>
          <div>
            <button
              className={Styles.printButton}
              disabled={this.state.isDownloading}
              onClick={() => {
                this.setState({
                  isDownloading: true
                });
                this.props.terria.currentViewer
                  .captureScreenshot()
                  .then(dataString => {
                    downloadImg(dataString);
                  })
                  .finally(() =>
                    this.setState({
                      isDownloading: false
                    })
                  );
              }}
            >
              {t("share.downloadMap")}
            </button>
            <button
              className={Styles.printButton}
              onClick={() => {
                const newWindow = window.open();
                this.props.viewState.setPrintWindow(newWindow);
              }}
            >
              {t("share.printViewButton")}
            </button>
          </div>
        </div>
        <hr className={Styles.thinLineDivider} />
        <div
          className={classNames(DropdownStyles.section, Styles.advancedOption)}
        >
          <div className={Styles.btnWrapper}>
            <button
              type="button"
              onClick={this.toggleAdvancedOptions}
              className={Styles.btnAdvanced}
            >
              <span>{t("share.btnAdvanced")}</span>
              {this.advancedIsOpen() ? (
                <Icon glyph={Icon.GLYPHS.opened} />
              ) : (
                <Icon glyph={Icon.GLYPHS.closed} />
              )}
            </button>
          </div>
          {this.advancedIsOpen() && (
            <>
              <Box className={DropdownStyles.section}>
                {this.isUrlShortenable() && (
                  <div className={Styles.advancedOption}>
                    <Checkbox
                      textProps={{ small: true }}
                      id="shortenUrl"
                      isChecked={(this.shouldShorten() as boolean) ?? false}
                      onChange={this.onShortenClicked}
                      className={Styles.checkbox}
                    >
                      <TextSpan>{t("share.shortenUsingService")}</TextSpan>
                    </Checkbox>
                  </div>
                )}
                <div className={Styles.advancedOption}>
                  <Checkbox
                    textProps={{ small: true }}
                    id="includeStory"
                    title="Include Story in Share"
                    isChecked={this.state.includeStoryInShare}
                    onChange={this.onIncludeStoryInShareClicked}
                    className={Styles.checkbox}
                  >
                    <TextSpan>{t("includeStory.message")}</TextSpan>
                  </Checkbox>
                </div>
              </Box>
              <hr className={Styles.thinLineDivider} />
              <div className={DropdownStyles.section}>
                <TextSpan className={Styles.paragraph}>
                  {t("share.embedTitle")}
                </TextSpan>
                <Input
                  large
                  dark
                  type="text"
                  readOnly
                  placeholder={this.state.placeholder}
                  value={iframeCode}
                  onClick={e => {
                    const target = e.target as HTMLInputElement;
                    return target.select();
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  openWithUserClick() {
    if (this.props.onUserClick) {
      this.props.onUserClick();
    }
    this.changeOpenState(true);
    this.renderContentForStoryShare();
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
