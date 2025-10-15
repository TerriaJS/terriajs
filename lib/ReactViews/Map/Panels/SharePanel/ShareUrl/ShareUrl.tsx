import {
  PropsWithChildren,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState
} from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import Terria from "../../../../../Models/Terria";
import ViewState from "../../../../../ReactViewModels/ViewState";

import Spacing from "../../../../../Styled/Spacing";
import { TextSpan } from "../../../../../Styled/Text";

import {
  Category,
  ShareAction
} from "../../../../../Core/AnalyticEvents/analyticEvents";
import Clipboard from "../../../../Clipboard";
import { buildShareLink, buildShortShareLink } from "../BuildShareLink";
import { ShareUrlWarning } from "./ShareUrlWarning";
import TerriaError, {
  TerriaErrorSeverity
} from "../../../../../Core/TerriaError";

interface IShareUrlProps {
  terria: Terria;
  viewState: ViewState;
  includeStories: boolean;
  shouldShorten: boolean;
  theme: "light" | "dark";
  inputTheme?: "light" | "dark";
  rounded?: boolean;
  callback?: () => void;
}

export interface IShareUrlRef {
  url: string;
  shorteningInProgress: boolean;
}

export const ShareUrl = forwardRef<
  IShareUrlRef,
  PropsWithChildren<IShareUrlProps>
>(function ShareUrl(
  {
    terria,
    viewState,
    includeStories,
    shouldShorten,
    children,
    theme,
    inputTheme,
    rounded,
    callback
  },
  forwardRef
) {
  const { t } = useTranslation();

  const [shareUrl, setShareUrl] = useState("");
  const [shorteningInProgress, setShorteningInProgress] = useState(false);
  const [placeholder, setPlaceholder] = useState<string>();

  useImperativeHandle(
    forwardRef,
    () => ({
      url: shareUrl,
      shorteningInProgress: shorteningInProgress
    }),
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [forwardRef, shareUrl, shorteningInProgress]
  );

  useEffect(() => {
    let cancelled = false;
    if (shouldShorten) {
      setPlaceholder(t("share.shortLinkShortening"));
      setShorteningInProgress(true);
      buildShortShareLink(terria, viewState, { includeStories })
        .then((shareUrl) => {
          if (!cancelled) setShareUrl(shareUrl);
        })
        .catch((error) => {
          let userMessage = t("models.shareData.generateErrorMessage");
          if (error instanceof TerriaError) {
            const highestImportanceError = error.highestImportanceError;
            const highestImportanceOriginalErrorMessage =
              highestImportanceError.originalError?.[0].message;
            if (highestImportanceOriginalErrorMessage?.includes("413")) {
              userMessage = t(
                "models.shareData.generateErrorDataExceedsLimitMessage"
              );
              terria.raiseErrorToUser(
                TerriaError.from(error, {
                  message: userMessage
                }),
                {
                  severity: TerriaErrorSeverity.Error
                }
              );
            }
          }
          if (!cancelled) {
            setShareUrl(userMessage);
          }
        })
        .finally(() => {
          if (!cancelled) setShorteningInProgress(false);
        });
    } else {
      setShareUrl(
        buildShareLink(terria, viewState, {
          includeStories
        })
      );
    }
    return () => {
      cancelled = true;
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [terria, viewState, shouldShorten, includeStories]);

  return (
    <>
      <Explanation textDark={theme === "light"}>
        {t("clipboard.shareExplanation")}
      </Explanation>
      <Spacing bottom={1} />
      <Clipboard
        theme={theme}
        text={shareUrl}
        inputPlaceholder={placeholder}
        inputTheme={inputTheme}
        rounded={rounded}
        onCopy={(text) =>
          terria.analytics?.logEvent(
            Category.share,
            ShareAction.storyCopy,
            text
          )
        }
      />
      {children}
      <Spacing bottom={2} />
      <ShareUrlWarning
        terria={terria}
        viewState={viewState}
        callback={callback || (() => {})}
      />
    </>
  );
});

const Explanation = styled(TextSpan)`
  opacity: 0.8;
`;
