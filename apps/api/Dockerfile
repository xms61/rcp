# The API's image (docs/design-docs/mobile-app-and-api.md). Built from the repo root, so the workspace's lockfile and
# packages are in the context: docker build -f apps/api/Dockerfile .
# esbuild bundles the API and its dependencies into one file on the build platform. The one exception is better-sqlite3,
# a native module: the image keeps its JavaScript and its prebuilt Alpine binaries, and nothing else from
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
COPY apps/api/drizzle apps/api/drizzle
RUN pnpm --filter @rcp/api build
# better-sqlite3 ships a prebuilt binary for each platform and needs no compiler. Keep the two Alpine (musl) ones; the
# runtime picks the one for its CPU.
RUN mkdir -p /out/node_modules \
  && cp -RL apps/api/node_modules/better-sqlite3 /out/node_modules/better-sqlite3 \
  && rm -rf /out/node_modules/better-sqlite3/deps /out/node_modules/better-sqlite3/src \
  && find /out/node_modules/better-sqlite3/prebuilds -type f ! -name 'linuxmusl-*' -delete

FROM node:24-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f
# The API needs no package manager, and the ones in the base image carry their own vulnerabilities. apk goes too,
# once tini is in.
RUN apk add --no-cache tini \
  && mkdir /data && chown node:node /data \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /opt/yarn-* \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg \
    /sbin/apk /etc/apk /lib/apk /usr/share/apk /var/cache/apk
WORKDIR /app
# HOST is for the container's network: only Caddy, on the shared network, reaches the port.
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    RCP_DB_PATH=/data/rcp.db
# The layout main.ts expects: the migrations in ../drizzle from the bundle.
COPY --from=build /app/apps/api/dist/main.js ./dist/main.js
COPY --from=build /app/apps/api/drizzle ./drizzle
COPY --from=build /out/node_modules ./node_modules
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -q -O /dev/null http://127.0.0.1:3000/healthz || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
