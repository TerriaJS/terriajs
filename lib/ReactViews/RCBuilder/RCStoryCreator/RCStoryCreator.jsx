import React from "react";

import { API, graphqlOperation } from "aws-amplify";
import * as mutations from "../../../../api/graphql/mutations";

class RCStoryCreator extends React.Component {
  constructor(props) {
    super(props);
  }
  storyDetails = {
    authors: [
      {
        affiliation: "eScience Center",
        full_name: "Team Cat",
        id: "1"
      }
    ],
    title: "Brazil",
    shortDescription:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras imperdiet, eros quis vestibulum bibendum, elit ligula semper nulla, ac facilisis nulla lorem vitae turpis. Pellentesque sapien nibh, rhoncus a feugiat.",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras imperdiet, eros quis vestibulum bibendum, elit ligula semper nulla, ac facilisis nulla lorem vitae turpis. Pellentesque sapien nibh, rhoncus a feugiat.",
    hotspotlocation: {
      latitude: 30.937499999999996,
      longitude: 10.31491928581316
    },
    sectors: ["COASTAL_INFRASTRUCTURE"],
    catalog: [],
    image: {
      id: "1",
      url: "/images/receipt/story-soy.jpg"
    },
    state: "PUBLISHED"
  };

  componentDidMount() {
    const newStory = API.graphql({
      query: mutations.createStory,
      variables: { input: this.storyDetails }
    });
    console.log("story created", newStory);
  }
  render() {
    return <div>Creator</div>;
  }
}

export default RCStoryCreator;
