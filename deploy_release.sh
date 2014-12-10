#!/bin/bash

if [ $# -ne 2 ]
  then
    echo " Syntax: deploy_release pem_file host_name_or_ip"
    echo "  example: deploy_release login.pem 54.79.62.244"
    exit
fi

echo Building NM
npm install
git submodule update
gulp release

echo Initialize Docker
sudo docker rm $(sudo docker ps -a -q)
sudo docker rmi $(sudo docker images -a -q)

echo Building Docker Images
sudo docker build -t nationalmap/backend .
sudo docker build -t nationalmap/varnish varnish/

echo Saving Docker Files
sudo docker save nationalmap/backend > nm_backend.tar
sudo docker save nationalmap/varnish > nm_varnish.tar

echo Upload Docker Files
scp -i $1 nm_backend.tar ubuntu@$2:/home/ubuntu
scp -i $1 nm_varnish.tar ubuntu@$2:/home/ubuntu

echo Run this command to log into the instance

echo ssh -i $1 ubuntu@$2

echo Run these commands on new instance to start nm

echo sudo apt-get install -y docker.io

echo sudo docker load < nm_backend.tar
echo sudo docker load < nm_varnish.tar

echo sudo docker run -d -p 3001 --name nationalmap nationalmap/backend
echo sudo docker run -d -p 80:80 --name varnish --link nationalmap:nm nationalmap/varnish


