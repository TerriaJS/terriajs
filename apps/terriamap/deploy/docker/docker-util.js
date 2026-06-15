exports.getVersions = function getVersions(local, version) {
  return version.length > 0
    ? version
    : [
        !local && process.env.npm_package_version
          ? process.env.npm_package_version
          : "latest"
      ];
};

exports.getName = function getName(name) {
  if (name && typeof name === "string") {
    return name;
  }
  return process.env.npm_package_config_docker_name
    ? process.env.npm_package_config_docker_name
    : process.env.npm_package_name
      ? "data61/magda-" + process.env.npm_package_name.split("/")[1]
      : "UnnamedImage";
};

exports.getTags = function getTags(tag, local, repository, version, name) {
  if (tag === "auto") {
    return exports.getVersions(local, version).map((version) => {
      const tagPrefix = exports.getRepository(local, repository);
      const imageName = exports.getName(name);

      return tagPrefix + imageName + ":" + version;
    });
  } else {
    return tag ? [tag] : [];
  }
};

exports.getRepository = function getRepository(local, repository) {
  return (repository && repository + "/") || (local ? "localhost:5000/" : "");
};
