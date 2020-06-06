<template>
  <div id="app">
    <!-- <h1>{{ CSMN_TITLE }}</h1> -->
    <!-- <el-divider></el-divider> -->
    <div>
      <h1> {{ this.playerOptions.title }} </h1>
    </div>
    <br>
    <div id="player">
      <ArtplayerComponent v-if="this.configLoaded"
        :option="this.playerOptions"
        @getInstance="this.getInstance"
        :style="this.playerStyle"
      />
    </div>
    <br>
    <div>
      <h3>
        开始时间 {{ this.timestampToString(this.playerOptions.start) }}
      </h3>
    </div>

  </div>
</template>

<script>
import ArtplayerComponent from 'artplayer-vue';
import * as api from './api.js';

export default {
  name: 'app',
  components: {
    ArtplayerComponent
  },
  data () {
    return {
      CSMN_TITLE: 'ChiliSoft - Movie Night',
      playerOptions: {
        controls: [
          {
            position: 'right',
            html: '同步',
            // handler will be assigned after component mounted
            click: function() {},
          }
        ],
        icons: {
            loading: '/ploading.gif',
            state: '/state.png',
        },
        autoSize: true,
        setting: true,
        playbackRate: true,
        fullscreenWeb: true,
        fullscreen: true,
        localVideo: true,
        localSubtitle: true,
        subtitleOffset: true,
        pip: true,
        // will be replaced by server config
        title: '',
        start: 0,
        url: '',
        quality: [],
        subtitle: {
            url: '',
        },
        update_ts: 0,
        // END - will be replaced by server config
      },
      playerStyle: {
        width: '1280px',
        height: '720px',
        margin: '0 auto',
      },
      configLoaded: false,

      playerInstance: null,
    }
  },
  methods: {
    getInstance(ins) {
      console.log('get instance', ins);
      this.playerInstance = ins;
    },
    timestampToString(timestamp){
      const time = new Date(timestamp * 1000);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const year = time.getFullYear();
      const month = months[time.getMonth()];
      const date = time.getDate();
      const hour = time.getHours();
      const min = time.getMinutes();
      // const sec = time.getSeconds();
      let timeString = date + ' ' + month + ' ' + year;
      timeString += ' ' + (hour < 10 ? '0' + hour : hour) + ':' + (min < 10 ? '0' + min : min);
      return timeString;
    },
    onSyncProgress() {
      const start = this.playerOptions.start;
      if (!this.playerInstance || !start) return;
      const art = this.playerInstance;
      const jump_to = Date.parse(new Date()) * 0.001 - start;
      console.log(
        'current player time', art.currentTime,
        'sync start time', start,
        'current time', Date.parse(new Date()) * 0.001,
        'jump to', jump_to,
      );
      art.currentTime = jump_to;
    },
    async fetchConfigBg() {
      try {
        const rtn = await api.getConfig();
        const config = rtn.data;
        console.log('fetch config', rtn.data)

        const configTS = this.playerOptions.update_ts;
        const newConfigTS = config.update_ts;
        if (newConfigTS > configTS) {
          this.playerOptions.update_ts = newConfigTS;
          this.updatePlayerOption(config);
          this.$notify({
            title: '配置已更新',
            message: '如果有播放链接/CDN/字幕更新，请手动刷新页面',
            type: 'success'
          });
        }

        setTimeout(this.fetchConfigBg, 10000);
      } catch (e) {
        console.error('fetch config failed', e);
        setTimeout(this.fetchConfigBg, 30000);
      }
    },
    updatePlayerOption(config) {
      Object.assign(this.playerOptions, config);
      // post-processing
      const icons = this.playerOptions.icons;
      if (icons) {
        for (const k in this.playerOptions.icons) {
          const _url = this.playerOptions.icons[k];
          this.playerOptions.icons[k] = `<img src="${_url}">`;
        }
      }

      // add sync progress handler
      this.playerOptions.controls.forEach(
        (ctl) => {
          ctl.click = this.onSyncProgress;
        }
      )

      this.configLoaded = true;
      console.log(config);

    }
  },
  async mounted() {
    const rtn = await api.getConfig();
    const config = rtn.data;

    this.updatePlayerOption(config);

    this.fetchConfigBg();
  }
}
</script>

<style>

body {
  background-color: #0a0a0a;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: rgb(250, 223, 181);
  margin-top: 60px;
}

h1, h2 {
  font-weight: normal;
}

h1 {
  color: #e6c271;
  text-shadow: 0 0 0.3em rgb(250, 223, 181), 0 0 0.2em rgb(250, 223, 181)
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
