import { FC, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Terria from "../../../../Models/Terria";
import ViewState from "../../../../ReactViewModels/ViewState";
import Box from "../../../../Styled/Box";
import Spacing from "../../../../Styled/Spacing";
import Text, { TextSpan } from "../../../../Styled/Text";
import { useCallbackRef } from "../../../useCallbackRef";
import { canShorten } from "./BuildShareLink";
import { PrintSection } from "./Print/PrintSection";
import { shouldShorten as shouldShortenDefault } from "./SharePanel";
import { IShareUrlRef, ShareUrl, ShareUrlBookmark } from "./ShareUrl";
import Checkbox from "../../../../Styled/Checkbox";
import { EmbedSection } from "./Embed/EmbedSection";

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
  const canShortenUrl = useMemo(() => !!canShorten(terria), [terria]);

  const [includeStoryInShare, setIncludeStoryInShare] = useState(true);
  const [shouldShorten, setShouldShorten] = useState(
    shouldShortenDefault(terria)
  );

  const [_, update] = useState<object>();
  const shareUrlRef = useCallbackRef<IShareUrlRef>(null, () => update({}));

  const includeStoryInShareOnChange = useCallback(() => {
    setIncludeStoryInShare((prevState) => !prevState);
  }, []);

  const shouldShortenOnChange = useCallback(() => {
    setShouldShorten((prevState) => {
      terria.setLocalProperty("shortenShareUrls", !prevState);
      return !prevState;
    });
  }, [terria]);

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
        shouldShorten={shouldShorten}
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
        isChecked={shouldShorten}
        onChange={shouldShortenOnChange}
        isDisabled={!canShortenUrl}
      >
        <TextSpan>{t("share.shortenUsingService")}</TextSpan>
      </Checkbox>
      <Spacing bottom={4} />
      <PrintSection viewState={viewState} />
      <Spacing bottom={4} />
      <EmbedSection shareUrl={shareUrlRef?.current} />
    </Box>
  );
};
