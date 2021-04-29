import React from "react";
import Styles from "./RCStoryList.scss";
import { API, graphqlOperation } from "aws-amplify";
import { listStorys } from "../../../../api/graphql/queries";

class RCStoryList extends React.Component {
  constructor(props) {
    super(props);
  }
  state = {
    stories: []
  };

  componentDidMount() {
    this.fetchStories();
  }

  fetchStories() {
    try {
      API.graphql(graphqlOperation(listStorys)).then(data => {
        const storylist = data.data.listStorys.items;
        console.log(storylist);
        this.setState({ stories: storylist });
      });
    } catch (error) {
      console.log("Error fetching stories:", error);
    }
  }

  render() {
    //const {}
    return (
      <div className={Styles.RCStoryList}>
        <h1>Hello List!</h1>
      </div>
    );
  }
}

export default RCStoryList;
