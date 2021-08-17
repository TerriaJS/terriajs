import { API } from "aws-amplify";
import { default as React, useState } from "react";
import { useHistory, useParams, withRouter } from "react-router-dom";
import * as mutations from "../../../../api/graphql/mutations";
import RCAccordian from "../RCAccordian/RCAccordian";
import RCPageListItem from "./RCPageListItem";
import PropTypes from "prop-types";
function RCPageList(props) {
  const { pages, updatePages } = props;
  const [dragId, setDragId] = useState();
  // get story id from url
  const { id } = useParams();
  const history = useHistory();

  // Create Page
  const addPage = () => {
    const newPage = {
      title: "New page",
      section: "INTRODUCTION",
      camera:
        '{"west":-37.96875000000001,"south":-37.857507156252034,"east":95.44921875,"north":79.00496216031351}',
      baseMapName: "Bing Maps Aerial with Labels",
      viewer_mode_3d: true,
      scenarios: [],
      storyID: id,
      pageNr: pages.length + 1
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
        // Update state in parent component RCStoryEditor
        updatePages(newPages);
      } else {
        console.error("Error", response.errors[0].message);
      }
    });
  };
  // Delete Page
  const deletePage = id => {
    try {
      // Delete page from DynamoDb
      API.graphql({
        query: mutations.deletePage,
        variables: { input: { id } }
      });
      updatePages(pages.filter(page => page.id !== id));
    } catch (error) {
      console.error(error);
    }
  };
  const updatePageNr = page => {
    try {
      const pageDetails = {
        id: page.id,
        pageNr: page.pageNr
      };
      // Delete page from DynamoDb
      API.graphql({
        query: mutations.updatePage,
        variables: { input: pageDetails }
      });
    } catch (error) {
      console.error(error);
    }
  };
  const toEditPage = pageId => {
    history.push(`/builder/story/${id}/page/${pageId}/edit`);
  };
  const handleDrag = ev => {
    setDragId(ev.currentTarget.id);
  };
  const handleDrop = ev => {
    const dragItem = pages.find(page => page.id === dragId);
    const dropItem = pages.find(page => page.id === ev.currentTarget.id);
    const dragItemOrder = dragItem.pageNr;
    const dropItemOrder = dropItem.pageNr;
    const newPagesState = pages.map(page => {
      if (page.id === dragId) {
        page.pageNr = dropItemOrder;
      }
      if (page.id === ev.currentTarget.id) {
        page.pageNr = dragItemOrder;
      }
      // Update page numbers in database
      updatePageNr(page);
      return page;
    });
    // Update local state to display updated page order
    updatePages(newPagesState);
  };

  return pages ? (
    <RCAccordian
      title="Pages"
      hasAction={true}
      actionTitle="+ Add"
      action={addPage}
      enableReorder={true}
    >
      {pages
        .sort((a, b) => a.pageNr - b.pageNr)
        .map(page => {
          return (
            <RCPageListItem
              key={page.id}
              page={page}
              editPage={toEditPage}
              deletePage={deletePage}
              handleDrag={handleDrag}
              handleDrop={handleDrop}
            />
          );
        })}
    </RCAccordian>
  ) : null;
}
RCPageList.propTypes = {
  pages: PropTypes.array,
  updatePages: PropTypes.func
};
export default withRouter(RCPageList);
