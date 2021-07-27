import { default as React, useEffect, useState } from "react";
import { API, graphqlOperation } from "aws-amplify";
import { listPages } from "../../../../api/graphql/queries";
import * as mutations from "../../../../api/graphql/mutations";
import Styles from "./RCPageList.scss";
import Icon from "../../../ReactViews/Icon";
function RCPageList() {
  const [pages, setPages] = useState(null);
  useEffect(() => {
    try {
      API.graphql(graphqlOperation(listPages)).then(data => {
        const pageList = data.data.listPages.items;
        setPages(pageList);
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

  return pages
    ? pages.map(page => {
        return (
          <div key={page.id} className={Styles.listItem}>
            <span>{page.title}</span>
            <button onClick={() => deletePage(page.id)}>
              <Icon glyph={Icon.GLYPHS.trashcan} />
            </button>
          </div>
        );
      })
    : null;
}
export default RCPageList;
