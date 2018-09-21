function canBeDeleted(catalogMember) {
    if(catalogMember.isUserSupplied && catalogMember.parent){
      if (catalogMember.parent.name === catalogMember.terria.catalog.userAddedDataGroup.name) {
          return true;
      }
    }
    return false;
}

export default canBeDeleted;
