import React from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import PropTypes from "prop-types";
import UploadAdapter from "../Upload/UploadAdapter";
function RCEditor(props) {
  const { content, onContentChange, storyID, onSaveContent } = props;
  return (
    <CKEditor
      editor={ClassicEditor}
      data={content}
      onReady={editor => {
        // You can store the "editor" and use when it is needed.
        editor.plugins.get("FileRepository").createUploadAdapter = loader => {
          return new UploadAdapter(loader, storyID);
        };
      }}
      onChange={(event, editor) => {
        const data = editor.getData();
        onContentChange(data);
      }}
      onBlur={(event, editor) => {
        onSaveContent(editor.getData());
      }}
    />
  );
}
RCEditor.propTypes = {
  content: PropTypes.string,
  onSaveContent: PropTypes.func,
  onContentChange: PropTypes.func,
  storyID: PropTypes.string
};
export default RCEditor;
