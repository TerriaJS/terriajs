import { AmplifyS3Image } from "@aws-amplify/ui-react";
import { API, graphqlOperation } from "aws-amplify";
import React from "react";
import { withRouter } from "react-router-dom";
import { listStorys } from "../../../../api/graphql/queries";
import Styles from "./RCStoryList.scss";

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
    const { stories } = this.state;
    const path = this.props.match.path;

    return (
      <div className={Styles.RCStoryList}>
        <h1>My stories</h1>
        <table className={Styles.stories}>
          <tbody>
            {stories.map(story => {
              return (
                <tr className={Styles.storycard} key={story.id}>
                  <td>
                    <AmplifyS3Image
                      className={Styles.storyimage}
                      imgKey={story.image?.id}
                    />
                  </td>
                  <td className={Styles.storytitle}>{story.title}</td>
                  <td>
                    <a href={`#${path}/story/${story.id}/edit`}>Edit</a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

export default withRouter(RCStoryList);
