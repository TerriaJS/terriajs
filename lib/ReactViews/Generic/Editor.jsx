import React, { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import PropTypes from "prop-types";
import tinymce from "tinymce/tinymce";

export default function TinyEditor(props) {
  const editorRef = useRef(null);

  // Themes and plugins for tinyMCE are in wwwroot folder
  tinymce.baseURL = `${props.terria.baseUrl}third_party/tinymce`;

  return (
    <Editor
      onInit={(evt, editor) => (editorRef.current = editor)}
      value={props.html}
      onEditorChange={props.onChange}
      init={{
        height: 300,
        skin: "terria1", // To create a new custom skin go to https://skin.tiny.cloud/t5/
        menubar: false,
        branding: false,
        statusbar: false,
        plugins: ["link", "image", "media", "table", "lists"],
        toolbar:
          "blocks | bold italic forecolor | align |" +
          " bullist numlist table |" +
          "image media link |" +
          "undo redo | removeformat",
        content_style:
          "body { font-family:Helvetica,Arial,sans-serif; font-size:14px;}"
      }}
    />
  );
}

TinyEditor.propTypes = {
  html: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  actions: PropTypes.array,
  terria: PropTypes.object
};
