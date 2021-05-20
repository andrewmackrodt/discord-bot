################################################################################
# Stage 1 : Create the dist bundle
################################################################################
FROM node:14-alpine AS dist
WORKDIR /opt/app
COPY package*.json /opt/app/
RUN npm ci --silent --no-progress
COPY . /opt/app/
RUN npm run build --silent

################################################################################
# Stage 2 : Install runtime dependencies and copy the dist bundle
################################################################################
FROM node:14-alpine
RUN apk add --no-cache font-noto graphicsmagick imagemagick tini
COPY --from=dist /opt/app/dist/ /opt/app
WORKDIR /opt/app
ENV NODE_ENV=production
ENTRYPOINT ["/sbin/tini", "--", "node", "index"]
