<template>
  <div class="port-config-page">
    <!-- 服务器配置 -->
    <el-card class="server-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>服务器设置</span>
        </div>
      </template>

      <el-table :data="[serverConfig]" border>
        <el-table-column label="监听端口" width="180">
          <template #default="{ row }">
            <el-input-number 
              v-model="row.listenPort" 
              :min="1" 
              :max="65535"
              :disabled="true"
              controls-position="right"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="150">
          <template #default="{ row }">
            <el-tag :type="row.status.includes('运行') ? 'success' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button 
              v-if="row.switch" 
              type="danger" 
              size="small" 
              @click="stopServer"
              :loading="loading"
            >
              停止
            </el-button>
            <el-button 
              v-else 
              type="primary" 
              size="small" 
              @click="showServerEditDialog"
              :loading="loading"
            >
              编辑
            </el-button>
            <el-button 
              v-if="!row.switch" 
              type="danger" 
              size="small" 
              @click="startServer"
              :loading="loading"
            >
              启动
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 客户端列表 -->
    <el-card 
      v-for="client in clientList" 
      :key="client.key" 
      class="client-card" 
      shadow="hover"
    >
      <template #header>
        <div class="card-header">
          <span>客户端: {{ client.externalIP }} | {{ client.osType }} | {{ client.bindUsername }} </span>
          <span class="client-info">
            {{ client.platform }} | {{ client.version }} | {{ formatTimeDetail(client.createTime) }}
          </span>
        </div>
      </template>

      <!-- 客户端映射列表 -->
      <el-table :data="client.controlInfo" border>
        <el-table-column label="出口地址" width="200">
          <template #default="{ row }">
            <el-input 
              :value="row.LocalConn" 
              :disabled="true"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="内网地址" width="120">
          <template #default="{ row }">
            <el-input 
              :value="row.ConnectIP" 
              :disabled="true"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="内网端口" width="100">
          <template #default="{ row }">
            <el-input 
              :value="row.ConnectPort" 
              :disabled="true"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="映射端口" width="100">
          <template #default="{ row }">
            <el-input 
              :value="row.ListenPort" 
              :disabled="true"
            />
          </template>
        </el-table-column>

        <el-table-column label="协议" width="80">
          <template #default="{ row }">
            <el-tag :type="row.Protocol === 0 ? 'primary' : 'success'">
              {{ row.Protocol === 0 ? 'TCP' : 'UDP' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            <el-input 
              :value="formatTimeDetail(row.CreateTime)" 
              :disabled="true"
            />
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="">
            <el-tag type="success">已连接</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 没有客户端时的提示 -->
    <el-card v-if="clientList.length === 0" class="empty-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>客户端列表</span>
        </div>
      </template>
      <div class="empty-text">暂无客户端连接</div>
    </el-card>

    <!-- 服务器配置弹窗 -->
    <el-dialog
      v-model="serverDialogVisible"
      title="服务器配置"
      width="500px"
      :before-close="handleServerDialogClose"
    >
      <el-form :model="serverEditForm" label-width="100px">
        <el-form-item label="监听端口" required>
          <el-input-number 
            v-model="serverEditForm.listenPort" 
            :min="1" 
            :max="65535"
            controls-position="right"
            style="width: 100%"
            placeholder="请输入监听端口"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="serverDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="updateServer" :loading="loading">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { API_BASE_URL } from '@/config';
import { useRouter } from 'vue-router'

export default {
  name: 'PortConfig',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const timerCount = ref(0)
    const timer = ref(null)
    
    // 弹窗控制
    const serverDialogVisible = ref(false)
    
    // 服务器配置数据
    const serverConfig = reactive({
      listenPort: 0,
      status: "",
      switch: false
    })
    
    // 服务器编辑表单
    const serverEditForm = reactive({
      listenPort: 0
    })
    
    // 客户端列表
    const clientList = ref([])
    
    // 启动定时器
    const startTimer = () => {
      if (!timer.value) {
        timerCount.value = 5
        timer.value = setInterval(() => {
          timerCount.value--
          if (timerCount.value <= 0) {
            refreshData()
            timerCount.value = 5
          }
        }, 1000)
      }
    }
    
    // 停止定时器
    const stopTimer = () => {
      if (timer.value) {
        clearInterval(timer.value)
        timer.value = null
      }
    }
    
    // 刷新数据
    const refreshData = async () => {
      loading.value = true
      try {
        const response = await fetch(`${API_BASE_URL}/local-tunnel-server`, {
          method: 'GET',
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()

        if (data.errCode !== 0) {
          if (data.errCode === 1000) {
            router.push('/user-login?callback=official-server')
          } 
          throw new Error(data.errMsg || '获取数据失败')
        }
        
        // 更新服务器配置
        Object.assign(serverConfig, {
          listenPort: data.listenPort,
          status: data.status,
          switch: data.switch
        })
        
        // 处理客户端数据
        clientList.value = []
        if (data.data.ControlPool) {
          Object.entries(data.data.ControlPool).forEach(([clientKey, clientData]) => {
            clientList.value.push({
              key: clientKey,
              token: clientData.ControlToken,
              localconn: clientData.LocalConn,
              bindUsername: clientData.BindUsername,
              createTime: clientData.CreateTime,
              osType: clientData.OSType,
              externalIP: clientData.ExternalIP,
              platform: clientData.Platform,
              version: clientData.Version,
              controlInfo: clientData.ControlInfo || [],
              arch: clientData.ARCH,
              kernelArch: clientData.KernelArch
            })
          })
        }
        
      } catch (error) {
        console.error('刷新数据失败:', error)
        ElMessage.error('刷新失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }
    
    // 显示服务器编辑弹窗
    const showServerEditDialog = () => {
      Object.assign(serverEditForm, {
        listenPort: serverConfig.listenPort || 8080
      })
      serverDialogVisible.value = true
    }
    
    // 处理服务器弹窗关闭
    const handleServerDialogClose = (done) => {
      done()
    }
    
    // 更新服务器配置
    const updateServer = async () => {
      if (!serverEditForm.listenPort || serverEditForm.listenPort < 1 || serverEditForm.listenPort > 65535) {
        ElMessage.warning('服务器端口取值范围是1-65535')
        return
      }
      
      loading.value = true
      try {
        const formData = new URLSearchParams();
        formData.append('officialPort', serverEditForm.listenPort);

        const response = await fetch(`${API_BASE_URL}/update-local-tunnel-server`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString()
        })
        
        const data = await response.json()
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '更新服务器配置失败')
        }
        
        serverDialogVisible.value = false
        ElMessage.success('服务器已启动')
        refreshData()
      } catch (error) {
        ElMessage.error('启动失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    const startServer = async () => {
      if (!serverConfig.listenPort || serverConfig.listenPort < 1 || serverConfig.listenPort > 65535) {
        ElMessage.warning('服务器端口取值范围是1-65535')
        return
      }
      
      loading.value = true
      try {
        const formData = new URLSearchParams();
        formData.append('officialPort', serverConfig.listenPort);

        const response = await fetch(`${API_BASE_URL}/update-local-tunnel-server`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString()
        })
        
        const data = await response.json()
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '启动失败')
        }
        
        ElMessage.success('服务器已启动')
        refreshData()
      } catch (error) {
        ElMessage.error('启动失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    const formatTimeDetail = (timestamp) => {
      if (!timestamp) return '-';
      const date = new Date(timestamp * 1000);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`; // 格式化为 "2025-09-04 12:34:56"
    };
    
    // 停止服务器
    const stopServer = async () => {
      try {
        await ElMessageBox.confirm('确定要停止服务器吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
      } catch (error) {
        return;
      }
      
      loading.value = true
      try {
        const response = await fetch(`${API_BASE_URL}/stop-local-tunnel-server`, {
          method: 'POST',
          credentials: 'include'
        })
        
        const data = await response.json()
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '停止服务器失败')
        }
        
        ElMessage.success('服务器已停止')
        refreshData()
      } catch (error) {
        ElMessage.error('停止失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }
    
    onMounted(() => {
      // 初始化数据
      refreshData()
      startTimer()
    })
    
    onUnmounted(() => {
      stopTimer()
    })
    
    return {
      loading,
      serverConfig,
      clientList,
      timerCount,
      serverDialogVisible,
      serverEditForm,
      showServerEditDialog,
      handleServerDialogClose,
      refreshData,
      updateServer,
      startServer,
      stopServer,
      formatTimeDetail 
    }
  }
}
</script>

<style scoped>
.port-config-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.server-card, .client-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.client-info {
  font-size: 12px;
  color: #909399;
}

.empty-card {
  text-align: center;
}

.empty-text {
  padding: 40px 0;
  color: #909399;
}

.refresh-timer {
  margin-left: 15px;
  font-size: 14px;
  color: #909399;
}

@media (max-width: 768px) {
  .port-config-page {
    padding: 10px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .client-info {
    font-size: 11px;
  }
}
</style>