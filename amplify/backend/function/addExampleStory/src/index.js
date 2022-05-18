/* Amplify Params - DO NOT EDIT
	API_RECEIPTAPI_GRAPHQLAPIIDOUTPUT
	API_RECEIPTAPI_PAGETABLE_ARN
	API_RECEIPTAPI_PAGETABLE_NAME
	API_RECEIPTAPI_STORYTABLE_ARN
	API_RECEIPTAPI_STORYTABLE_NAME
	ENV
	REGION
	STORAGE_STORYCONTENT_BUCKETNAME
Amplify Params - DO NOT EDIT */

var aws = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
var ddb = new aws.DynamoDB({ apiVersion: '2012-08-10' });
var s3 = new aws.S3({ apiVersion: '2006-03-01' });

async function copyImage(image, newKey){
  var params = {
    Bucket: process.env.STORAGE_STORYCONTENT_BUCKETNAME,
    CopySource: process.env.STORAGE_STORYCONTENT_BUCKETNAME + '/public/' + image.M.id.S,
    Key: 'public/'+newKey
  };
  console.debug("Copy params: ", JSON.stringify(params, null, 2));
  await s3.copyObject(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  }).promise();
}

async function modifyStory(story, date, userName) {
  // Set the relevant parts of the story to the user
  story.id = {"S": uuidv4()};
  story.authors = {
    "L": [
      {
        "M": {
          "affiliation": {"S": "eScience Center"},
          "full_name": {"S": "Team Cat"},
          "id": {"S": userName}
        }
      }
    ]
  };
  story.owner = {S: userName};
  story.state = {S: "DRAFT"};
  story.updatedAt= {S: date.toISOString()};

  const newKey = 'story-' + story.id.S + '/' + story.image.M.id.S.split('/')[1];
  // Copy the image on S3
  await copyImage(story.image, newKey);
  // Set image id after copy so the copy goes correctly
  story.image.M.id = { "S": newKey};

  // Copy any linked pages.
  await copyPages(story, date, userName);

  return story;
}

async function copyPages(story, date, userName){
  // Retrieve all pages linked to the stories
  var params = {
    ExpressionAttributeValues: {
    ":v1": {
        S: "0"
      }
    },
    FilterExpression: "storyID = :v1",
    TableName: process.env.API_RECEIPTAPI_PAGETABLE_NAME,
  };
  const pages = await ddb.scan(params).promise();
  console.log(JSON.stringify(pages, null, 2));

  // Make a copy of each of them
  for (const page of pages["Items"]) {
    page.owner = {S: userName};
    page.id = {S: uuidv4()};
    page.storyID = story.id;
    page.updatedAt = {S: date.toISOString()};

    console.debug("Going to put item: ", JSON.stringify(page, null, 2));
    await ddb.putItem({
        Item: page,
        TableName: process.env.API_RECEIPTAPI_PAGETABLE_NAME
    }).promise();
  }
}

exports.handler = async (event) => {
    const date = new Date();
    console.log("Add example story function: ", event);
    const response = {
        statusCode: 200,
    };

    try {
      // Retrieving the story with id 0 from the database
      const item = await ddb.getItem({
        TableName: process.env.API_RECEIPTAPI_STORYTABLE_NAME,
        Key: {
          id: {S: "0"}
        }
      }).promise();

      if (item && item.Item) {
        // Using the JSON.stingify/parse method to do a deep copy
        const story = JSON.stringify(item.Item, null, 2);
        console.debug("Retrieved story", story);
        const newStory = await modifyStory(JSON.parse(story), date, event.userName);

        console.debug("Going to put item: ", JSON.stringify(newStory, null, 2));
        await ddb.putItem({
          Item: newStory,
          TableName: process.env.API_RECEIPTAPI_STORYTABLE_NAME
        }).promise();
        response.body = {
          message: 'Created example story successfully',
          storyId: newStory.id
        };
        console.log("Success");
      } else {
        response.statusCode = 500;
        response.body = 'Could not retrieve example story, no story with id 0';
      }
    } catch (err) {
      console.log("Error", err);
      response.statusCode = 500;
      response.body = 'Error occured while creating the example story: ' + JSON.stringify(err);
    }

    if (response.statusCode === 200) {
      return response;
    } else {
      throw Error(JSON.stringify(response, null, 2));
    }
};
