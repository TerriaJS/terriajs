#!/bin/sh

sudo rm /var/lib/tomcat7/webapps/admin_bnds/data/shape_files/*.*
rm FID_*.*

for file in *.zip
do
    unzip -o $file
done 

for file in *.shp
do 
    srcfile=${file%.*}
    destfile=FID_"$srcfile"
    echo "Making new shape file for: $srcfile"
    ogr2ogr -overwrite -preserve_fid "$destfile".shp "$srcfile".shp -sql "SELECT FID, * FROM '$srcfile'"
    sudo cp "$destfile".* /var/lib/tomcat7/webapps/admin_bnds/data/shape_files/
done

sudo chown -hR tomcat7:tomcat7 /var/lib/tomcat7/webapps/admin_bnds/data

