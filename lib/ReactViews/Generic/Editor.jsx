import React, { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import PropTypes from "prop-types";

// Import TinyMCE
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
        menubar: false,
        branding: false,
        statusbar: false,
        plugins: [
          // "advlist",
          // "autolink",
          // "lists",
          "link",
          "image",
          // "charmap",
          // "preview",
          // "anchor",
          // "searchreplace",
          // "visualblocks",
          // "code",
          // "fullscreen",
          // "insertdatetime",
          "media",
          "table"
          // "help",
          // "wordcount"
        ],
        toolbar:
          "bold italic forecolor |" +
          " bullist numlist table |" +
          "image media link |" +
          "alignleft aligncenter alignright alignjustify | undo redo | removeformat |" +
          "blocks",

        content_style:
          "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }"
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

// import React from "react";
// import { init, exec } from "pell";
// import PropTypes from "prop-types";

// export default class Editor extends React.PureComponent {
//   constructor(props) {
//     super(props);
//   }

//   componentDidMount() {
//     this.editor = init({
//       element: this.node,
//       onChange: this.props.onChange,
//       actions: this.props.actions
//     });
//     this.editor.content.innerHTML = this.props.html;
//   }

//   componentWillUnmount() {
//     this.editor = undefined;
//   }
//   render() {
//     return <div ref={node => (this.node = node)} />;
//   }
// }

// Editor.propTypes = {
//   html: PropTypes.string,
//   onChange: PropTypes.func.isRequired,
//   actions: PropTypes.array
// };

// Editor.defaultProps = {
//   actions: [
//     "bold",
//     "italic",
//     "underline",
//     "heading1",
//     "heading2",
//     "olist",
//     "ulist",
//     "image",
//     {
//       name: "link",
//       result: () => {
//         /* eslint-disable-next-line no-alert */
//         const url = window.prompt("Enter the link URL", "http://");
//         if (url) {
//           exec("createLink", url);
//         }
//       }
//     }
//   ]
// };
