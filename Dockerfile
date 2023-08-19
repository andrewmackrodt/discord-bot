################################################################################
# Stage 1 : Create the dist bundle
################################################################################
FROM node:18-alpine AS dist
WORKDIR /opt/app
COPY package*.json /opt/app/
RUN npm ci --silent --no-progress
COPY . /opt/app/
RUN npm run build --silent

################################################################################
# Stage 2 : Install runtime dependencies and copy the dist bundle
################################################################################
FROM node:18-alpine
RUN apk add --no-cache font-noto graphicsmagick imagemagick tini
COPY --from=dist /opt/app/dist/ /opt/app
WORKDIR /opt/app
RUN mkdir -p /config \
 && ln -s /config /opt/app/config
VOLUME /config
ENV NODE_ENV=production
ENTRYPOINT ["/sbin/tini", "--", "node", "index"]
