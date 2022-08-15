################################################################################
# Builder
################################################################################
FROM node:18-alpine AS builder
RUN apk add --no-cache g++ make python3
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
RUN npm i -g json
COPY package.json package-lock.json /opt/app/
WORKDIR /opt/app
RUN npm i --no-progress
RUN mkdir out && cat package.json \
  | json -q -e 'this.scripts = { "typeorm": "typeorm -d src/db.js", "start": "node index.js" }; delete this.devDependencies' \
  | tee out/package.json >/dev/null
RUN npm i --no-progress --omit=dev --package-lock-only --prefix=out/
RUN cd out \
 && npm i --no-progress --omit=dev
COPY . /opt/app/
RUN npm run build:compile --silent

################################################################################
# Target
################################################################################
FROM node:18-alpine
RUN apk add --no-cache graphicsmagick imagemagick tini
COPY --from=builder /opt/app/out/ /opt/app/
WORKDIR /opt/app
RUN mkdir -p /config \
 && ln -s /config /opt/app/config
VOLUME /config
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENTRYPOINT ["/sbin/tini", "--", "node", "index.js"]
