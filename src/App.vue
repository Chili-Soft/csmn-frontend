<template>
  <div id="app">
    <!-- <h1>{{ CSMN_TITLE }}</h1> -->
    <!-- <el-divider></el-divider> -->
  <el-container style="height: 100%;">

    <el-header
      style="text-align: center; font-size: 12px; height: 80px; width: 90%; align-self: center"
      ref="headerContainer"
    >
      <el-row>
        <el-col :span="18" :offset="2">
          <span
            style="text-align: center; font-size: 32px; text-shadow: 0 0 0.3em rgb(250, 223, 181), 0 0 0.2em rgb(250, 223, 181)"
          > {{ this.playerOptions.title }} </span>
        </el-col>
        <el-col :span="2">
          <el-row style="height: 80px; margin: 0px; padding: 0px; line-height: 60px">
            <el-row style="height: 20%; margin-bottom: 5px">
              <span text>当前状态：{{ this.statusText }}</span>
            </el-row>
            <el-row style="height: 20%; margin-top: 5px">
              <span text>自动同步：{{ this.autoStartEnabled ? '已开启' : '已关闭' }}</span>
            </el-row>
          </el-row>
        </el-col>
      </el-row>

    </el-header>
    
    
    <el-row align="center" type="flex" justify="space-around" ref="mainContainer">
      <el-col :span="17" :offset="1" ref="playerContainer">
          <ArtplayerComponent v-if="this.configLoaded" ref="player"
            :option="this.playerOptions"
            @getInstance="this.getInstance"
            :style="this.playerStyle"
          />
      </el-col>

      <el-col :span="4">
          <widgetbot id="discord-widget"
            :server="this.discordWidget.serverID"
            :channel="this.discordWidget.channelID"
            height="100%"
            width="100%"
            shard="https://e.widgetbot.io"
          ></widgetbot>
      </el-col>
      <el-col :span="1"></el-col>
    </el-row>

    <el-row style="height: 15%" ref="infoContainer">
      <el-col :span="24">
        <div>
          <h3>
            开始时间 {{ this.timestampToString(this.playerOptions.start) }}
          </h3>
        </div>
      </el-col>
    </el-row>

  </el-container>


  </div>
</template>

<script>
import ArtplayerComponent from 'artplayer-vue';
import * as api from './api.js';

export default {
  name: 'app',
  components: {
    ArtplayerComponent,
  },
  data () {
    return {
      CSMN_TITLE: 'ChiliSoft - Movie Night',
      discordWidget: {
        serverID: '680269512188362809',
        channelID: '680269512704393246',
      },
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
      // default player style, re-compute after mounted
      playerStyle: {
        width: 'auto',
        height: 'auto',
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

    },
    onResize() {
      // update container height first
      const windowHeight = window.innerHeight - 50;
      const infoContainerHeight = this.$refs.infoContainer.$el.scrollHeight;
      const headerContainerHeight = this.$refs.headerContainer.$el.scrollHeight;
      this.$refs.mainContainer.$el.style.height = (windowHeight - infoContainerHeight - headerContainerHeight) + 'px';

      const containerWidth = this.$refs.playerContainer.$el.clientWidth;
      const containerHeight = this.$refs.playerContainer.$el.clientHeight;
      this.playerStyle.width = containerWidth + 'px';
      this.playerStyle.height = containerHeight + 'px';
      console.log('window resize: new player size:', containerWidth, containerHeight);
    },
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

    // load discord widget
    let discordWidgetScript = document.createElement('script');
    discordWidgetScript.setAttribute('src', 'https://cdn.jsdelivr.net/npm/@widgetbot/html-embed');
    document.head.appendChild(discordWidgetScript);

    // initial height for player
    const windowHeight = window.innerHeight;
    this.playerStyle.height = Math.round(windowHeight * 0.8) + 'px';
    this.$nextTick(() => {
      window.addEventListener('resize', this.onResize);
    })
    
    this.updatePlayerOption(config);

    this.fetchConfigBg();

  },

  beforeDestroy() { 
    window.removeEventListener('resize', this.onResize); 
  },

  


}
</script>

<style>

body {
  background-color: #1e1e1e;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: rgb(250, 223, 181);
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

.el-header {
  background-color: #252526;
  color: #e6c271;
  line-height: 80px;
  margin-bottom: 20px;
}
</style>
