import { AmplifyS3Image } from "@aws-amplify/ui-react";
import { API, graphqlOperation, Storage } from "aws-amplify";
import PropTypes from "prop-types";
import { default as React, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useHistory, useParams, withRouter } from "react-router-dom";
import { v5 as uuidv5 } from "uuid";
import { updateStory } from "../../../../api/graphql/mutations";
import { getStory } from "../../../../api/graphql/queries";
import sectors from "../../../Data/Sectors.js";
import RCHotspotSelector from "../RCHotspotSelector/RCHotspotSelector";
import RCPageList from "../RCPageList/RCPageList";
import RCSectorSelection from "./RCSectorSelection/RCSectorSelection";
import Styles from "./RCStoryEditor.scss";
function RCStoryEditor(props) {
  const [story, setStory] = useState(null);
  const [storyPages, setStoryPages] = useState([]);
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [selectedSectors, setSelectedSectors] = useState([]);
  const [hotspotPoint, setHotspotPoint] = useState(null);
  const [images, setImages] = useState([]);
  const [message, setMessage] = useState("");
  const [sectorRequiredMessage, setSectorRequiredMessage] = useState("*");
  const history = useHistory();
  const viewState = props.viewState;

  // get the story id from url
  const { id } = useParams();

  const [files, setFiles] = useState([]);

  // Fetch story details with id
  useEffect(() => {
    try {
      API.graphql(graphqlOperation(getStory, { id: id })).then(story => {
        const data = story.data.getStory;
        setStory(data);
        setTitle(data.title);
        setShortDescription(data.shortDescription);
        setSelectedSectors(data.sectors);
        setHotspotPoint(data.hotspotlocation);
        setImages([data.image]);
        setStoryPages(data.pages.items);
      });
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(
    () => () => {
      // Make sure to revoke the data uris to avoid memory leaks
      files.forEach(file => URL.revokeObjectURL(file.preview));
    },
    [files]
  );

  const onDrop = acceptedFiles => {
    setFiles(
      acceptedFiles.map(file =>
        Object.assign(file, { preview: URL.createObjectURL(file) })
      )
    );
  };
  const updateStoryPages = pages => {
    setStoryPages(pages);
  };
  const { getRootProps, getInputProps } = useDropzone({
    accept: "image/*",
    onDrop: onDrop,
    multiple: false
  });

  const thumbs = files.map(file => (
    <div className={Styles.thumb} key={file.name}>
      <div className={Styles.thumbInner}>
        <img src={file.preview} className={Styles.thumbnail} />
      </div>
    </div>
  ));

  const onTitleChanged = event => {
    setTitle(event.target.value);
  };
  const onDescriptionChanged = event => {
    setShortDescription(event.target.value);
  };
  const onSectorChanged = event => {
    const sector = event.target.value
      .split(" ")
      .join("_")
      .toUpperCase();
    // check if the check box is checked or unchecked
    if (event.target.checked) {
      // add the  value of the checkbox to selectedSectors array
      setSelectedSectors([...selectedSectors, sector]);
    } else {
      // or remove the value from the unchecked checkbox from the array
      setSelectedSectors(
        selectedSectors.filter(selectedSector => selectedSector !== sector)
      );
    }
  };

  const onSave = () => {
    if (selectedSectors.length <= 0) {
      setSectorRequiredMessage("Select at least 1 sector");
    } else {
      saveStory();
    }
  };

  const saveStory = async () => {
    // If a new image is supplied we push it to s3 and
    // update the references here
    const image = story.image || {};
    if (files.length > 0) {
      const file = files[0];

      const fileExt = file.name.split(".").pop();
      const imageid = uuidv5(file.name, story.id);

      try {
        // remove the old image
        Storage.remove(image.id);
      } catch (error) {
        // An error here means it does not exist?
        console.debug("Error removing old file: ", error);
      }

      try {
        // upload new image
        const result = await Storage.put(
          `story-${story.id}/${imageid}.${fileExt}`,
          file
        );

        image.id = result.key;
        image.url = await Storage.get(result.key);

        setImages([image]);
        setFiles([]);
      } catch (error) {
        setMessage("Error uploading file: ", error);
      }
    }

    const storyDetails = {
      id: story.id,
      title: title,
      shortDescription: shortDescription,
      sectors: selectedSectors,
      hotspotlocation: hotspotPoint,
      image: image
      // TODO: pages: pages
    };
    return API.graphql({
      query: updateStory,
      variables: { input: storyDetails }
    }).then(response => {
      if (response.data.updateStory) {
        setMessage("Story details saved successfully!");
      } else {
        setMessage("Error", response.errors[0].message);
      }
    });
  };

  return (
    <div className={Styles.RCStoryEditor}>
      <div className={Styles.container}>
        <h3>Edit your story</h3>
        <button
          className={Styles.RCButton}
          onClick={() => history.push("/builder")}
        >
          Back
        </button>
      </div>
      <form className={Styles.RCStoryCard}>
        <div className={Styles.group}>
          <input
            type="text"
            required
            defaultValue={title}
            onChange={onTitleChanged}
          />
          <span className={Styles.highlight} />
          <span className={Styles.bar} />
          <label className={title && Styles.topLabel}>Story Title</label>
        </div>
        <div className={Styles.group}>
          <textarea
            defaultValue={shortDescription}
            onChange={onDescriptionChanged}
          />
          <span className={Styles.highlight} />
          <span className={Styles.bar} />
          <label className={shortDescription && Styles.topLabel}>
            Short Description
          </label>
        </div>
        <RCSectorSelection
          sectors={sectors}
          selectedSectors={selectedSectors}
          onSectorSelected={onSectorChanged}
          sectorRequiredMessage={sectorRequiredMessage}
        />

        <RCHotspotSelector
          hotspotPoint={hotspotPoint}
          setHotspotPoint={setHotspotPoint}
          viewState={viewState}
        />

        <div className={Styles.group}>
          <label className={Styles.topLabel}>Image</label>
          {images.map(image => {
            return (
              <AmplifyS3Image
                key={image.id}
                className={Styles.image}
                imgKey={image.id}
              />
            );
          })}
          <section className={Styles.dropContainer}>
            <div {...getRootProps({ className: "dropzone" })}>
              <input {...getInputProps()} />
              <p>Drag 'n' drop some files here, or click to select files</p>
            </div>
            <aside className={Styles.thumbsContainer}>{thumbs}</aside>
          </section>
        </div>

        <div className={Styles.group}>
          <RCPageList pages={storyPages} updatePages={updateStoryPages} />
        </div>

        <div className={Styles.container}>
          <button className={Styles.RCButton} onClick={onSave}>
            Save
          </button>
          <label>{message}</label>
        </div>
      </form>
    </div>
  );
}

RCStoryEditor.propTypes = {
  viewState: PropTypes.object
};
export default withRouter(RCStoryEditor);
