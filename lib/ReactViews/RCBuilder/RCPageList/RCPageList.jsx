import { API, graphqlOperation } from "aws-amplify";
import { listPages } from "../../../../api/graphql/queries";
import { default as React, useState, useEffect } from "react";
import { useHistory, useParams, withRouter } from "react-router-dom";
import * as mutations from "../../../../api/graphql/mutations";
import RCAccordian from "../RCAccordian/RCAccordian";
import RCPageListItem from "./RCPageListItem";
function RCPageList() {
  const [pages, setPages] = useState(null);
  const [dragId, setDragId] = useState();
  // get story id from url
  const { id } = useParams();
  const history = useHistory();

  // get all the pages for this story
  // This call is made here in order to update page list on add
  useEffect(() => {
    try {
      console.log("id", id);
      API.graphql(graphqlOperation(listPages, { storyID: id })).then(data => {
        const pageList = data.data.listPages.items;
        setPages(pageList);
        // orderList("listContainer");
      });
    } catch (error) {
      console.log(error);
    }
  }, []);
  // Create Page
  const addPage = () => {
    const newPage = {
      title: "New page",
      section: "INTRODUCTION",
      camera: [0, 0, 0, 0],
      baseMapName: "basemap",
      viewer_mode_3d: true,
      scenarios: [],
      storyID: id,
      pageNr: 1
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
  const handleDrag = ev => {
    setDragId(ev.currentTarget.id);
  };
  const handleDrop = ev => {
    debugger;
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
      return page;
    });
    setPages(newPagesState);
    console.log("reorder", newPagesState);
  };

  return pages ? (
    <RCAccordian
      title="Pages"
      hasAction={true}
      actionTitle="+ Add"
      action={addPage}
      enableReorder={true}
    >
      {pages.map(page => (
        <p key={page.id}>{page.id}</p>
      ))}
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

export default withRouter(RCPageList);
