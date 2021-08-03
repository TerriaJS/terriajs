import { API, graphqlOperation } from "aws-amplify";
import PropTypes from "prop-types";
import { default as React, useEffect, useState } from "react";
import { getPage } from "../../../../api/graphql/queries";
import { updatePage } from "../../../../api/graphql/mutations";
import Styles from "../RCStoryEditor/RCStoryEditor.scss";
import { useParams, withRouter, useHistory } from "react-router-dom";

function RCPageEditor(props) {
  const [page, setPage] = useState(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const history = useHistory();

  // get the page id from url
  const { story_id: storyID, page_id: pageID } = useParams();

  // Fetch page details with id
  useEffect(() => {
    try {
      API.graphql(graphqlOperation(getPage, { id: pageID })).then(story => {
        const data = story.data.getPage;
        setPage(data);
        setTitle(data.title);
      });
    } catch (error) {
      console.log(error);
    }
  }, []);

  const savePage = () => {
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
        console.log(response);
        setMessage("Error", response.errors[0].message);
      }
    });
  };

  return (
    <div className={Styles.RCStoryEditor}>
      <div className={Styles.container}>
        <h3>Edit the page</h3>
        <button
          className={Styles.RCButton}
          onClick={() => history.push(`/builder/story/${storyID}/edit`)}
        >
          Back
        </button>
      </div>
      <form className={Styles.RCStoryCard}>
        <div className={Styles.group}>
          <input
            type="text"
            required
            defaultValue={title}
            onChange={e => setTitle(e.target.value)}
          />
          <span className={Styles.highlight} />
          <span className={Styles.bar} />
          <label className={title && Styles.topLabel}>Story Title</label>
        </div>

        <div className={Styles.container}>
          <button className={Styles.RCButton} onClick={savePage}>
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
export default withRouter(RCPageEditor);
