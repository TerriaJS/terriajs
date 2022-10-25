/* eslint-disable camelcase */
import React, { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import PropTypes from "prop-types";
// eslint-disable-next-line no-unused-vars
import tinymce from "tinymce"; // must import despite being unused
/* Required TinyMCE components */
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/models/dom";
/* Import a skin (can be a custom skin instead of the default) */
// import "!!style-loader!css-loader?sourceMap!tinymce/skins/ui/oxide/skin.min.css";
import "!!style-loader!css-loader?sourceMap!./editor.skin.min.css"; // Custom borderless skin

/* Import TinyMCE plugins */
import "tinymce/plugins/media";
import "tinymce/plugins/image";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/table";
import "tinymce/plugins/autolink";

// Extra css to enable proper behaviour of tinymce, including image resize handles
import contentCss from "!!raw-loader!tinymce/skins/content/default/content.min.css";
import contentUiCss from "!!raw-loader!tinymce/skins/ui/oxide/content.min.css";

export default function TinyEditor(props) {
  const editorRef = useRef(null);

  return (
    <Editor
      onInit={(evt, editor) => (editorRef.current = editor)}
      value={props.html}
      onEditorChange={props.onChange}
      init={{
        height: 450,
        skin: false,
        menubar: false,
        branding: false,
        statusbar: false,
        plugins: ["link", "image", "media", "table", "lists", "autolink"],
        toolbar:
          "blocks | bold italic forecolor | align |" +
          " bullist numlist table |" +
          "image media link |" +
          "undo redo | removeformat",
        content_css: false,
        content_style: [contentCss, contentUiCss].join("\n"),
        image_dimensions: false
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
