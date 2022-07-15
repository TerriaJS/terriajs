import React from "react";
import DropdownStyles from "../panel.scss";
import Styles from "./share-panel.scss";
import Input from "../../../../Styled/Input";
import Clipboard from "../../../Clipboard";
import Text from "../../../../Styled/Text";
import classNames from "classnames";
import Loader from "../../../Loader";
import {
  Category,
  ShareAction
} from "../../../../Core/AnalyticEvents/analyticEvents";
import Terria from "../../../../Models/Terria";
import ViewState from "../../../../ReactViewModels/ViewState";

interface Props {
  t: any;
  terria: Terria;
  viewState: ViewState;
  shareUrl: string;
  shareMode: string;
  placeholder: string | undefined;
}

const ShareUrlClipboard = (props: Props) => {
  const { t, terria, viewState, shareUrl, shareMode, placeholder } = props;
  const bookMarkHelpItemName = "bookmarkHelp";

  // const [shareUrl, setShareUrl] = useState(""); // TODO: should we move shareUrl out of SharePanel to this component?

  const getAnalyticsAction = () => {
    if (shareMode === "printAndEmbedShare") {
      return ShareAction.shareCopy;
    } else if (shareMode === "catalogShare") {
      return ShareAction.catalogCopy;
    } else if (shareMode === "storyShare") {
      return ShareAction.storyCopy;
    } else {
      return ShareAction.shareCopy;
    }
  };

  const getShareUrlInput = () => {
    return (
      <Input
        className={Styles.shareUrlfield}
        light={shareMode === ("catalogShare" || "storyShare")}
        dark={shareMode === "printAndEmbedMode"}
        large
        type="text"
        value={shareUrl}
        placeholder={placeholder}
        readOnly
        onClick={e => e.currentTarget.select()}
        id="share-url"
        css={
          shareMode === "storyShare"
            ? `border-radius: 32px 0 0 32px;`
            : undefined
        }
      />
    );
  };

  return shareUrl === "" ? (
    <Loader message={t("share.generatingUrl")} />
  ) : (
    <div className={DropdownStyles.section}>
      <Clipboard
        source={getShareUrlInput()}
        id="share-url"
        theme={shareMode === "catalogShare" ? "dark" : "light"}
        rounded={shareMode === "storyShare"}
        onCopy={(text: any) => {
          terria.analytics?.logEvent(
            Category.share,
            getAnalyticsAction(),
            text
          );
        }}
      />
      {/* Following code block dependent on existence of "bookmarkHelp" Help Menu Item */}
      {props.terria.configParameters.helpContent?.some(
        (e: any) => e.itemName === bookMarkHelpItemName
      ) && (
        <Text
          medium
          textLight
          isLink
          onClick={evt =>
            viewState.openHelpPanelItemFromSharePanel(evt, bookMarkHelpItemName)
          }
        >
          <div
            className={classNames(
              Styles.explanation,
              Styles.getShareSaveHelpText
            )}
          >
            {t("share.getShareSaveHelpMessage")}
          </div>
        </Text>
      )}
    </div>
  );
};

export default ShareUrlClipboard;
