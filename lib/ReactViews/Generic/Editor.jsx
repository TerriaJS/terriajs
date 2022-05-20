import React, { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import PropTypes from "prop-types";
import tinymce from "tinymce"; //must import despite being unused

/* Required TinyMCE components */
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/models/dom";
/* Import a skin (can be a custom skin instead of the default) */
import "!!style-loader!css-loader?sourceMap!tinymce/skins/ui/oxide/skin.css";
/* Import TinyMCE plugins */
import "tinymce/plugins/media";
import "tinymce/plugins/image";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/table";
export default function TinyEditor(props) {
  const editorRef = useRef(null);

  return (
    <Editor
      onInit={(evt, editor) => (editorRef.current = editor)}
      value={props.html}
      onEditorChange={props.onChange}
      init={{
        height: 400,
        skin: false,
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
          "body { font-family:Helvetica,Arial,sans-serif; font-size:14px;}",
        content_css: false
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
