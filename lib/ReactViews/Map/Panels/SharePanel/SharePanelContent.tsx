import { runInAction } from "mobx";
import { FC, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Terria from "../../../../Models/Terria";
import ViewState from "../../../../ReactViewModels/ViewState";
import Box from "../../../../Styled/Box";
import Checkbox from "../../../../Styled/Checkbox";
import Spacing from "../../../../Styled/Spacing";
import Text, { TextSpan } from "../../../../Styled/Text";
import { useCallbackRef } from "../../../useCallbackRef";
import { EmbedSection } from "./Embed/EmbedSection";
import { PrintSection } from "./Print/PrintSection";
import { IShareUrlRef, ShareUrl, ShareUrlBookmark } from "./ShareUrl";

interface ISharePanelContentProps {
  terria: Terria;
  viewState: ViewState;
  closePanel: () => void;
}

export const SharePanelContent: FC<ISharePanelContentProps> = ({
  terria,
  viewState,
  closePanel
}) => {
  const { t } = useTranslation();
  const canShortenUrl = useMemo(
    () => !!terria.shareLinkService?.canShorten,
    [terria]
  );

  const [includeStoryInShare, setIncludeStoryInShare] = useState(true);

  const [_, update] = useState<object>();
  const shareUrlRef = useCallbackRef<IShareUrlRef>(null, () => update({}));

  const includeStoryInShareOnChange = useCallback(() => {
    setIncludeStoryInShare((prevState) => !prevState);
  }, []);

  const shouldShortenOnChange = useCallback(() => {
    runInAction(() => {
      terria.configParameters.shortenShareUrls =
        !terria.configParameters.shortenShareUrls;
    });
  }, [terria]);

  // eslint-disable-next-line react-hooks/refs
  const shareUrl = shareUrlRef?.current;

  return (
    <Box paddedRatio={3} column>
      <Text semiBold medium>
        {t("clipboard.shareURL")}
      </Text>
      <Spacing bottom={1} />
      <ShareUrl
        terria={terria}
        viewState={viewState}
        includeStories={includeStoryInShare}
        ref={shareUrlRef}
        callback={closePanel}
      >
        <ShareUrlBookmark viewState={viewState} />
      </ShareUrl>
      <Spacing bottom={1} />
      {terria.stories && terria.stories.length > 0 && (
        <>
          <Checkbox
            textProps={{ medium: true }}
            id="includeStory"
            title="Include Story in Share"
            isChecked={includeStoryInShare}
            onChange={includeStoryInShareOnChange}
          >
            <TextSpan>{t("includeStory.message")}</TextSpan>
          </Checkbox>
          <Spacing bottom={2} />
        </>
      )}
      <Checkbox
        textProps={{ medium: true }}
        id="shortenUrl"
        isChecked={terria.configParameters.shortenShareUrls}
        onChange={shouldShortenOnChange}
        isDisabled={!canShortenUrl}
      >
        <TextSpan>{t("share.shortenUsingService")}</TextSpan>
      </Checkbox>
      <Spacing bottom={4} />
      <PrintSection viewState={viewState} />
      <Spacing bottom={4} />
      <EmbedSection shareUrl={shareUrl} />
    </Box>
  );
};
