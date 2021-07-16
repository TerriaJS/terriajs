var aws = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
var ddb = new aws.DynamoDB({ apiVersion: '2012-08-10' });
var s3 = new aws.S3({ apiVersion: '2006-03-01' });

exports.handler = async (event, context, callback) => {
    const date = new Date();
    console.log("Add example story function");
    if (event.request.userAttributes.sub) {
        console.log("create an example story for user");
        try {
          const item = await ddb.getItem({
            TableName: process.env.API_RECEIPTAPI_STORYTABLE_NAME,
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

          const newKey = 'story-' + story.id.S + '/' + story.image.M.id.S.split('/')[1];
          var params = {
            Bucket: process.env.STORAGE_STORYCONTENT_BUCKETNAME,
            CopySource: process.env.STORAGE_STORYCONTENT_BUCKETNAME + '/public/' + story.image.M.id.S,
            Key: 'public/'+newKey
          };
          console.log("Copy params: ", JSON.stringify(params));
          s3.copyObject(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);           // successful response
          });

          story.image.M.id = { "S": newKey};
          console.log("Going to put item: ", JSON.stringify(story));

          await ddb.putItem({
            Item: story,
            TableName: process.env.API_RECEIPTAPI_STORYTABLE_NAME
          }).promise();
          console.log("Success");
        } catch (err) {
          console.log("Error", err);
        }
        callback(null, 'Created story successfully');
    } else {
        // Nothing to do, the user's email ID is unknown
        console.log("Error: Nothing was written to DynamoDB");
        callback(null, 'Story was not created');
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
