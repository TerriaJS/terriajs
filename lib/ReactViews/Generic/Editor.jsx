import React, { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import PropTypes from "prop-types";

export default function TinyEditor(props) {
  const editorRef = useRef(null);
  // const log = () => {
  //   if (editorRef.current) {
  //     console.log(editorRef.current.getContent());
  //   }
  // };

  return (
    <Editor
      apiKey="trlne9rssajd8xhy0b50ht6kqzioaqhm5l5t2vcucfx1drol"
      onInit={(evt, editor) => (editorRef.current = editor)}
      initialValue={props.html}
      onChange={props.onChange}
      init={{
        height: 500,
        menubar: false,
        plugins: [
          "advlist",
          "autolink",
          "lists",
          "link",
          "image",
          "charmap",
          "preview",
          "anchor",
          "searchreplace",
          "visualblocks",
          "code",
          "fullscreen",
          "insertdatetime",
          "media",
          "table",
          "code",
          "help",
          "wordcount"
        ],
        toolbar:
          "undo redo | blocks | " +
          "bold italic forecolor | alignleft aligncenter " +
          "alignright alignjustify | bullist numlist outdent indent | " +
          "removeformat | help",
        content_style:
          "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }"
      }}
    />
  );
}

TinyEditor.propTypes = {
  html: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  actions: PropTypes.array
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
