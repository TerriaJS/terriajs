!!! warning

	We haven't used Docker for TerriaMap deployments in quite some time, so the instructions below are likely to be incorrect or outdated.  If you try it, we'd like to hear about your experiences on the [forum](https://groups.google.com/forum/#!forum/terriajs)

If you intend to deploy using docker, Dockerfiles have been provided for nationalmap and varnish. There are currently no hosted builds of these images. To build and deploy these docker images locally:

```bash
npm install
gulp release

# Build the application server image.
sudo docker build -t nationalmap/backend .

# Build the varnish image.
sudo docker build -t nationalmap/varnish varnish/

# Start the backend image you built.
sudo docker run -d -p 3001 --name nationalmap nationalmap/backend

# Start the varnish image you built.
sudo docker run -d -p 80:80 --name varnish --link nationalmap:nm nationalmap/varnish
```

This exposes varnish on port 80. Port 3001 for nationalmap remains behind docker's NAT. If you wish to interact with it directly change
```
-p <internal port>
```

with

```
-p <external port>:<internal port>
```

for this component.

There is also a docker_release.sh bash script available that will carry out these commands and post to an AWS instance.  If you are not deploying on AWS you can use the script as a starting point for creating your own script.

```
    Syntax: deploy_release pem_file host_name_or_ip
    example: deploy_release login.pem 54.79.62.244
```

Some handy commands:


```bash
# If you want to avoid using sudo on every docker command (log out and log in after)
sudo groupadd docker
sudo gpasswd -a ${USER} docker

# If you want to open a shell into the running docker container, you can use this command:
sudo docker run -ti nationalmap/backend /bin/bash

# To remove all containers
sudo docker rm $(sudo docker ps -a -q)

# To remove all images
sudo docker rmi $(sudo docker images -a -q)

# To save created images to a tar file
sudo docker save nationalmap/backend > nm_backend.tar
sudo docker save nationalmap/varnish > nm_varnish.tar

# And to load them back in
sudo docker load < nm_backend.tar
sudo docker load < nm_varnish.tar
```

If you're deploying varnish to an environment with less than 25GB on the root file system, or for whatever reason you want to specify the location of the cache file e.g. using an EBS volume, you can set the path for that:

```
docker run -d -p 80:80 --name varnish -v <cache-dir>:/mnt/cache/varnish --link nationalmap:nm nationalmap/varnish
```

The current release with ubuntu 14.04 is rather old and is missing some useful commands.  To update to the most recent of release of Docker, use the commands below from [here](http://www.ubuntuupdates.org/ppa/docker?dist=docker).

```
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 36A1D7869245C8950F966E92D8576A8BA88D21E9
sudo sh -c "echo deb https://get.docker.io/ubuntu docker main > /etc/apt/sources.list.d/docker.list"
sudo apt-get update
sudo apt-get install lxc-docker
```