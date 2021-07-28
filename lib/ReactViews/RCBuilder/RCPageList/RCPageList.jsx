import { default as React, useEffect, useState } from "react";
import { API, graphqlOperation } from "aws-amplify";
import { listPages } from "../../../../api/graphql/queries";
import * as mutations from "../../../../api/graphql/mutations";
import { useParams, withRouter, useHistory } from "react-router-dom";
import Styles from "./RCPageList.scss";
import Icon from "../../Icon";
import orderList from "./RCOrderList";

function RCPageList() {
  const [pages, setPages] = useState(null);
  // get the story id from url
  const { id } = useParams();
  const history = useHistory();
  useEffect(() => {
    try {
      API.graphql(graphqlOperation(listPages)).then(data => {
        const pageList = data.data.listPages.items;
        setPages(pageList);
        orderList("listContainer");
      });
    } catch (error) {
      console.log(error);
    }
  }, []);
  const deletePage = id => {
    try {
      // const deletedPage = API.graphql(graphqlOperation(deletePage, { input: { id } }));
      // Delete page from DynamoDb
      API.graphql({
        query: mutations.deletePage,
        variables: { input: { id } }
      });
      setPages(pages.filter(page => page.id !== id));
    } catch (error) {
      console.log(error);
    }
  };
  const toEditPage = pageId => {
    history.push(`/builder/story/${id}/page/${pageId}/edit`);
  };
  return pages
    ? pages.map(page => {
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
      })
    : null;
}
export default withRouter(RCPageList);
