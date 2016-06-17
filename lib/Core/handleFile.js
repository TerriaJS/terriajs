import defined from 'terriajs-cesium/Source/Core/defined';
import raiseErrorOnRejectedPromise from './../Models/raiseErrorOnRejectedPromise';
import readJson from './readJson';
import when from 'terriajs-cesium/Source/ThirdParty/when';
import createCatalogItemFromFileOrUrl from './../Models/createCatalogItemFromFileOrUrl';
import addUserCatalogMember from './../Models/addUserCatalogMember';
import getDataType from './getDataType';
import TerriaError from './../Core/TerriaError';

function handleFile(e, terria, callback) {
    const files = e.target.files;
    const dataType = getDataType().localDataType[0];
    if (!defined(files)) {
        terria.error.raiseEvent(new TerriaError({
                sender: this,
                title: 'Fail to read file',
                message: 'file api not supported.'
            }));
    }

    if (files.length > 0) {
        const promises = [];

        for (let i = 0; i < files.length; ++i) {
            const file = files[i];
            terria.analytics.logEvent('uploadFile', 'browse', file.name);
            if (file.name.toUpperCase().indexOf('.JSON') !== -1) {
                raiseErrorOnRejectedPromise(terria, readJson(file).then((json)=>{
                    //if (that.props.allowDropInitFiles && (json.catalog || json.services)) {
                    if ((json.catalog || json.services)) {
                        // This is an init file.
                        return terria.addInitSource(json);
                    }
                    promises.push(addUserCatalogMember(terria, createCatalogItemFromFileOrUrl(terria, file, dataType, true)));
                }));
            } else {
                promises.push(addUserCatalogMember(terria, createCatalogItemFromFileOrUrl(terria, file, dataType, true)));
            }
        }
        if(promises.length > 0) {
            when.all(promises, () => {
                const userCatalog = terria.catalog.userAddedDataGroup;
                if(typeof callback === 'function'){
                    callback(userCatalog);
                }
            });
        }
    }
}

module.exports = handleFile;
