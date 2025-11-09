<template>
  <div class="port-config-page">
    <!-- 客户端配置 -->
    <el-card class="tunnel-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>服务器设置</span>
        </div>
      </template>

      <el-table :data="[clientConfig]" border>
        <el-table-column label="服务器地址" width="250">
          <template #default="{ row }">
            <el-input 
              v-model="row.officialAddr" 
              placeholder="服务器地址"
              :disabled="true"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="服务器端口号" width="200">
          <template #default="{ row }">
            <el-input-number 
              v-model="row.officialPort" 
              :min="1" 
              :max="65535"
              :disabled="true"
              controls-position="right"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="关联的用户" width="200">
          <template #default="{ row }">
            <el-input 
              v-model="row.bindUsername" 
              placeholder="用户名"
              :disabled="true"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="200">
          <template #default="{ row }">
            <el-tag :type="row.status.includes('成功') ? 'success' : 'info'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button 
              v-if="row.officialSwitch" 
              type="danger" 
              size="small" 
              @click="stopClient"
              :loading="loading"
            >
              停止
            </el-button>
            <el-button 
              v-else 
              type="primary" 
              size="small" 
              @click="showClientEditDialog"
              :loading="loading"
            >
              编辑
            </el-button>
            <el-button 
              v-if="!row.officialSwitch" 
              type="danger" 
              size="small" 
              @click="startClient"
              :loading="loading"
            >
              启动
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 端口映射列表 -->
    <el-card class="mapping-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>自动映射列表({{ connectServerIP }})</span>
        </div>
      </template>

      <el-table :data="mappingList" border>
        <el-table-column label="名称" width="120">
          <template #default="{ row }">
            <el-input 
              v-model="row.name" 
              :disabled="true"
              placeholder="5-15字符"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="内网地址" width="150">
          <template #default="{ row }">
            <el-input 
              v-model="row.targetIP" 
              :disabled="true"
              placeholder="127.0.0.1"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="内网端口号" width="100">
          <template #default="{ row }">
            <el-input 
              v-model="row.targetPort" 
              :disabled="true"
              placeholder="1-65535"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="映射端口号" width="100">
          <template #default="{ row }">
            <el-input 
              v-model="row.mappingPort" 
              :disabled="true"
              placeholder="0-65535"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="协议" width="80">
          <template #default="{ row }">
            <el-select 
              v-model="row.protocol" 
              :disabled="true"
              size="small"
            >
              <el-option label="tcp" value="tcp" />
              <el-option label="udp" value="udp" />
            </el-select>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="300">
          <template #default="{ row }">
            <div class="status-text">{{ row.status }}</div>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <div v-if="row.switch">
              <el-button type="danger" size="small" @click="stopMapping(row)">停止</el-button>
            </div>
            <div v-else>
              <el-button type="primary" size="small" @click="updateMapping(row)">启动</el-button>
            </div>
          </template>
        </el-table-column>

      </el-table>
    </el-card>

    <!-- 客户端配置弹窗 -->
    <el-dialog
      v-model="clientDialogVisible"
      :title="'编辑客户端配置'"
      width="400px"
      :before-close="handleClientDialogClose"
    >
      <el-form :model="clientEditForm" label-width="100px">
        <el-form-item label="服务器地址">
          <el-input v-model="clientEditForm.officialAddr" disabled placeholder="请输入服务器地址" />
        </el-form-item>
        
        <el-form-item label="服务器端口">
         <el-input v-model="clientEditForm.officialPort" disabled placeholder="请输入端口号" />
        </el-form-item>
        
        <el-form-item label="控制密钥">
          <el-input v-model="clientEditForm.controlToken" disabled placeholder="请输入控制密钥" />
        </el-form-item>
        
        <el-form-item label="关联用户">
          <el-input v-model="clientEditForm.bindUsername" placeholder="请输入用户名" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="clientDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="updateClient" :loading="loading">确认</el-button>
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
    const clientDialogVisible = ref(false)
    
    // 客户端配置数据
    const clientConfig = reactive({
      officialAddr: "",
      officialPort: 0,
      officialSwitch: true,
      bindUsername: "",
      controlToken: "",
      status: "已连接"
    })
    
    // 客户端编辑表单
    const clientEditForm = reactive({
      officialAddr: "",
      officialPort: 0,
      controlToken: "",
      bindUsername: ""
    })
    
    
    const mappingList = ref([])
    const connectServerIP = ref('')
    
    
    // 验证IP地址
    const validateIP = (ip) => {
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
      return ipRegex.test(ip) || ip === 'localhost'
    }
    
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
        const response = await fetch(`${API_BASE_URL}/local-tunnel-client`, {
          method: 'GET',
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()

        if (data.errCode !== 0) {
          if (data.errCode === 1000) {
            router.push('/user-login?callback=official-client')
          } 
          throw new Error(data.errMsg || '获取数据失败')
        }
        
        // 更新客户端配置数据
        if (data.data) {
          Object.assign(clientConfig, {
            officialAddr: data.data.officialAddr,
            officialPort: data.data.officialPort,
            officialSwitch: data.data.switch,
            bindUsername: data.data.bindUsername,
            controlToken: data.data.controlToken,
            status: data.data.status || (data.data.officialSwitch ? "已连接" : "未连接")
          })
        }

        connectServerIP.value = data.connectServerIP
        
        // 更新映射列表
        if (data.data && data.data.tunnelMappingPort) {
          mappingList.value = data.data.tunnelMappingPort.map(item => ({
            ...item,
            protocol: item.protocol === 0 ? 'tcp' : 'udp'
          }))
        }
      } catch (error) {
        console.error('刷新数据失败:', error)
        ElMessage.error('刷新失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }
    
    // 显示客户端编辑弹窗
    const showClientEditDialog = () => {
      Object.assign(clientEditForm, {
        officialAddr: clientConfig.officialAddr,
        officialPort: clientConfig.officialPort,
        controlToken: clientConfig.controlToken,
        bindUsername: clientConfig.bindUsername
      })
      clientDialogVisible.value = true
    }
    
  
    // 处理客户端弹窗关闭
    const handleClientDialogClose = (done) => {
      done()
    }
    
    // 更新映射
    const updateMapping = async (row) => {
      // 验证输入
      if (!validateIP(row.targetIP)) {
        ElMessage.warning('内网IP地址格式不正确')
        return
      }
      
      if (!row.targetPort || row.targetPort < 1 || row.targetPort > 65535) {
        ElMessage.warning('内网端口取值范围是1-65535')
        return
      }
      
      if (row.mappingPort < 0 || row.mappingPort > 65535) {
        ElMessage.warning('映射端口取值范围是0-65535')
        return
      }
      
      loading.value = true
      try {
        // API调用
        const formData = new URLSearchParams();
        formData.append('name', row.name);
        formData.append('targetIP', row.targetIP);
        formData.append('targetPort', row.targetPort);
        formData.append('mappingPort', row.mappingPort);
        row.protocol === 'tcp' ? formData.append('protocol', 0) : formData.append('protocol', 1)
        
        const response = await fetch(`${API_BASE_URL}/update-local-tunnel-mapping`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString()
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '更新映射失败')
        }
        
        row.switch = true
        row.status = '映射成功(端口号为:' + (row.realPort || row.mappingPort) + ')'
        ElMessage.success('映射已启动')
      } catch (error) {
        ElMessage.error('启动失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }
    
    // 停止映射
    const stopMapping = async (row) => {
      loading.value = true
      try {
        const formData = new URLSearchParams();
        formData.append('name', row.name);

        const response = await fetch(`${API_BASE_URL}/stop-local-tunnel-mapping`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString()
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '停止映射失败')
        }
        
        row.switch = false
        row.status = '已停止'
        ElMessage.success('映射已停止')
      } catch (error) {
        ElMessage.error('停止失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }
    
    // 更新客户端连接
    const updateClient = async () => {
      if (!clientEditForm.officialAddr) {
        ElMessage.warning('服务器地址不能为空')
        return
      }
      
      if (!clientEditForm.officialPort || clientEditForm.officialPort < 1 || clientEditForm.officialPort > 65535) {
        ElMessage.warning('服务器端口取值范围是1-65535')
        return
      }
      
      if (!clientEditForm.controlToken) {
        ElMessage.warning('控制密钥不能为空')
        return
      }

      if (!clientEditForm.bindUsername) {
          try {
            await ElMessageBox.confirm('绑定的用户名为空，是否继续？', '提示', {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            });
          } catch (error) {
            return;
          }
      }
      
      loading.value = true
      try {
        const formData = new URLSearchParams();
        formData.append('officialAddr', clientEditForm.officialAddr);
        formData.append('officialPort', clientEditForm.officialPort);
        formData.append('controlToken', clientEditForm.controlToken);
        formData.append('bindUsername', clientEditForm.bindUsername);
        formData.append('token', "default");

        const response = await fetch(`${API_BASE_URL}/update-local-tunnel-client`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString()
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '更新客户端配置失败')
        }
        
        // 更新客户端配置
        Object.assign(clientConfig, {
          officialAddr: clientEditForm.officialAddr,
          officialPort: clientEditForm.officialPort,
          controlToken: clientEditForm.controlToken,
          bindUsername: clientEditForm.bindUsername,
          officialSwitch: true,
          status: '已连接'
        })
        
        clientDialogVisible.value = false
        ElMessage.success('客户端已连接')
        
        refreshData()
      } catch (error) {
        ElMessage.error('连接失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    const startClient = async () => {
      if (!clientConfig.officialAddr) {
        ElMessage.warning('服务器地址不能为空')
        return
      }
      
      if (!clientConfig.officialPort || clientConfig.officialPort < 1 || clientConfig.officialPort > 65535) {
        ElMessage.warning('服务器端口取值范围是1-65535')
        return
      }
      
      if (!clientConfig.controlToken) {
        ElMessage.warning('控制密钥不能为空')
        return
      }
      
      loading.value = true
      try {
        // API调用
        const formData = new URLSearchParams();
        formData.append('officialAddr', clientConfig.officialAddr);
        formData.append('officialPort', clientConfig.officialPort);
        formData.append('controlToken', clientConfig.controlToken);
        formData.append('bindUsername', clientConfig.bindUsername);
        formData.append('token', "default");

        const response = await fetch(`${API_BASE_URL}/update-local-tunnel-client`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString()
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '启动客户端失败')
        }
        
        clientConfig.officialSwitch = true
        clientConfig.status = '已连接'
        ElMessage.success('客户端已连接')
        
        // 刷新数据
        refreshData()
      } catch (error) {
        ElMessage.error('连接失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }
    
    // 停止客户端连接
    const stopClient = async () => {
      loading.value = true
      try {
        const response = await fetch(`${API_BASE_URL}/stop-local-tunnel-client`, {
          method: 'POST',
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: {response.status}`)
        }
        
        const data = await response.json()
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '停止客户端失败')
        }
        
        clientConfig.officialSwitch = false
        clientConfig.status = '未连接'
        ElMessage.success('客户端已停止')
        
        refreshData()
      } catch (error) {
        ElMessage.error('停止失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }
    
    onMounted(() => {
      refreshData()
      startTimer()
    })
    
    onUnmounted(() => {
      stopTimer()
    })
    
    return {
      loading,
      clientConfig,
      mappingList,
      timerCount,
      connectServerIP,
      clientDialogVisible,
      clientEditForm,
      showClientEditDialog,
      handleClientDialogClose,
      refreshData,
      updateMapping,
      stopMapping,
      updateClient,
      startClient,
      stopClient
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

.tunnel-card, .mapping-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-text {
  width: 200px;
  word-wrap: break-word;
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
  
  .status-text {
    width: 150px;
  }
}
</style>