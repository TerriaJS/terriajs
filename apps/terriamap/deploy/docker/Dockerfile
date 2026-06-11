# Docker image for the primary terria map application server
FROM node:20

RUN mkdir -p /usr/src/app && mkdir -p /etc/config/client
WORKDIR /usr/src/app/component
COPY . /usr/src/app

EXPOSE 3001
ENV NODE_ENV=production
CMD [ "node", "./node_modules/terriajs-server/lib/app.js", "--config-file", "serverconfig.json" ]
