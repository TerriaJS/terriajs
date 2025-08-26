import { runInAction } from "mobx";
import {
  Category,
  HelpAction
} from "../../../../Core/AnalyticEvents/analyticEvents";
import Button from "../../../../Styled/Button";
import Icon, { StyledIcon } from "../../../../Styled/Icon";
import { useViewState } from "../../../Context";

const HELP_CENTER_URL = "https://terriajs.gitbook.io/help-center";

/**
 * SaaS only button to open help center
 *
 * Ideally there is a better way to customize help panel content that doesn't
 * require code change.
 */
const HelpCentreButton = () => {
  const viewState = useViewState();
  return (
    <Button
      primary
      rounded
      styledMinWidth={"240px"}
      onClick={() => {
        viewState.terria.analytics?.logEvent(
          Category.help,
          HelpAction.helpCenterOpened
        );
        runInAction(() => {
          viewState.hideHelpPanel();
          window.open(HELP_CENTER_URL);
        });
      }}
      renderIcon={() => (
        <StyledIcon light styledWidth={"18px"} glyph={Icon.GLYPHS.info} />
      )}
      textProps={{
        large: true
      }}
      css={`
        ${(p) => p.theme.addTerriaPrimaryBtnStyles(p)}
      `}
    >
      Help Centre
    </Button>
  );
};
export default HelpCentreButton;
