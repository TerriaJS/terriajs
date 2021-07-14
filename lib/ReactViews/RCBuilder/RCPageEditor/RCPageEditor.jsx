import { API, graphqlOperation } from "aws-amplify";
import PropTypes from "prop-types";
import { default as React, useEffect, useState } from "react";
import { getPage } from "../../../../api/graphql/queries";
import { updatePage } from "../../../../api/graphql/mutations";
import Styles from "../RCStoryEditor/RCStoryEditor.scss";
import { useParams } from "react-router-dom";

function RCPageEditor(props) {
  const [page, setPage] = useState(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  // get the page id from url
  const { id } = useParams();

  // Fetch page details with id
  useEffect(() => {
    try {
      API.graphql(graphqlOperation(getPage, { id: id })).then(story => {
        const data = story.data.getPage;
        setPage(data);
        setTitle(data.title);
      });
    } catch (error) {
      console.log(error);
    }
  }, []);

  const onTitleChanged = event => {
    setTitle(event.target.value);
  };

  const onSave = () => {
    const pageDetails = {
      id: page.id,
      title: title
    };
    API.graphql({
      query: updatePage,
      variables: { input: pageDetails }
    }).then(response => {
      if (response.data.updatePage) {
        setMessage("Page details saved successfully!");
      } else {
        setMessage("Error", response.errors[0].message);
      }
    });
  };

  return (
    <div className={Styles.RCPageEditor}>
      <h3>Edit the page</h3>
      <form className={Styles.RCStoryCard}>
        <div className={Styles.group}>
          <input
            type="text"
            required
            defaultValue={title}
            onChange={onTitleChanged}
          />
          <span className={Styles.highlight} />
          <span className={Styles.bar} />
          <label className={title && Styles.topLabel}>Story Title</label>
        </div>

        <div className={Styles.container}>
          <button className={Styles.RCButton} onClick={onSave}>
            Save
          </button>
          <label>{message}</label>
        </div>
      </form>
    </div>
  );
}

RCPageEditor.propTypes = {
  viewState: PropTypes.object
};
export default RCPageEditor;
