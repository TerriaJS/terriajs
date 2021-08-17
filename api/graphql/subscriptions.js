/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateStory = /* GraphQL */ `
  subscription OnCreateStory($owner: String!) {
    onCreateStory(owner: $owner) {
      id
      authors {
        id
        full_name
        affiliation
      }
      title
      shortDescription
      description
      hotspotlocation {
        latitude
        longitude
      }
      sectors
      catalog {
        id
        json
      }
      image {
        id
        url
        caption
        alt
      }
      pages {
        items {
          id
          storyID
          title
          section
          camera
          baseMapName
          viewer_mode_3d
          pageNr
          createdAt
          updatedAt
          owner
        }
        nextToken
      }
      microstories {
        id
        authors {
          id
          full_name
          affiliation
        }
        title
        shortDescription
        description
        hotspotlocation {
          latitude
          longitude
        }
        sectors
        catalog {
          id
          json
        }
        image {
          id
          url
          caption
          alt
        }
        pages {
          nextToken
        }
        microstories {
          id
          title
          shortDescription
          description
          sectors
          state
          createdAt
          updatedAt
          owner
        }
        state
        createdAt
        updatedAt
        owner
      }
      state
      createdAt
      updatedAt
      owner
    }
  }
`;
export const onUpdateStory = /* GraphQL */ `
  subscription OnUpdateStory($owner: String!) {
    onUpdateStory(owner: $owner) {
      id
      authors {
        id
        full_name
        affiliation
      }
      title
      shortDescription
      description
      hotspotlocation {
        latitude
        longitude
      }
      sectors
      catalog {
        id
        json
      }
      image {
        id
        url
        caption
        alt
      }
      pages {
        items {
          id
          storyID
          title
          section
          camera
          baseMapName
          viewer_mode_3d
          pageNr
          createdAt
          updatedAt
          owner
        }
        nextToken
      }
      microstories {
        id
        authors {
          id
          full_name
          affiliation
        }
        title
        shortDescription
        description
        hotspotlocation {
          latitude
          longitude
        }
        sectors
        catalog {
          id
          json
        }
        image {
          id
          url
          caption
          alt
        }
        pages {
          nextToken
        }
        microstories {
          id
          title
          shortDescription
          description
          sectors
          state
          createdAt
          updatedAt
          owner
        }
        state
        createdAt
        updatedAt
        owner
      }
      state
      createdAt
      updatedAt
      owner
    }
  }
`;
export const onDeleteStory = /* GraphQL */ `
  subscription OnDeleteStory($owner: String!) {
    onDeleteStory(owner: $owner) {
      id
      authors {
        id
        full_name
        affiliation
      }
      title
      shortDescription
      description
      hotspotlocation {
        latitude
        longitude
      }
      sectors
      catalog {
        id
        json
      }
      image {
        id
        url
        caption
        alt
      }
      pages {
        items {
          id
          storyID
          title
          section
          camera
          baseMapName
          viewer_mode_3d
          pageNr
          createdAt
          updatedAt
          owner
        }
        nextToken
      }
      microstories {
        id
        authors {
          id
          full_name
          affiliation
        }
        title
        shortDescription
        description
        hotspotlocation {
          latitude
          longitude
        }
        sectors
        catalog {
          id
          json
        }
        image {
          id
          url
          caption
          alt
        }
        pages {
          nextToken
        }
        microstories {
          id
          title
          shortDescription
          description
          sectors
          state
          createdAt
          updatedAt
          owner
        }
        state
        createdAt
        updatedAt
        owner
      }
      state
      createdAt
      updatedAt
      owner
    }
  }
`;
export const onCreatePage = /* GraphQL */ `
  subscription OnCreatePage($owner: String!) {
    onCreatePage(owner: $owner) {
      id
      storyID
      title
      section
      camera
      baseMapName
      currentTime {
        dayNumber
        secondsOfDay
      }
      viewer_mode_3d
      scenarios {
        id
        ssp
        content
        split_map
        enabled_catalog_items {
          id
          json
        }
      }
      pageNr
      createdAt
      updatedAt
      owner
    }
  }
`;
export const onUpdatePage = /* GraphQL */ `
  subscription OnUpdatePage($owner: String!) {
    onUpdatePage(owner: $owner) {
      id
      storyID
      title
      section
      camera
      baseMapName
      currentTime {
        dayNumber
        secondsOfDay
      }
      viewer_mode_3d
      scenarios {
        id
        ssp
        content
        split_map
        enabled_catalog_items {
          id
          json
        }
      }
      pageNr
      createdAt
      updatedAt
      owner
    }
  }
`;
export const onDeletePage = /* GraphQL */ `
  subscription OnDeletePage($owner: String!) {
    onDeletePage(owner: $owner) {
      id
      storyID
      title
      section
      camera
      baseMapName
      currentTime {
        dayNumber
        secondsOfDay
      }
      viewer_mode_3d
      scenarios {
        id
        ssp
        content
        split_map
        enabled_catalog_items {
          id
          json
        }
      }
      pageNr
      createdAt
      updatedAt
      owner
    }
  }
`;
