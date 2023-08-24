ARG NODE_VERSION 18
FROM node:$NODE_VERSION-alpine
RUN apk add --no-cache g++ git imagemagick make openssh-client python3
USER node
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENTRYPOINT ["sleep", "inf"]
