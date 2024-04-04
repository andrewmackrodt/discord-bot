################################################################################
# Builder
################################################################################
FROM node:20-alpine AS builder
RUN apk add --no-cache g++ make python3
RUN NPM_CONFIG_UPDATE_NOTIFIER=false npm i -g json
COPY package.json pnpm-lock.yaml /opt/app/
WORKDIR /opt/app
RUN corepack enable
RUN pnpm install --frozen-lockfile
RUN mkdir out \
 && cat package.json \
     | json -q -e 'this.scripts = { "typeorm": "typeorm -d src/db.js", "start": "node index.js" }; delete this.devDependencies' \
     | tee out/package.json >/dev/null \
 && cp pnpm-lock.yaml out/ \
 && cd out \
 && pnpm install --no-optional --prefer-offline --prod
COPY . /opt/app/
RUN pnpm run build:compile --silent

################################################################################
# Target
################################################################################
FROM node:20-alpine
RUN apk add --no-cache imagemagick graphicsmagick tini
COPY --from=builder /opt/app/out/ /opt/app/
WORKDIR /opt/app
RUN mkdir -p /config \
 && chown node:nobody /config \
 && chmod 2770 /config \
 && ln -s /config /opt/app/config
VOLUME /config
USER node
ENTRYPOINT ["/sbin/tini", "--", "node", "--no-warnings", "index.js"]
