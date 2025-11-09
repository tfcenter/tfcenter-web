<template>
  <div class="p2p-settings-container">
    <!-- P2P客户端设置表格 -->
    <div class="settings-card">
      <div class="card-header">
        <h3 class="card-title">P2P客户端设置(需重启软件生效)</h3>
      </div>
      <div class="card-body">
        <table class="settings-table">
          <thead>
            <tr>
              <th>当前数量</th>
              <th>最大数量</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ p2pConfig.currentP2PClientNum }}</td>
              <td>
                <el-input 
                  v-model.number="p2pConfigForm.maxP2PClientNum" 
                  type="number"
                  min="1"
                  max="1000"
                />
              </td>
              <td class="action-cell">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="updateP2PClientService"
                >
                  更新
                </el-button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- P2P服务器设置表格 -->
    <div class="settings-card">
      <div class="card-header">
        <h3 class="card-title">P2P服务器设置</h3>
      </div>
      <div class="card-body">
        <table class="settings-table">
          <thead>
            <tr>
              <th>端口号</th>
              <th>开启中转</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <el-input 
                  v-model.number="p2pServerForm.serverListenPort" 
                  type="number"
                  min="1"
                  max="65535"
                />
              </td>
              <td>
                <el-select v-model="p2pServerForm.closeTransfer">
                  <el-option value="on" label="开启" />
                  <el-option value="off" label="关闭" />
                </el-select>
              </td>
              <td>
                <span :style="p2pServer.serverStatus ? 'color: #67c23a;' : 'color: #7c7979ff;'">
                  {{ p2pServer.serverStatus ? '运行中' : '已停止' }}
                </span>
              </td>
              <td class="action-cell">
                <template v-if="p2pServer.serverStatus">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="stopP2PServerService"
                  >
                    停止
                  </el-button>
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="openP2PListStatus"
                  >
                    查看连接状态
                  </el-button>
                </template>
                <el-button 
                  v-else 
                  type="primary" 
                  size="small" 
                  @click="updateP2PServerService"
                >
                  更新&启动
                </el-button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { API_BASE_URL, HOME_BASE_URL } from "@/config";
import { useRouter } from 'vue-router'

export default {
  name: 'P2PSettings',
  setup() {
    const router = useRouter()
    
    // P2P配置数据
    const p2pConfig = ref({
      currentP2PClientNum: 0,
      maxP2PClientNum: 0
    })
    
    const p2pConfigForm = ref({
      maxP2PClientNum: 0
    })
    
    // P2P服务器数据
    const p2pServer = ref({
      serverListenPort: 0,
      serverStatus: false,
      closeTransfer: false,
      status: ''
    })
    
    const p2pServerForm = ref({
      serverListenPort: 0,
      closeTransfer: 'off'
    })
    
    // 获取状态样式类
    const getStatusClass = (status) => {
      if (!status) return 'status stopped'
      
      const lowerStatus = status.toLowerCase()
      
      if (lowerStatus.includes('failed') || lowerStatus.includes('失败')) {
        return 'status failed'
      } else if (lowerStatus.includes('success') || lowerStatus.includes('running') || lowerStatus.includes('运行中')) {
        return 'status running'
      } else {
        return 'status stopped'
      }
    }
    
    // 获取P2P配置数据
    const fetchP2PConfig = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/get-p2pConfig`, {
          method: 'GET',
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error('获取配置失败')
        }
        
        const result = await response.json()

        if (result.errCode === 1000) {
          ElMessage.error('请先登录系统')
          router.push('/user-login?callback=p2p-setting')
          return
        }

        if (result.errCode != 0) {
          ElMessage.error(result.errMsg)
          return
        }
        
        p2pConfig.value = {
          currentP2PClientNum: result.currentP2PClientNum || 0,
          maxP2PClientNum: result.maxP2PClientNum || 0
        }
        
        p2pConfigForm.value.maxP2PClientNum = result.maxP2PClientNum || 0
        
        p2pServer.value = {
          serverListenPort: result.p2pServer?.serverListenPort || 0,
          serverStatus: result.p2pServer?.serverStatus || false,
          closeTransfer: result.p2pServer?.closeTransfer || false,
          status: result.p2pServer?.status || ''
        }
        
        p2pServerForm.value = {
          serverListenPort: result.p2pServer?.serverListenPort || 0,
          closeTransfer: result.p2pServer?.closeTransfer ? 'on' : 'off'
        }
        
      } catch (error) {
        console.error('获取配置失败:', error)
        ElMessage.error(error.message || '获取配置失败')
      }
    }
    
    // 更新P2P客户端数量
    const updateP2PClientService = async () => {
      try {
        if (!p2pConfigForm.value.maxP2PClientNum) {
          ElMessage.error('数量不能为空')
          return
        }
        
        if (p2pConfigForm.value.maxP2PClientNum < 1 || p2pConfigForm.value.maxP2PClientNum > 1000) {
          ElMessage.error('取值范围是1-1000')
          return
        }
        
        const params = new URLSearchParams()
        params.append('maxP2PClientNum', p2pConfigForm.value.maxP2PClientNum)
        
        const response = await fetch(`${API_BASE_URL}/update-p2pClientNum`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        })
        
        if (!response.ok) {
          throw new Error('更新失败')
        }
        
        const data = await response.json()
        
        if (data.errMsg === "success") {
          ElMessageBox.confirm('更新成功，是否重启软件?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'success'
          }).then(() => {
            restartSoftware()
          }).catch(() => {
            fetchP2PConfig()
          })
        } else {
          ElMessage.error(data.errMsg || '更新失败')
          fetchP2PConfig()
        }
      } catch (error) {
        ElMessage.error(error.message || '更新失败')
      }
    }
    
    // 更新P2P服务器设置
    const updateP2PServerService = async () => {
      try {
        if (!p2pServerForm.value.serverListenPort) {
          ElMessage.error('端口号不能为空')
          return
        }
        
        if (p2pServerForm.value.serverListenPort < 1 || p2pServerForm.value.serverListenPort > 65535) {
          ElMessage.error('端口取值范围是1-65535')
          return
        }
        
        if (!p2pServerForm.value.closeTransfer) {
          ElMessage.error('请选择中转状态')
          return
        }
        
        const params = new URLSearchParams()
        params.append('lport', p2pServerForm.value.serverListenPort)
        params.append('closeTransfer', p2pServerForm.value.closeTransfer)
        
        const response = await fetch(`${API_BASE_URL}/start-p2pServer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        })
        
        if (!response.ok) {
          throw new Error('更新失败')
        }
        
        const data = await response.json()
        ElMessage.success(data.errMsg || '更新成功')
        fetchP2PConfig()
      } catch (error) {
        ElMessage.error(error.message || '更新失败')
      }
    }
    
    // 停止P2P服务器
    const stopP2PServerService = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/stop-p2pServer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error('停止失败')
        }
        
        const data = await response.json()
        ElMessage.success(data.errMsg || '停止成功')
        fetchP2PConfig()
      } catch (error) {
        ElMessage.error(error.message || '停止失败')
      }
    }
    
    // 查看连接状态
    const openP2PListStatus = () => {
      window.open(`${HOME_BASE_URL}/get-p2pNode/`, '_blank')
    }

    const restartSoftware = async () => {
      try {        
        const response = await fetch(`${API_BASE_URL}/restart-proccess`, {
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '重启软件失败');
        }
        
        ElMessage.success('软件将在3秒后重启');
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } catch (error) {
        if (error !== 'cancel' && error !== 'close') {
          console.error('重启软件失败:', error);
          ElMessage.error('当前连接断开，请刷新页面:'  +  error.message);
        }
      }
    };
    
    // 初始化
    onMounted(() => {
      fetchP2PConfig()
    })
    
    return {
      p2pConfig,
      p2pConfigForm,
      p2pServer,
      p2pServerForm,
      getStatusClass,
      updateP2PClientService,
      updateP2PServerService,
      stopP2PServerService,
      openP2PListStatus
    }
  }
}
</script>

<style scoped lang="scss">
.p2p-settings-container {
  padding: 20px;
}

.settings-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  overflow: hidden;
  
  .card-header {
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
    
    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }
  }
  
  .card-body {
    padding: 20px;
  }
}

.settings-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  
  th, td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #ebeef5;
  }
  
  th {
    background-color: #f5f7fa;
    color: #909399;
    font-weight: 600;
    white-space: nowrap;
  }
  
  td {
    color: #606266;
    vertical-align: middle;
    
    .el-input, .el-select {
      width: 100%;
      max-width: 120px;
    }
  }
  
  .action-cell {
    white-space: nowrap;
    
    .el-button + .el-button {
      margin-left: 8px;
    }
  }
}

.status {
  &.running {
    color: #67c23a;
  }
  
  &.stopped {
    color: #909399;
  }
  
  &.failed {
    color: #f56c6c;
    font-weight: 500;
  }
}

/* 响应式处理 */
@media (max-width: 768px) {
  .settings-table {
    display: block;
    
    thead {
      display: none;
    }
    
    tr {
      display: block;
      margin-bottom: 16px;
      border: 1px solid #ebeef5;
      border-radius: 4px;
    }
    
    td {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid #ebeef5;
      
      &:before {
        content: attr(data-label);
        font-weight: 600;
        color: #909399;
        margin-right: 12px;
      }
      
      &:last-child {
        border-bottom: none;
      }
      
      &.action-cell {
        justify-content: center;
      }
    }
  }
}
</style>