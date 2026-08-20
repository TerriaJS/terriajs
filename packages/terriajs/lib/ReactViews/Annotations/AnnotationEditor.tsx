import { lazy, Suspense, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Box from "../../Styled/Box";
import Button from "../../Styled/Button";
import Text from "../../Styled/Text";
import ViewState from "../../ReactViewModels/ViewState";

// Lazy load the Editor component as the tinyMCE library is large
const Editor = lazy(() => import("../Generic/Editor"));

interface AnnotationEditorProps {
  viewState: ViewState;
}

/**
 * Modal wrapper around the shared TinyMCE rich-text {@link Editor}, used to author
 * the text of a map annotation. It is driven by
 * {@link ViewState.annotationEditorState}: set that to show the modal, clear it to
 * hide it.
 */
const AnnotationEditor = observer(function AnnotationEditor({
  viewState
}: AnnotationEditorProps) {
  const { t, i18n } = useTranslation();
  const state = viewState.annotationEditorState;
  const [html, setHtml] = useState("");

  useEffect(() => {
    if (state) {
      setHtml(state.initialText);
    }
  }, [state]);

  if (!state) {
    return null;
  }

  const save = () => {
    state.onSave(html);
    viewState.closeAnnotationEditor();
  };

  const cancel = () => {
    viewState.closeAnnotationEditor();
  };

  const remove = () => {
    state.onDelete?.();
    viewState.closeAnnotationEditor();
  };

  return (
    <Overlay onClick={cancel}>
      <Inner onClick={(e) => e.stopPropagation()}>
        <Box paddedRatio={2}>
          <Text textLight as="h3" css={{ margin: "0" }}>
            {state.isNew
              ? t(($) => $.annotations.editor.addHeader)
              : t(($) => $.annotations.editor.editHeader)}
          </Text>
        </Box>
        <Body>
          <Suspense fallback={<div>Loading...</div>}>
            <Editor
              language={i18n.language}
              baseUrl=""
              html={html}
              onChange={(value: string) => setHtml(value)}
            />
          </Suspense>
        </Body>
        <Box centered gap={3} paddedRatio={2}>
          <Button
            styledWidth={"180px"}
            transparentBg
            onClick={cancel}
            type="button"
            textProps={{ textLight: true, medium: true }}
          >
            {t(($) => $.annotations.editor.cancelBtn)}
          </Button>
          {state.onDelete && (
            <Button
              styledWidth={"180px"}
              transparentBg
              onClick={remove}
              type="button"
              textProps={{ textLight: true, medium: true }}
            >
              {t(($) => $.annotations.editor.deleteBtn)}
            </Button>
          )}
          <Button
            styledWidth={"180px"}
            primary
            onClick={save}
            type="button"
            textProps={{ medium: true }}
          >
            {t(($) => $.annotations.editor.saveBtn)}
          </Button>
        </Box>
      </Inner>
    </Overlay>
  );
});

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
`;

const Inner = styled.div`
  width: 640px;
  max-width: calc(100vw - 40px);
  background: ${(p) => p.theme.dark};
  border-radius: ${(p) => p.theme.radiusLarge};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  overflow: hidden;
`;

const Body = styled.div`
  padding: 0 ${(p) => p.theme.spacing};
  background: ${(p) => p.theme.textLight};
`;

export default AnnotationEditor;
