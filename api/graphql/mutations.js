/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createStory = /* GraphQL */ `
  mutation CreateStory(
    $input: CreateStoryInput!
    $condition: ModelStoryConditionInput
  ) {
    createStory(input: $input, condition: $condition) {
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
export const updateStory = /* GraphQL */ `
  mutation UpdateStory(
    $input: UpdateStoryInput!
    $condition: ModelStoryConditionInput
  ) {
    updateStory(input: $input, condition: $condition) {
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
export const deleteStory = /* GraphQL */ `
  mutation DeleteStory(
    $input: DeleteStoryInput!
    $condition: ModelStoryConditionInput
  ) {
    deleteStory(input: $input, condition: $condition) {
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
export const createPage = /* GraphQL */ `
  mutation CreatePage(
    $input: CreatePageInput!
    $condition: ModelPageConditionInput
  ) {
    createPage(input: $input, condition: $condition) {
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
        enabled_catalog_items
      }
      pageNr
      createdAt
      updatedAt
      owner
    }
  }
`;
export const updatePage = /* GraphQL */ `
  mutation UpdatePage(
    $input: UpdatePageInput!
    $condition: ModelPageConditionInput
  ) {
    updatePage(input: $input, condition: $condition) {
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
        enabled_catalog_items
      }
      pageNr
      createdAt
      updatedAt
      owner
    }
  }
`;
export const deletePage = /* GraphQL */ `
  mutation DeletePage(
    $input: DeletePageInput!
    $condition: ModelPageConditionInput
  ) {
    deletePage(input: $input, condition: $condition) {
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
        enabled_catalog_items
      }
      pageNr
      createdAt
      updatedAt
      owner
    }
  }
`;
