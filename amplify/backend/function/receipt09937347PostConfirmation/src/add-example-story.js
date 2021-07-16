var aws = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
var ddb = new aws.DynamoDB();

exports.handler = async (event, context) => {
    const date = new Date();
    if (event.request.userAttributes.sub) {
        console.log("create an example story for user");
        try {
          const item = await ddb.getItem({
            TableName: process.env.STORYTABLE,
            Key: {
              id: {S: "0"}
            }
          }).promise();

          console.log("Success", JSON.stringify(item));

          const story = item.Item;

          story.id = {"S": uuidv4()};
          story.authors = {
            "L": [
              {
                "M": {
                  "affiliation": {"S": "eScience Center"},
                  "full_name": {"S": "Team Cat"},
                  "id": {"S": event.request.userAttributes.sub}
                }
              }
            ]
          };
          story.owner = {S: event.request.userAttributes.sub};
          story.state = {S: "DRAFT"};
          story.updatedAt= {S: date.toISOString()};

          console.log("Going to put item: ", JSON.stringify(story));

          await ddb.putItem({
            Item: story,
            TableName: process.env.STORYTABLE

          }).promise();
          console.log("Success");
        } catch (err) {
          console.log("Error", err);
        }
        context.done(null, event);
    } else {
        // Nothing to do, the user's email ID is unknown
        console.log("Error: Nothing was written to DynamoDB");
        context.done(null, event);
    }
};


        // const params = {
        //     Item: {
        //         "__typename": {S: "Story"},
        //         "authors": {
        //             "L": [
        //               {
        //                 "M": {
        //                   "affiliation": {"S": "eScience Center"},
        //                   "full_name": {"S": "Team Cat"},
        //                   "id": {"S": event.request.userAttributes.sub}
        //                 }
        //               }
        //             ]
        //           },
        //         "catalog": {
        //             "L": []
        //         },
        //         "createdAt": {S: date.toISOString()},
        //         "description": {S: "The severity of this year’s drought in Brazil and Argentina is set to cause severe disruption to the EU’s food supply as prices of meat and dairy products soar. The cause of the chaos? A humble bean. Yet this is no ordinary bean. Soy has been dubbed the ‘green gold’ since the early part of the Century. Today, it is the most important protein crop globally and a lynchpin in many of the world’s largest economies."},
        //         "hotspotlocation": {
        //             "M": {
        //               "latitude": {"N": "47.025206001585396"},
        //               "longitude": {"N": "12.436523437499998"}
        //             }
        //           },
        //         "id": {S: event.request.userAttributes.sub},
        //         "owner": {S: event.request.userAttributes.sub},
        //         "sectors": {
        //             "L": [
        //               { "S": "AGRICULTURE"}
        //             ]
        //           },
        //         "shortDescription": {S: "The effect of climate change on soy production"},
        //         "state": {S: "DRAFT"},
        //         "title": {S: "Example Stroy: Drought affecting the production of soy in South America"},
        //         "updatedAt": {S: date.toISOString()},
        //     },
        //     TableName: process.env.STORYTABLE
        // };
