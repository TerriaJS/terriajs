import { observer } from "mobx-react";
import { Ref } from "react";
import { TFunction, Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import triggerResize from "../../../../Core/triggerResize";
import ViewState from "../../../../ReactViewModels/ViewState";
import Icon from "../../../../Styled/Icon";
import Text from "../../../../Styled/Text";
import { useViewState } from "../../../Context";
import Prompt from "../../../Generic/Prompt";
import { useRefForTerria } from "../../../Hooks/useRefForTerria";
import Styles from "./story-button.scss";

interface Props {
  animationDuration: number;
}

interface ButtonProps extends Props {
  ["aria-expanded"]: boolean;
}

const STORY_BUTTON_NAME = "MenuBarStoryButton";

const MenuBarStoryButton = styled.button`
  ${(p) =>
    p["aria-expanded"] &&
    `&:not(.foo) {
      background: ${p.theme.colorPrimary};
      svg {
        fill: ${p.theme.textLight};
      }
    }`}
`;

export const onStoryButtonClick =
  (viewState: ViewState, animationDuration: number) => () => {
    viewState.toggleStoryBuilder();
    viewState.terria.currentViewer.notifyRepaintRequired();
    // Allow any animations to finish, then trigger a resize.
    setTimeout(function () {
      triggerResize();
    }, animationDuration || 1);
    viewState.toggleFeaturePrompt("story", false, true);
  };

const promptHtml = (hasStories: boolean, t: TFunction) => (
  <Text textLight textAlignCenter>
    {hasStories ? (
      <Trans i18nKey="story.promptHtml1" t={t}>
        <Text extraLarge>
          You can view and create stories at any time by clicking here.
        </Text>
      </Trans>
    ) : (
      <Trans i18nKey="story.promptHtml2" t={t}>
        <div>
          <Text>INTRODUCING</Text>
          <Text bold extraExtraLarge styledLineHeight={"32px"}>
            Data Stories
          </Text>
          <Text medium>
            Create and share interactive stories directly from your map.
          </Text>
        </div>
      </Trans>
    )}
  </Text>
);

const StoryButton = observer(function StoryButton(props: Props) {
  const viewState = useViewState();
  const storyButtonRef: Ref<HTMLButtonElement> = useRefForTerria(
    STORY_BUTTON_NAME,
    viewState
  );
  const storyEnabled = viewState.terria.configParameters.storyEnabled;

  const dismissAction = () => {
    viewState.toggleFeaturePrompt("story", false, true);
  };

  const delayTime =
    storyEnabled && viewState.terria.stories.length > 0 ? 1000 : 2000;

  const { t } = useTranslation();

  return (
    <div>
      <MenuBarStoryButton
        ref={storyButtonRef}
        className={Styles.storyBtn}
        type="button"
        onClick={onStoryButtonClick(viewState, props.animationDuration)}
        aria-expanded={viewState.storyBuilderShown}
      >
        <Icon glyph={Icon.GLYPHS.story} />
        <span>{t("story.story")}</span>
      </MenuBarStoryButton>
      <Prompt
        centered
        isVisible={
          storyEnabled && viewState.featurePrompts.indexOf("story") >= 0
        }
        content={promptHtml(viewState.terria.stories.length > 0, t)}
        displayDelay={delayTime}
        dismissText={t("story.dismissText")}
        dismissAction={dismissAction}
      />
    </div>
  );
});

export default StoryButton;
