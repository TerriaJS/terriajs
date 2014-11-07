# Docker image for the primary national map application server
FROM node:0.10-onbuild
MAINTAINER briely.marum@nicta.com.au
RUN apt-get update && apt-get install -y gdal-bin
EXPOSE 3001