<template>
  <div class="home-page">
    <div class="header">
      <h1 class="page-title">系统监控面板</h1>
      <div class="refresh-controls">
        <span class="last-update">最后更新: {{ lastUpdateTime || '--:--:--' }}</span>
        <button 
          class="refresh-btn" 
          @click="manualRefresh" 
          :disabled="loading"
          :class="{ 'refreshing': loading }"
        >
          <i class="refresh-icon" :class="{ 'spin': loading }">↻</i>
          {{ loading ? '刷新中...' : '手动刷新' }}
        </button>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- 系统信息卡片 -->
      <div class="info-card system-card">
        <div class="card-header">
          <h2 class="title">
            <i class="card-icon">🖥️</i>
            系统信息
          </h2>
          <div class="card-actions">
            <span class="uptime" v-if="hostInfo.Uptime">运行时间: {{ hostInfo.Uptime }}</span>
          </div>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <div class="label">主机名称</div>
            <div class="value highlight">{{ systemInfo }}</div>
          </div>
          
          <div class="info-item">
            <div class="label">CPU使用率</div>
            <div class="value">
              <progress-bar 
                :percentage="parseFloat(hostInfo.CpuPercent)" 
                color="#FF6B6B"
              />
              <span class="percent">{{ hostInfo.CpuPercent }}</span>
            </div>
          </div>
          
          <div class="info-item">
            <div class="label">内存使用</div>
            <div class="value">
              <progress-bar 
                :percentage="parseFloat(memInfo.UsedPercent)" 
                color="#4ECDC4"
              />
              <span class="detail">{{ memInfo.Used }}/{{ memInfo.Total }} ({{ memInfo.UsedPercent }})</span>
            </div>
          </div>
          
          <div class="info-item network-item">
            <div class="label">网络速度</div>
            <div class="value">
              <div class="network-speed">
                <span class="speed upload">↑ {{ formatSpeed(hostInfo.SendSpeed) }}</span>
                <span class="speed download">↓ {{ formatSpeed(hostInfo.RecvSpeed) }}</span>
              </div>
            </div>
          </div>
          
          <div class="info-item">
            <div class="label">系统时间</div>
            <div class="value clock">{{ currentTime }}</div>
          </div>
          
          <div class="info-item disk-item" v-for="disk in diskInfo" :key="disk.Path">
            <div class="label">磁盘 {{ disk.Path }}</div>
            <div class="value">
              <progress-bar 
                :percentage="parseFloat(disk.UsedPercent)" 
                color="#FFA07A"
              />
              <div class="disk-details">
                <span class="space">{{ disk.Used }} / {{ disk.Total }}</span>
                <span class="percent">{{ disk.UsedPercent }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 软件信息卡片 -->
      <div class="info-card app-card">
        <div class="card-header">
          <h2 class="title">
            <i class="card-icon">📊</i>
            软件信息
          </h2>
          <div class="card-actions">
            <span class="uptime">运行时间: {{ runningTime }}</span>
          </div>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <div class="label">软件版本</div>
            <div class="value">{{ version }}</div>
          </div>
          
          <div class="info-item">
            <div class="label">CPU占用</div>
            <div class="value">
              <progress-bar 
                :percentage="parseFloat(pidInfo.CpuUsed)" 
                color="#FFD166"
                small
              />
              <span class="percent">{{ pidInfo.CpuUsed }}</span>
            </div>
          </div>
          
          <div class="info-item">
            <div class="label">内存占用</div>
            <div class="value">{{ pidInfo.MemUsed }}</div>
          </div>
          
          <div class="info-item">
            <div class="label">协程数量</div>
            <div class="value">{{ pidInfo.GoNum }}</div>
          </div>

          <div class="info-item">
            <div class="label">启动时间</div>
            <div class="value">{{ startupTime }}</div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { API_BASE_URL } from '@/config';
import { ElMessage } from 'element-plus';

// 进度条组件
const ProgressBar = {
  props: {
    percentage: {
      type: Number,
      default: 0
    },
    color: {
      type: String,
      default: '#4ECDC4'
    },
    small: {
      type: Boolean,
      default: false
    }
  },
  template: `
    <div class="progress-container" :class="{ 'small': small }">
      <div 
        class="progress-bar" 
        :style="{
          width: Math.min(100, Math.max(0, percentage)) + '%',
          backgroundColor: color
        }"
      ></div>
    </div>
  `
};

export default {
  name: 'HomePage',
  components: {
    ProgressBar
  },
  data() {
    return {
      version: '3.4.2',
      systemInfo: '',
      currentTime: '',
      diskInfo: [],
      hostInfo: {
        Platform: '',
        KernelArch: '',
        Uptime: '',
        BootTime: '',
        CpuPercent: '0%',
        SendSpeed: '0',
        RecvSpeed: '0'
      },
      memInfo: {
        Total: '0GB',
        Used: '0GB',
        UsedPercent: '0%'
      },
      pidInfo: {
        CpuUsed: '0%',
        MemUsed: '0MB',
        GoNum: '0'
      },
      startupTime: '',
      runningTime: '',
      loading: false,
      refreshInterval: null,
      lastUpdateTime: null
    }
  },
  created() {
    this.fetchHomeInfo();
    this.setupAutoRefresh();
  },
  beforeUnmount() {
    this.clearAutoRefresh();
  },
  methods: {
    setupAutoRefresh() {
      this.refreshInterval = setInterval(() => {
        if (!this.loading) {
          this.fetchHomeInfo();
        }
      }, 3000);
    },
    clearAutoRefresh() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }
    },
    async manualRefresh() {
      await this.fetchHomeInfo();
    },
    async fetchHomeInfo() {
      this.loading = true;
      try {
        const response = await fetch(`${API_BASE_URL}/get-homeInfo`, {
          credentials: 'include'
        });
        const data = await response.json();

        if (data.errCode === 1000) {
          ElMessage.warning('请先登录');
          this.$router.push('/user-login');

          return;
        }

        if (data.errCode && data.errCode !== 0) {
          throw new Error(data.errMsg || '获取首页信息失败');
        }

        this.version = data.version || this.version;
        this.systemInfo = data.systemInfo || `${data.hostInfo.Platform} ${data.hostInfo.KernelArch}`;
        this.currentTime = data.currentTime;
        this.diskInfo = data.diskInfo || [];
        this.hostInfo = data.hostInfo;
        this.memInfo = data.memInfo;
        this.pidInfo = data.pidInfo;
        this.startupTime = data.startupTime;
        this.runningTime = data.runningTime;
        this.lastUpdateTime = new Date().toLocaleTimeString();

      } catch (error) {
        console.error('获取首页信息失败:', error);
        ElMessage.error(error.message || '获取首页信息失败');
      } finally {
        this.loading = false;
      }
    },
    formatSpeed(speed) {
      if (speed === '0' || !speed) return '0KB/s';
      const num = parseFloat(speed);
      if (num < 1024) return `${num.toFixed(2)}KB/s`;
      return `${(num / 1024).toFixed(2)}MB/s`;
    }
  }
}
</script>

<style scoped>
/* 基础样式 */
:root {
  --primary-color: #4361ee;
  --secondary-color: #3f37c9;
  --success-color: #4cc9f0;
  --warning-color: #f8961e;
  --danger-color: #f94144;
  --light-color: #f8f9fa;
  --dark-color: #212529;
}

.home-page {
  padding: 24px;
  max-width: 100%;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  color: var(--dark-color);
  font-size: 28px;
  font-weight: 600;
  margin: 0;
}

.refresh-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.last-update {
  color: #6c757d;
  font-size: 14px;
}

.refresh-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background-color: var(--secondary-color);
  transform: translateY(-1px);
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.refresh-icon {
  transition: transform 0.3s;
}

.refresh-icon.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 卡片布局 */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
  gap: 24px;
}

.info-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 24px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 12px;
}

.title {
  color: var(--dark-color);
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-icon {
  font-size: 24px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.uptime, .version {
  font-size: 14px;
  color: #6c757d;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
}

/* 信息项样式 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.info-item {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.info-item:hover {
  background-color: #e9ecef;
  transform: translateY(-2px);
}

.label {
  color: #495057;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.value {
  color: var(--dark-color);
  font-size: 16px;
  font-weight: 500;
}

.highlight {
  color: var(--primary-color);
  font-weight: 600;
}

.clock {
  font-family: 'Courier New', monospace;
  font-size: 18px;
  color: var(--secondary-color);
}

/* 进度条样式 */
.progress-container {
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  margin: 8px 0;
  overflow: hidden;
}

.progress-container.small {
  height: 6px;
}

.progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.percent {
  font-size: 14px;
  color: #6c757d;
  margin-left: 8px;
}

.detail {
  font-size: 14px;
  color: #6c757d;
  margin-top: 4px;
  display: block;
}

/* 网络速度样式 */
.network-item {
  grid-column: span 1;
}

.network-speed {
  display: flex;
  gap: 16px;
}

.speed {
  font-family: 'Courier New', monospace;
  font-size: 15px;
  padding: 4px 8px;
  border-radius: 4px;
}

.upload {
  background-color: rgba(67, 97, 238, 0.1);
  color: var(--primary-color);
}

.download {
  background-color: rgba(76, 201, 240, 0.1);
  color: var(--success-color);
}

/* 磁盘样式 */
.disk-item {
  grid-column: span 1;
}

.disk-details {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 14px;
}

.space {
  color: #6c757d;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .network-item, .disk-item {
    grid-column: span 1;
  }
}

@media (max-width: 480px) {
  .home-page {
    padding: 16px;
  }
  
  .info-card {
    padding: 16px;
  }
}
</style>