import { Storage } from "aws-amplify";
import { v5 as uuidv5 } from "uuid";

export default class UploadAdapter {
  constructor(loader, storyID) {
    // The file loader instance to use during the upload.
    this.loader = loader;
    this.storyID = storyID;
    this.uploadPromise = null;
  }

  // Starts the upload process.
  upload() {
    // Return a promise that will be resolved when the file is uploaded.
    return this.loader.file.then(
      file =>
        new Promise((resolve, reject) => {
          const storyID = this.storyID;
          const fileExt = file.name.split(".").pop();
          const imageid = uuidv5(file.name, storyID);

          try {
            this.uploadPromise = Storage.put(
              `story-${storyID}/${imageid}.${fileExt}`,
              file
            ).then(result => {
              const key = result.key;
              Storage.get(key).then(url => {
                resolve({ default: url, key });
              });
            });
          } catch (error) {
            reject(`Error uploading file: ${error}`);
          }
        })
    );
  }

  // Aborts the upload process.
  abort() {
    if (this.uploadPromise) {
      Storage.cancel(this.uploadPromise, "File upload was cancelled");
    }
  }
}
