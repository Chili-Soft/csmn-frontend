# frontend

## build webogram for Telegram integration

**Optional**. Webogram has already been built and placed at proper location.
Skip this section unless you want to rebuild or use another version of webogram

**Execute the following under project root**

1. clone webogram source
```bash
# currently we use v0.5.7 release. check and modify (if needed) the patch file accordingly if using another tag
git clone --depth 1 --branch v0.5.7 https://github.com/zhukov/webogram.git
```

2. build webogram
```bash
cd webogram/
git app
git apply ../webogram-patch.patch  # disable clickjacking protection to allow iframe embedding
npm install     # install deps
npm run build   # build webogram
# copy and cleanup
rm -rf ../public/tg/ && mkdir -p ../public/tg && cp -r dist/* ../public/tg/
cd .. && rm -r webogram/
```

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
