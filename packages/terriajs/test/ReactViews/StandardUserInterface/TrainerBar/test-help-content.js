export default {
  title: "Step by step guide",
  itemName: "stepbystepguide",
  paneMode: "trainer",
  markdownText:
    "# Step by step guide\n\nLaunch a step by step guide for various popular workflows below:",
  trainerItems: [
    {
      title: "Adding satellite imagery",
      footnote:
        "Important: Satellite imagery can take a little while to load so please be patient. If images don’t seem to be loading, zoom out a little bit",
      steps: [
        {
          title: "Find a location to view satellite imagery",
          markdownDescription:
            "- Use the location search or zoom and pan around the map using your mouse or the zoom controls"
        },
        {
          title:
            'Find satellite images in the data catalogue using "Add Data" button',
          markdownDescription:
            '- Click "Explore map data" and navigate to Satellite images and press "Add Data"\n- Select your satellite option: Landsat or Sentinel, what resolution and daily or composite images. This can depend on resolution of the image you need (10m or 25m) and whether you want daily, 16 day composite, or annual average images'
        },
        {
          title: "Filter images to find satellite imagery",
          markdownDescription:
            "- Filter images by location to quickly find satellite images for that location\n - Satellites circle the globe many times a day. You can expect satellite imagery to be available for one location every two weeks\n - If you haven't already selected your point of interest on the map, zoom in to select one. You will see the filter applied in blue in the Workbench on the left"
        },
        {
          title: "Select a time and date",
          markdownDescription:
            "- Use the date picker to select a time and date. Cycle backwards through previous years using the back arrow\n - Choose another date if your imagery is obscured by cloud. You can quickly cycle back and forward using the arrows next to the date picker"
        }
      ]
    },
    {
      title: "View and compare time-series data",
      footnote:
        "Important: Any time series data can be compared using the Split Screen Mode, not just satellite imagery",
      steps: [
        {
          title: "Add a time series data set to the map",
          markdownDescription:
            "- Satellite imagery is a good example of time series data, with many satellites going back decades\n- Find your location of interest and filter available imagery by this location\n-See our Adding Satellite Imagery to the Map guide for more"
        },
        {
          title: "Select the time and date",
          markdownDescription:
            "- In the workbench on the left, select the time and date which will open the date picker\n- Select a year, month and date, or navigate back to other years and even centuries using the back arrow\n- Available dates appear in blue"
        },
        {
          title: "Compare different dates at one location",
          markdownDescription:
            "- From the 3 dots drop-down menu in the workbench, press 'Compare' to activate Split Screen Mode\n- A duplicate copy of your dataset will appear in the workbench\n- Choose the dates you want to compare on the left and right of the screen\n- Drag the slider using the white button to swipe and compare the two image dates"
        },
        {
          title: "Close Split Screen Mode",
          markdownDescription:
            "- Escape the Split Screen Mode by pressing the 'x' of Split Screen Mode title in the workbench\n- Remove the duplicate copy of your dataset in the workbench using the 3 dots drop-down menu"
        }
      ]
    },
    {
      title:
        "Detecting the change (difference) between data values at two points in time (e.g. NDVI or Burn Extent)",
      steps: [
        {
          title: "Add a Difference-enabled dataset to the map",
          markdownDescription:
            "- This includes the dataset Delta Blended Service\n- Search or scroll to find the location where you want to perform change detection"
        },
        {
          title: "Turn on Difference mode",
          markdownDescription:
            "-   Behind the 3 dots in the workbench, select the menu item 'Difference'\n-   Difference mode will activate, splitting the screen and adding new options on the left"
        },
        {
          title: "Select your Difference variables",
          markdownDescription:
            "-   Use the date pickers at the bottom to choose your dates for screen A and B\n -   The Preview style defaults to True colour to help you find cloud-free images, change if required\n -   If you have previously searched for a location, this will be used to refine the imagery to only show available images for that location\n -   If you didn't search for a location, select a point on the map in your area of interest to refine the imagery for that area only\n -   Select your Difference Output, e.g. NDVI\n -   Select Generate Change Detection"
        },
        {
          title: "View the change detection results on-screen",
          markdownDescription:
            "-   The legend for the Difference calculation will appear on the left to help your analysis\n -   You can change dates using the date pickers to toggle between dates and a new Change Detection calculation will be run\n -   Close or exit Difference mode when you are finished your analysis"
        }
      ]
    }
  ],
  icon: "oneTwoThree"
};
