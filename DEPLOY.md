# Deploying to Toolforge

zonestamp runs on the Toolforge Build Service (`heroku/nodejs` buildpack). The build runs `npm ci` and
`npm run heroku-build` (Vite build in `toolforge` mode); `Procfile` starts `server.js`, a dependency-free
static server with SPA fallback to `index.html`.

## Local test

```sh
nvm use 22
npm run serve:prod                      # build + serve on :8000
# or exactly as Toolforge builds it:
pack build zonestamp-test --builder heroku/builder:24 --trust-builder
docker run --rm -p 8000:8000 -e PORT=8000 zonestamp-test
```

`pack` install: `brew install buildpacks/tap/pack`.

## First deploy

```sh
ssh login.toolforge.org
become zonestamp
toolforge build start https://github.com/hartman/zonestamp --ref main
toolforge build logs -f
toolforge webservice stop
mv ~/.lighttpd.conf ~/.lighttpd.conf.disabled
toolforge webservice buildservice start --mount=none --health-check-path /healthz
toolforge webservice buildservice logs -f
```

`service.template` holds the same settings for `toolforge webservice start`.

## Update

Tag every deploy: `--ref` accepts branches and tags, not commit hashes.

```sh
git tag deploy-YYYY-MM-DD && git push origin main --tags
toolforge build start https://github.com/hartman/zonestamp --ref deploy-YYYY-MM-DD && toolforge webservice restart
```

## Rollback

```sh
toolforge build start https://github.com/hartman/zonestamp --ref deploy-<previous>
toolforge webservice restart
```

`toolforge build clean` removes old images when build quota runs low.

## Verify

```sh
BASE=https://zonestamp.toolforge.org
for p in / /1700000000 /foo /robots.txt /toolinfo.json /favicon.ico /healthz; do
  curl -s -o /dev/null -w "%{http_code} %{content_type} $p\n" "$BASE$p"; done
```
