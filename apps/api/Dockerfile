# The API's image (docs/design-docs/mobile-app-and-api.md). Built from the repo root, so the workspace's lockfile and
# packages are in the context: docker build -f apps/api/Dockerfile .
# esbuild bundles the API and its dependencies into one file on the build platform, so the image holds no
# node_modules. Dependabot keeps the digest current in both FROM lines.

FROM --platform=$BUILDPLATFORM node:24-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f AS build
# The pnpm version pinned in package.json's packageManager field.
RUN npm install --global --ignore-scripts pnpm@12.10.1
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages/domain/package.json packages/domain/
RUN pnpm install --frozen-lockfile --filter @rcp/api...
COPY packages/domain/src packages/domain/src
COPY apps/api/src apps/api/src
RUN pnpm --filter @rcp/api build

FROM node:24-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f
# The API needs no package manager, and the ones in the base image carry their own vulnerabilities.
RUN apk add --no-cache tini \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /opt/yarn-* \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg
WORKDIR /app
# HOST is for the container's network: only Caddy, on the shared network, reaches the port.
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000
COPY --from=build /app/apps/api/dist/main.js ./main.js
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -q -O /dev/null http://127.0.0.1:3000/healthz || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "main.js"]
