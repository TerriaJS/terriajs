import { action } from "mobx";
import styled from "styled-components";
import Icon from "../../Styled/Icon";
import { useViewState } from "../Context";

const PopoutContainer = styled.div`
  position: absolute;

  width: 90vw;
  height: 90vh;
  top: 5vh;
  left: 5vw;

  padding: 8px;
  background: white;
  z-index: 100000;
`;

const CloseButton = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 100;

  svg {
    height: 20px;
    width: 20px;
  }
`;

const ContentIframe = styled.iframe`
  width: 100%;
  height: 100%;
`;

function ContentPopout() {
  const viewState = useViewState();
  // Do another round of escaping, as iframe srcDoc will reverse that
  const replacedHtml = viewState.contentPopoutHtml.replace("&", "&amp;");
  const closePopout = action(() => {
    viewState.contentPopoutOpen = false;
  });
  return (
    <PopoutContainer>
      <ContentIframe srcDoc={replacedHtml} />
      <CloseButton onClick={closePopout}>
        <Icon glyph={Icon.GLYPHS.close} />
      </CloseButton>
    </PopoutContainer>
  );
}

export default ContentPopout;
