import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  PropsWithChildren
} from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import Terria from "../../../../../Models/Terria";
import ViewState from "../../../../../ReactViewModels/ViewState";

import Spacing from "../../../../../Styled/Spacing";
import { TextSpan } from "../../../../../Styled/Text";

import { buildShareLink, buildShortShareLink } from "../BuildShareLink";
import { ShareUrlWarning } from "./ShareUrlWarning";
import Clipboard from "../../../../Clipboard";
import Input from "../../../../../Styled/Input";
import {
  Category,
  ShareAction
} from "../../../../../Core/AnalyticEvents/analyticEvents";

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
>(
  (
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
  ) => {
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
      [forwardRef, shareUrl, shorteningInProgress]
    );

    useEffect(() => {
      if (shouldShorten) {
        setPlaceholder(t("share.shortLinkShortening"));
        setShorteningInProgress(true);
        buildShortShareLink(terria, viewState, {
          includeStories
        })
          .then((shareUrl) => setShareUrl(shareUrl))
          .catch(() => {
            setShareUrl(
              buildShareLink(terria, viewState, {
                includeStories
              })
            );
          })
          .finally(() => setShorteningInProgress(false));
      } else {
        setShareUrl(
          buildShareLink(terria, viewState, {
            includeStories
          })
        );
      }
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
          source={
            <Input
              light={inputTheme === "light"}
              dark={inputTheme === "dark"}
              large
              type="text"
              value={shareUrl}
              placeholder={placeholder ?? t("share.shortLinkShortening")}
              readOnly
              onClick={(e) => e.currentTarget.select()}
              css={`
                ${rounded ? `border-radius:  32px 0 0 32px;` : ""}
              `}
              id="share-url"
            />
          }
          id="share-url"
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
  }
);

const Explanation = styled(TextSpan)`
  opacity: 0.8;
`;
