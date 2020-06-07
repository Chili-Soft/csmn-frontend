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
    <div>
      当前状态：{{ this.statusText }}
      <br>
      自动同步：{{ this.autoStartEnabled ? '已开启' : '已关闭' }}
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
            name: 'autoStartCtl',
            tag: 'auto-start',
            position: 'right',
            html: '自动同步开关',
            // handler will be assigned after component mounted
            click: function() {},
          },
          {
            name: 'syncCtl',
            tag: 'sync',
            position: 'right',
            html: '同步进度',
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
      playerCallbacks: {
        'auto-start': this.onToggleAutoStart,
        'sync': this.onSyncProgress,
      },
      autoStartEnabled: true,
      autoStartTimeoutCode: 0,
      statusText: '正在获取...',
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
    refreshStatusText() {
      const now = Math.round(new Date().getTime() / 1000.);
      const art = this.playerInstance;
      if (!art) {
        setTimeout(this.refreshStatusText, 1000);
        return;
      }
      const start_ts = this.playerOptions.start;
      const end_ts = start_ts + art.player.duration;
      console.log(
        '[refreshStatusText] now =', now,
        'start =', start_ts, 'duration =', art.player.duration, 'end = ', end_ts
      );
      if (art.player.duration === Infinity) {
        // fix: duration is Infinity before video loaded
        console.log('[refreshStatusText] incorrect duration. refresh later.');
        setTimeout(this.refreshStatusText, 500);
        return;
      }
      if (now < start_ts) {
        this.statusText = '尚未开始';
      } else if (now < end_ts) {
        this.statusText = '正在播放';
      } else {
        this.statusText = '已结束';
      }
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
    onToggleAutoStart() {
      console.log('onToggleAutoStart. current ', this.autoStartEnabled);
      if (this.autoStartEnabled) {
        this.autoStartEnabled = false;
        this.$message.info('自动播放：已关闭');
        clearTimeout(this.autoStartTimeoutCode);
      } else {
        this.autoStartEnabled = true;
        this.$message.success('自动播放：已开启');
        this.onAutoStartEnabled();
      }
      console.log(this.playerInstance);
    },
    onAutoStartEnabled() {
      if (this.autoStartTimeoutCode) {
        clearTimeout(this.autoStartTimeoutCode);
      }
      if (!this.playerInstance) {
        this.autoStartTimeoutCode = setTimeout(this.onAutoStartEnabled, 1000);
        console.log('[onAutoStartEnabled] player not loaded, retry after 1s');
        return;
      }

      if (!this.onAutoStartEnabled) {
        return;
      }

      const art = this.playerInstance;

      if (art.player.duration ===  Infinity) {
        // fix: duration is Infinity before video loaded
        console.log('[onAutoStartEnabled] incorrect duration. retry later.');
        this.autoStartTimeoutCode = setTimeout(this.onAutoStartEnabled, 500);
        return;
      }

      const now = Math.round(new Date().getTime() / 1000.);
      const start_ts = this.playerOptions.start;
      const end_ts = start_ts + art.player.duration;
      if (now < start_ts) {
        art.player.play = false;
        this.autoStartTimeoutCode = setTimeout(() => {
          this.onSyncProgress();
          art.player.play = true;
        }, (start_ts - now) * 1000);
      } else if (now < end_ts) {
        this.onSyncProgress();
        art.player.play = true;
      } else {
        console.log('[onAutoStartEnabled] ended. no auto sync');
      }
    },
    onURLUpdated(url) {
      if (!this.playerInstance) {
        setTimeout(() => { this.onURLUpdated(url) }, 1000);
        console.log('[onURLUpdated] player not loaded, retry after 1s');
        return;
      }
      this.playerInstance.player.url = url;
    },
    onSubtitleUpdated(url) {
      if (!this.playerInstance) {
        setTimeout(() => { this.onSubtitleUpdated(url) }, 1000);
        console.log('[onSubtitleUpdated] player not loaded, retry after 1s');
        return;
      }
      this.playerInstance.subtitle.switch(url, url);
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
            message: '如果播放内容没有正常更新，请确认自动同步已开启，或尝试手动刷新页面',
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
      let startTimeUpdated = false;
      let urlUpdated = false;
      let subtitleUpdated = false;
      // let qualityUpdated = false;

      if (this.playerOptions.start !== config.start) {
        console.log('start time updated', this.playerOptions.start, '->', config.start);
        startTimeUpdated = true;
      }

      if (this.playerOptions.url !== config.url) {
        console.log('url updated', this.playerOptions.url, '->', config.url);
        urlUpdated = true;
      }

      if (config.subtitle) {
        const newSub = config.subtitle.url;
        if (this.playerOptions.subtitle && this.playerOptions.subtitle.url !== newSub) {
          console.log('subtitle updated', this.playerOptions.subtitle.url, '->', newSub);
          subtitleUpdated = true;
        }
      }

      Object.assign(this.playerOptions, config);
      // post-processing
      const icons = this.playerOptions.icons;
      if (icons) {
        for (const k in this.playerOptions.icons) {
          const _url = this.playerOptions.icons[k];
          this.playerOptions.icons[k] = `<img src="${_url}">`;
        }
      }

      if (startTimeUpdated) {
        if (this.onAutoStartEnabled) {
          this.onAutoStartEnabled();
        }
      }

      if (urlUpdated) {
        if (this.onAutoStartEnabled) {
          this.onURLUpdated(config.url);
          this.onAutoStartEnabled();
        }
      }

      if (subtitleUpdated) {
        this.onSubtitleUpdated(config.subtitle.url);
      }

      this.refreshStatusText();
      this.configLoaded = true;
      console.log(config);

    }
  },
  async mounted() {
    const rtn = await api.getConfig();
    const config = rtn.data;

    // add sync progress handler
    this.playerOptions.controls.forEach(
      (ctl) => {
        const tag = ctl.tag;
        if (Object.prototype.hasOwnProperty.call(this.playerCallbacks, tag)) {
          const callback = this.playerCallbacks[tag];
          ctl.click = callback;
        }
      }
    )

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
