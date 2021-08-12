import { API } from "aws-amplify";
import PropTypes from "prop-types";
import { default as React } from "react";
import { useHistory, useParams, withRouter } from "react-router-dom";
import * as mutations from "../../../../api/graphql/mutations";
import Icon from "../../Icon";
import RCAccordian from "../RCAccordian/RCAccordian";
import Styles from "./RCPageList.scss";

function RCPageList(props) {
  const pages = props.pages;
  // get the story id from url
  const { id } = useParams();
  const history = useHistory();

  // Create Page
  const addPage = () => {
    const newPage = {
      title: "New page",
      section: "INTRODUCTION",
      camera: [0, 0, 0, 0],
      baseMapName: "basemap",
      viewer_mode_3d: true,
      scenarios: []
    };

    // Create a new page
    API.graphql({
      query: mutations.createPage,
      variables: { input: newPage }
    }).then(response => {
      if (response.data.createPage) {
        // Add the new page to the story
        newPage.id = response.data.createPage.id;
        const newPages = Array.isArray(pages) ? [...pages, newPage] : [newPage];
        // setPages(newPages);
        console.log("pages saved", newPages);
      } else {
        console.log("Error", response.errors[0].message);
      }
    });
  };
  // Delete Page
  const deletePage = id => {
    try {
      // const deletedPage = API.graphql(graphqlOperation(deletePage, { input: { id } }));
      // Delete page from DynamoDb
      API.graphql({
        query: mutations.deletePage,
        variables: { input: { id } }
      });
      // setPages(pages.filter(page => page.id !== id));
    } catch (error) {
      console.log(error);
    }
  };
  const toEditPage = pageId => {
    history.push(`/builder/story/${id}/page/${pageId}/edit`);
  };
  console.log(pages);
  return pages ? (
    <RCAccordian
      title="Pages"
      hasAction={true}
      actionTitle="+ Add"
      action={addPage}
      enableReorder={true}
    >
      {pages.map(page => {
        return (
          <li key={page.id} className={Styles.listItem}>
            <Icon glyph={Icon.GLYPHS.reorder} class="reorder" />
            <span>{page.title}</span>
            <button onClick={() => toEditPage(page.id)}>
              <Icon glyph={Icon.GLYPHS.edit} />
            </button>
            <button onClick={() => deletePage(page.id)}>
              <Icon glyph={Icon.GLYPHS.trashcan} />
            </button>
          </li>
        );
      })}
    </RCAccordian>
  ) : null;
}

RCPageList.propTypes = {
  pages: PropTypes.array
};
export default withRouter(RCPageList);
