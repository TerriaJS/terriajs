#!/bin/bash

echo '*** Shell Script to Deploy NM'

if [ $# -ne 2 ]
  then
    echo " Syntax: deploy_release pem_file host_name_or_ip"
    echo "  example: deploy_release login.pem 54.79.62.244"
    exit
fi

echo '*** Building NM'
npm install
git submodule update
#update key
mv src/viewer/AusGlobeViewer.js src/viewer/AusGlobeViewer_orig.js
sed 's/BingMapsApi.defaultKey = undefined/BingMapsApi.defaultKey = "Aowa32_DmAxInFM948JlflrBYsiqRIm-SqH1-zp8Btp4Bk-9K6gMKkpUNbPnrSsk"/' src/viewer/AusGlobeViewer_orig.js >src/viewer/AusGlobeViewer.js
gulp release
mv -f src/viewer/AusGlobeViewer_orig.js src/viewer/AusGlobeViewer.js

echo '*** Initialize Docker'
sudo docker rm -f $(sudo docker ps -a -q)
sudo docker rmi -f $(sudo docker images -a -q)
rm nm_backend.tar
rm nm_varnish.tar

echo '*** Building Docker Images'
sudo docker build -t nationalmap/backend .
sudo docker build -t nationalmap/varnish varnish/

echo '*** Saving Docker Files'
sudo docker save nationalmap/backend > nm_backend.tar
sudo docker save nationalmap/varnish > nm_varnish.tar

echo '*** Uploading Docker Files to AWS'
scp -i $1 nm_backend.tar ubuntu@$2:/home/ubuntu
scp -i $1 nm_varnish.tar ubuntu@$2:/home/ubuntu

echo '*** Run this command to log into the instance'

echo "ssh -i $1 ubuntu@$2"

echo '*** Run these commands on new instance to start NM'

echo 'sudo apt-get install -y docker.io'

echo 'sudo docker rm -f $(sudo docker ps -a -q)'
echo 'sudo docker rmi -f $(sudo docker images -a -q)'
echo 'sudo docker load < nm_backend.tar'
echo 'sudo docker load < nm_varnish.tar'

echo 'sudo docker run -d -p 3001 --name nationalmap nationalmap/backend'
echo 'sudo docker run -d -p 80:80 --name varnish --link nationalmap:nm nationalmap/varnish'


