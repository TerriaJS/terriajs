
const storyToInitfile = (story, pages) => {
  return {
    version: "0.0.05",
    initSources: [
      {
        initFragment: "receipt"
      },
      {
        catalog: []
      },
      {
        sharedCatalogMembers: {}
      },
      {
        initialCamera: {},
        homeCamera: {},
        baseMapName: "Positron (Light)",
        viewerMode: "3d",
        currentTime: {
          dayNumber: 2459005,
          secondsOfDay: 77933
        },
        showSplitter: false,
        splitPosition: 0.5
      },
      {
        stories: convertStoryPages(story, pages)
      }
    ]
  };
};

const convertStoryPages = (story, pages) => {
  const makeUrl = pageID => `https://receipt-stories-bucket.s3.eu-central-1.amazonaws.com/stories/story_${story.id}/page_${pageID}/index.html`;
  return pages.map(page => {
    const camera = JSON.parse(page.camera);
    return {
      storyTitle: story.title,
      pageTitle: page.title,
      text: `<div class=\"iframe-container\"><iframe src=\"${makeUrl(page.id)}\" allow=\"accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture\"></iframe></div>`,
      id: page.id,
      sector: story.sectors[0].toLowerCase(),
      shareData: {
        initSources: [
          {
            catalog: []
          },
          {
            sharedCatalogMembers: {}
          },
          {
            initialCamera: camera, //TODO: is this the corrector format or do we need pos/dir/up?
            homeCamera: camera,
            baseMapName: "Positron (Light)",
            viewerMode: "3d",
            currentTime: {
              dayNumber: 2459005,
              secondsOfDay: 77933
            },
            showSplitter: false,
            splitPosition: 0.5
          }
        ]
      }
    };
  });
};

const replaceBucketUrls = (html, sourceBucket, targetBucket, targetKey) => {
  // Tokens in regex: (https prefix), (bucket name), (amazon host),
  //                  (directory/key), (filename), (query params), (closing quote)
  // Note the escaping (double) backslashes in the string version of the regex
  // https://regex101.com/r/dQAHUh/2
  // /"(https:\/\/)(receipt-storycontent163903-devel)(\.s3.*?amazonaws\.com\/)(.*?\/)(.*?)(\?.*?)?"/
  const regexString = `"(https:\\/\\/)(${sourceBucket})(\\.s3.*?amazonaws\\.com\\/)(.*?\\/)(.*?)(\\?.*?)?"`;
  const bucketRegex = new RegExp(regexString, 'g');
  return html.replace(bucketRegex, `"$1${targetBucket}$3${targetKey}/$5"`);
};

const pageToHTML = page => {
  const content = page.scenarios[0].content; // TODO: fix scenarios schema 
  return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title}</title>
  <link href="../../css/storylines_styling.css" type="text/css" rel="stylesheet"/>
</head>

<body>
${content}

<!-- Tooltips -->
<script src="https://unpkg.com/@popperjs/core@2"></script>
<script src="https://unpkg.com/tippy.js@6"></script>
<script src="../../js/tooltips.js"></script>
</body>
</html>
`;
};

const updateHotspots = (hotspots, hotspotLocation, sector, story) => {
  // Find existing or create new feature
  let feature = hotspots.features.find(item => item['rc-story-id'] === story.id);
  if (feature === undefined) {
    feature = {
      "type": "Feature",
      "properties": {
        "marker-color": "#999",
        "marker-size": "large",
        "marker-symbol": "circle",
        "rc-type": "hotspot",
        "rc-sector": sector,
        "rc-title": story.title,
        "rc-description": story.description,
        "rc-story-id": story.id
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          hotspotLocation.longitude,
          hotspotLocation.latitude
        ]
      }
    };
    hotspots.features.push(feature);
  }
  else {
    feature.properties['rc-sector'] = sector;
    feature.properties['rc-title'] = story.title;
    feature.properties['rc-description'] = story.description;
    feature.properties['rc-story-id'] = story.id;
    feature.geometry.coordinates = [
      hotspotLocation.longitude,
      hotspotLocation.latitude
    ];
  }
};

module.exports = { storyToInitfile, pageToHTML, replaceBucketUrls, updateHotspots };
