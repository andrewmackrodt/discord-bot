################################################################################
# Builder
################################################################################
FROM node:18-alpine AS builder
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
RUN npm i -g json
COPY package.json package-lock.json /opt/app/
WORKDIR /opt/app
RUN npm i --silent --no-progress \
 && mkdir out \
 && cat package.json \
      | json -q -e 'this.scripts = { "start": "node index.js" }; delete this.devDependencies' \
      | tee out/package.json >/dev/null \
 && npm i --silent --no-progress --omit=dev --package-lock-only --prefix=out/ \
 && cd out \
 && npm i --silent --no-progress --omit=dev
COPY . /opt/app/
RUN npm run build:compile --silent

################################################################################
# Target
################################################################################
FROM node:18-alpine
RUN apk add --no-cache font-noto graphicsmagick imagemagick tini
COPY --from=builder /opt/app/out/ /opt/app/
WORKDIR /opt/app
RUN mkdir -p /config \
 && ln -s /config /opt/app/config
VOLUME /config
ENV NODE_ENV=production
ENTRYPOINT ["/sbin/tini", "--", "node", "index.js"]
