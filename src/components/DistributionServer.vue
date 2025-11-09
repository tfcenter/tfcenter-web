<template>
  <div class="settings-page">
    <div class="container">
      <!-- 连接服务器设置卡片 -->
      <div class="setting-card">
        <div class="card-header">
          <h2><i class="fas fa-server"></i> 连接分发服务器设置</h2>
        </div>
        <div class="card-content">
          <el-table :data="[connectionServer]" border style="width: 100%">
            <el-table-column prop="dcServerIP" label="地址" width="150">
              <template #default="{ row }">
                <el-input 
                  v-model="row.dcServerIP" 
                  size="small"
                  :disabled="!connectionStatus"
                  placeholder="请输入服务器IP"
                />
              </template>
            </el-table-column>
            <el-table-column prop="dcServerPort" label="端口号" width="150">
              <template #default="{ row }">
                <el-input-number 
                  v-model="row.dcServerPort" 
                  size="small"
                  :min="1" 
                  :max="65535"
                  :disabled="!connectionStatus"
                  controls-position="right"
                />
              </template>
            </el-table-column>

            <el-table-column prop="dcServerToken" label="密钥" width="220">
              <template #default="{ row }">
                <el-input 
                  v-model="row.dcServerToken" 
                  size="small"
                  :disabled="!connectionStatus"
                  show-password
                  placeholder="10-20位密钥"
                />
              </template>
            </el-table-column>

            <el-table-column prop="status" label="状态" width="100">
              <template #default>
                <el-tag :type="!connectionStatus ? 'success' : 'info'">
                  {{ !connectionStatus ? '已开启' : '已关闭' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220">
              <template #default>
                <template v-if="!connectionStatus">
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click="confirmAction(closeBrServer, '确认关闭连接服务器吗？')"
                    :loading="connectionLoading"
                  >
                    关闭
                  </el-button>
                </template>
                <template v-else>
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="updateBrServer"
                    :loading="connectionLoading"
                  >
                    更新&开启
                  </el-button>
                  <el-button 
                    type="info" 
                    size="small" 
                    @click="confirmAction(updateDefaultBrServer, '确认恢复默认设置吗？')"
                    :loading="connectionLoading"
                  >
                    恢复默认值
                  </el-button>
                </template>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 分发服务器设置卡片 -->
      <div class="setting-card">
        <div class="card-header">
          <h2><i class="fas fa-share-alt"></i> 分发服务器设置</h2>
        </div>
        <div class="card-content">
          <el-table :data="[distributionServer]" border style="width: 100%">
            <el-table-column prop="port" label="端口号" width="150">
              <template #default="{ row }">
                <el-input-number 
                  v-model="row.port" 
                  size="small"
                  :min="1" 
                  :max="65535"
                  controls-position="right"
                />
              </template>
            </el-table-column>
            <el-table-column prop="token" label="密钥" width="220">
              <template #default="{ row }">
                <el-input 
                  v-model="row.token" 
                  size="small"
                  show-password
                  placeholder="10-20位密钥"
                />
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default>
                <el-tag :type="distributionStatus ? 'success' : 'info'">
                  {{ distributionStatus ? '运行中' : '已停止' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default>
                <template v-if="distributionStatus">
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click="confirmAction(stopBrServerService, '确认停止分发服务器吗？')"
                    :loading="distributionLoading"
                  >
                    停止
                  </el-button>
                </template>
                <template v-else>
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="updateBrServerService"
                    :loading="distributionLoading"
                  >
                    更新&开启
                  </el-button>
                </template>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 端口映射设置卡片 -->
      <div class="setting-card">
        <div class="card-header">
          <h2><i class="fas fa-network-wired"></i> 映射端口范围设置</h2>
          <p class="card-subtitle">
            （映射端口号填0时，按以下规则自动分配端口号）
          </p>
        </div>
        <div class="card-content">
          <el-table :data="[portConfig]" border style="width: 100%">
            <el-table-column prop="validPort" label="有效端口号范围(如80,1000-1100,2000)" width="350">
              <template #default="{ row }">
                <el-input 
                  v-model="row.validPort" 
                  size="small"
                  placeholder="例如: 80,1000-1100,2000"
                />
              </template>
            </el-table-column>
            <el-table-column prop="firstAutoPort" label="自动分配起始端口号" width="180">
              <template #default="{ row }">
                <el-input-number 
                  v-model="row.firstAutoPort" 
                  size="small"
                  :min="1" 
                  :max="65535"
                  controls-position="right"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default>
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="updatePortConfig"
                  :loading="portLoading"
                >
                  更新
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { API_BASE_URL } from '@/config';

export default {
  name: 'SettingsPage',
  setup() {
    const router = useRouter();
    
    // 加载状态
    const loading = ref(true);
    const portLoading = ref(false);
    const connectionLoading = ref(false);
    const distributionLoading = ref(false);

    // 端口映射设置相关状态
    const portConfig = ref({
      validPort: '',
      firstAutoPort: 10000
    });

    // 连接服务器设置相关状态
    const connectionServer = ref({
      dcServerIP: '',
      dcServerPort: 0,
      dcServerToken: ''
    });
    const connectionStatus = ref(false);

    // 分发服务器设置相关状态
    const distributionServer = ref({
      port: 0,
      token: ''
    });
    const distributionStatus = ref(false);

    // 确认操作对话框
    const confirmAction = (action, message) => {
      ElMessageBox.confirm(message, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
      .then(() => {
        action();
      })
      .catch(() => {
        ElMessage.info('已取消操作');
      });
    };

    // 验证IP地址格式
    const validateIP = (ip) => {
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      return ipRegex.test(ip) || ip === 'localhost';
    };

    // 验证端口范围格式
    const validatePortRange = (range) => {
      if (!range) return false;
      const parts = range.split(',');
      const portRegex = /^(\d+)(-\d+)?$/;
      
      for (const part of parts) {
        if (!portRegex.test(part.trim())) {
          return false;
        }
      }
      return true;
    };

    // 获取设置信息
    const fetchSettings = async () => {
      try {
        loading.value = true;
        const response = await fetch(`${API_BASE_URL}/get-settingInfo`, {
          credentials: 'include'
        });
        const data = await response.json();

        if (data.errCode === 1000) {
          ElMessage.warning('请先登录');
          router.push('/user-login?callback=sys-setting');
          return;
        }

        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '获取设置信息失败');
        }

        // 端口映射设置
        portConfig.value.validPort = data.ServerConfig.validPort;
        portConfig.value.firstAutoPort = data.ServerConfig.firstAutoPort;

        // 连接服务器设置
        connectionServer.value.dcServerIP = data.DCServerIP;
        connectionServer.value.dcServerPort = data.DCServerPort;
        connectionServer.value.dcServerToken = data.DCServerToken;
        connectionStatus.value = data.selectSrvStatus;

        // 分发服务器设置
        distributionServer.value.port = data.BRServer.port;
        distributionServer.value.token = data.BRServer.token; 
        distributionStatus.value = data.BRServerStatus;

      } catch (error) {
        console.error('获取设置信息失败:', error);
        ElMessage.error(error.message || '获取设置信息失败');
      } finally {
        loading.value = false;
      }
    };

    // 更新端口映射配置
    const updatePortConfig = async () => {
      try {
        portLoading.value = true;
        
        if (!portConfig.value.validPort) {
          ElMessage.warning('有效端口号不能为空');
          return;
        }
        
        if (!validatePortRange(portConfig.value.validPort)) {
          ElMessage.warning('端口范围格式不正确，请使用如: 80,1000-1100,2000 的格式');
          return;
        }
        
        if (!portConfig.value.firstAutoPort || portConfig.value.firstAutoPort < 1 || portConfig.value.firstAutoPort > 65535) {
          ElMessage.warning('起始端口号取值范围是1-65535');
          return;
        }

        const params = new URLSearchParams();
        params.append('firstAutoPort', portConfig.value.firstAutoPort);
        params.append('validPort', portConfig.value.validPort);
        
        const response = await fetch(`${API_BASE_URL}/update-portConfig`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '更新端口映射配置失败');
        }
        
        await fetchSettings();
        ElMessage.success(data.errMsg || '端口映射配置已更新');
      } catch (error) {
        console.error('更新端口映射配置失败:', error);
        ElMessage.error(error.message || '更新端口映射配置失败');
      } finally {
        portLoading.value = false;
      }
    };

    // 更新连接服务器配置
    const updateBrServer = async () => {
      try {
        connectionLoading.value = true;
        
        if (!connectionServer.value.dcServerIP) {
          ElMessage.warning('IP地址不能为空');
          return;
        }
        
        if (!validateIP(connectionServer.value.dcServerIP)) {
          ElMessage.warning('IP地址格式不正确');
          return;
        }
        
        if (!connectionServer.value.dcServerPort || connectionServer.value.dcServerPort < 1 || connectionServer.value.dcServerPort > 65535) {
          ElMessage.warning('端口取值范围是1-65535');
          return;
        }
        
        if (!connectionServer.value.dcServerToken || connectionServer.value.dcServerToken.length < 10 || connectionServer.value.dcServerToken.length > 20) {
          ElMessage.warning('token长度为10-20位');
          return;
        }

        const params = new URLSearchParams();
        params.append('DCServerIP', connectionServer.value.dcServerIP);
        params.append('DCServerPort', connectionServer.value.dcServerPort);
        params.append('DCServerToken', connectionServer.value.dcServerToken);
        
        const response = await fetch(`${API_BASE_URL}/update-brServer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '更新连接服务器配置失败');
        }
        
        await fetchSettings();
        ElMessage.success(data.errMsg || '连接服务器配置已更新');
      } catch (error) {
        console.error('更新连接服务器配置失败:', error);
        ElMessage.error(error.message || '更新连接服务器配置失败');
      } finally {
        connectionLoading.value = false;
      }
    };

    // 恢复默认连接服务器配置
    const updateDefaultBrServer = async () => {
      try {
        connectionLoading.value = true;
        
        const response = await fetch(`${API_BASE_URL}/update-defaultBrServer`, {
          method: 'POST',
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '恢复默认连接服务器配置失败');
        }

        await fetchSettings();        
        ElMessage.success(data.errMsg || '已恢复默认连接服务器配置');
      } catch (error) {
        console.error('恢复默认连接服务器配置失败:', error);
        ElMessage.error(error.message || '恢复默认连接服务器配置失败');
      } finally {
        connectionLoading.value = false;
      }
    };

    // 关闭连接服务器
    const closeBrServer = async () => {
      try {
        connectionLoading.value = true;
        
        const response = await fetch(`${API_BASE_URL}/close-brServer`, {
          method: 'POST',
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '关闭连接服务器失败');
        }
        
        await fetchSettings();
        ElMessage.success(data.errMsg || '连接服务器已关闭');
      } catch (error) {
        console.error('关闭连接服务器失败:', error);
        ElMessage.error(error.message || '关闭连接服务器失败');
      } finally {
        connectionLoading.value = false;
      }
    };

    // 更新分发服务器配置
    const updateBrServerService = async () => {
      try {
        distributionLoading.value = true;
        
        if (!distributionServer.value.port || distributionServer.value.port < 1 || distributionServer.value.port > 65535) {
          ElMessage.warning('端口取值范围是1-65535');
          return;
        }

        if (!distributionServer.value.token || distributionServer.value.token.length < 10 || distributionServer.value.token.length > 20) {
          ElMessage.warning('token长度为10-20位');
          return;
        }

        const params = new URLSearchParams();
        params.append('BrServerServicePort', distributionServer.value.port);
        params.append('BrServerServiceToken', distributionServer.value.token);
        
        const response = await fetch(`${API_BASE_URL}/update-brServerService`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '更新分发服务器配置失败');
        }
        
        await fetchSettings();  
        ElMessage.success(data.errMsg || '分发服务器配置已更新');
      } catch (error) {
        console.error('更新分发服务器配置失败:', error);
        ElMessage.error(error.message || '更新分发服务器配置失败');
      } finally {
        distributionLoading.value = false;
      }
    };

    // 停止分发服务器
    const stopBrServerService = async () => {
      try {
        distributionLoading.value = true;
        
        const response = await fetch(`${API_BASE_URL}/stop-brServerService`, {
          method: 'POST',
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '停止分发服务器失败');
        }
        
        await fetchSettings();
        ElMessage.success(data.errMsg || '分发服务器已停止');
      } catch (error) {
        console.error('停止分发服务器失败:', error);
        ElMessage.error(error.message || '停止分发服务器失败');
      } finally {
        distributionLoading.value = false;
      }
    };

    onMounted(() => {
      fetchSettings();
    });

    return {
      loading,
      portConfig,
      portLoading,
      connectionServer,
      connectionStatus,
      connectionLoading,
      distributionServer,
      distributionStatus,
      distributionLoading,
      updatePortConfig,
      updateBrServer,
      updateDefaultBrServer,
      closeBrServer,
      updateBrServerService,
      stopBrServerService,
      confirmAction
    };
  }
};
</script>

<style scoped>
.settings-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 40px);
}

.container {
  max-width: 100%;
  margin: 0 auto;
}

.setting-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.setting-card:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}

.card-header {
  background: linear-gradient(90deg, #f0f2f5 0%, #e6e9ef 100%);
  padding: 16px 20px;
  border-bottom: 1px solid #e6e6e6;
}

.card-header h2 {
  margin: 0;
  font-size: 16px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-header i {
  font-size: 18px;
  color: #409EFF;
}

.card-subtitle {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

.card-content {
  padding: 20px;
}

@media (max-width: 768px) {
  .settings-page {
    padding: 10px;
  }
  
  .card-content {
    padding: 15px;
    overflow-x: auto;
  }
  
  .setting-card {
    margin-bottom: 16px;
  }
}
</style>