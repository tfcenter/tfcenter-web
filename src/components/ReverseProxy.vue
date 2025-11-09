<template>
  <div class="reverse-proxy-container">
    <!-- 服务器信息卡片 -->
    <div class="settings-card">
      <div class="card-header">
        <h3 class="card-title">反向代理服务器</h3>
      </div>
      <div class="card-body">
        <p class="description-text">
          反向代理是将外部请求转发（支持IPv4和IPv6）到内部服务器的特定端口。代理服务端, 客户端不知道实际提供服务的服务端。
        </p>
      </div>
    </div>

    <!-- 反向代理列表卡片 -->
    <div class="settings-card">
      <div class="card-header">
        <div class="d-flex justify-content-between align-items-center">
          <h3 class="card-title">反向代理列表</h3>
          <div class="btn-group">
            <el-button type="primary" size="small" @click="showAddDialog">新增</el-button>
            <el-button type="info" size="small" @click="refreshData">刷新</el-button>
          </div>
        </div>
      </div>
      
      <div class="card-body">
        <div v-if="isLoading" class="loading-overlay">
          <el-icon class="is-loading"><Loading /></el-icon>
          加载中...
        </div>
        
        <div v-if="!isLoading && proxyList.length === 0" class="empty-state">
          <el-icon><Box /></el-icon>
          <p>暂无反向代理配置</p>
        </div>
        
        <div v-if="proxyList.length > 0" class="table-responsive">
          <table class="proxy-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>内网地址</th>
                <th>内网端口</th>
                <th>映射端口</th>
                <th>协议</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in proxyList" :key="item.name" :class="{ 'stopped-row': !item.switch }">
                <td data-label="名称">{{ item.name }}</td>
                <td data-label="内网地址">{{ item.targetIP }}</td>
                <td data-label="内网端口">{{ item.targetPort }}</td>
                <td data-label="映射端口">{{ item.mappingPort }}</td>
                <td data-label="协议">{{ item.protocol }}</td>
                <td data-label="状态" class="status-cell">
                  <div class="status-content" :class="getStatusClass(item.status)">
                    {{ item.status }}
                  </div>
                </td>
                <td data-label="操作" class="action-cell">
                  <el-button 
                    v-if="!item.switch"
                    type="success" 
                    size="small" 
                    @click="startProxy(item)"
                  >
                    启动
                  </el-button>
                  <el-button 
                    v-else
                    type="warning" 
                    size="small" 
                    @click="stopProxy(item)"
                  >
                    停止
                  </el-button>
                  <el-button 
                    v-if="!item.switch"
                    type="primary" 
                    size="small" 
                    @click="showEditDialog(item)"
                  >
                    编辑
                  </el-button>
                  <el-button 
                    v-if="!item.switch"
                    type="danger" 
                    size="small" 
                    @click="deleteProxy(item)"
                  >
                    删除
                  </el-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 新增/编辑代理对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :before-close="handleCloseDialog"
    >
      <el-form 
        :model="proxyForm" 
        :rules="formRules" 
        ref="proxyFormRef"
        label-position="top"
      >
        <el-form-item label="名称" prop="name">
          <el-input 
            v-model="proxyForm.name" 
            placeholder="3-15个字符，只能是数字或字母"
            :disabled="isEditing"
          />
        </el-form-item>
        
        <el-form-item label="内网IP地址" prop="targetIP">
          <el-input v-model="proxyForm.targetIP" placeholder="例如: 127.0.0.1" />
        </el-form-item>
        
        <el-form-item label="内网端口号" prop="targetPort">
          <el-input 
            v-model.number="proxyForm.targetPort" 
            type="number" 
            placeholder="1-65535"
          />
        </el-form-item>
        
        <el-form-item label="映射端口号" prop="mappingPort">
          <el-input 
            v-model.number="proxyForm.mappingPort" 
            type="number" 
            placeholder="0-65535"
          />
        </el-form-item>
        
        <el-form-item label="协议" prop="protocol">
          <el-select v-model="proxyForm.protocol" placeholder="请选择协议">
            <el-option label="TCP" value="TCP" />
            <el-option label="UDP" value="UDP" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitProxyForm">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, Box } from '@element-plus/icons-vue'
import { API_BASE_URL } from "@/config";
import { useRouter } from 'vue-router'

export default {
  name: 'ReverseProxy',
  components: { Loading, Box },
  setup() {
    const router = useRouter()
    const proxyList = ref([])
    const isLoading = ref(false)
    const intervalId = ref(null)
    const dialogVisible = ref(false)
    const isEditing = ref(false)
    const proxyFormRef = ref(null)
    const isEditingForm = ref(false)
    const dialogTitle = ref('新增反向代理')
    const currentEditItem = ref(null)
    
    // 页面状态
    const isLogin = ref(false)
    const loginUsername = ref('')
    const isAdmin = ref(false)
    
    // 表单数据
    const proxyForm = ref({
      name: '',
      targetIP: '127.0.0.1',
      targetPort: '',
      mappingPort: '',
      protocol: 'TCP'
    })
    
    // 表单验证规则
    const formRules = {
      name: [
        { required: true, message: '请输入名称', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9]{3,15}$/, message: '名称3-15个字符，只能是数字或字母', trigger: 'blur' }
      ],
      targetIP: [
        { required: true, message: '请输入内网IP地址', trigger: 'blur' },
        { 
          validator: (rule, value, callback) => {
            const exp = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
            if (exp.test(value)) {
              callback()
            } else {
              callback(new Error('请输入有效的IP地址'))
            }
          },
          trigger: 'blur'
        }
      ],
      targetPort: [
        { required: true, message: '请输入内网端口号', trigger: 'blur' },
        { type: 'number', min: 1, max: 65535, message: '端口号范围1-65535', trigger: 'blur' }
      ],
      mappingPort: [
        { required: true, message: '请输入映射端口号', trigger: 'blur' },
        { type: 'number', min: 0, max: 65535, message: '端口号范围0-65535', trigger: 'blur' }
      ],
      protocol: [
        { required: true, message: '请选择协议', trigger: 'change' }
      ]
    }
    
    // 获取状态样式类
    const getStatusClass = (status) => {
      if (!status) return 'stopped'
      
      const lowerStatus = status.toLowerCase()
      
      if (lowerStatus.includes('failed') || lowerStatus.includes('失败')) {
        return 'failed'
      } else if (lowerStatus.includes('success') || lowerStatus.includes('running') || lowerStatus.includes('运行中')) {
        return 'running'
      } else {
        return 'stopped'
      }
    }
    
    // 显示新增对话框
    const showAddDialog = () => {   
      isEditing.value = false
      dialogTitle.value = '新增反向代理'
      proxyForm.value = {
        name: '',
        targetIP: '127.0.0.1',
        targetPort: '',
        mappingPort: '',
        protocol: 'TCP'
      }
      dialogVisible.value = true
    }
    
    // 显示编辑对话框
    const showEditDialog = (item) => {
      if (item.switch) {
        ElMessage.warning('请先停止该代理再进行编辑')
        return
      }
      
      isEditing.value = true
      dialogTitle.value = '编辑反向代理'
      currentEditItem.value = item
      proxyForm.value = {
        name: item.name,
        targetIP: item.targetIP,
        targetPort: item.targetPort,
        mappingPort: item.mappingPort,
        protocol: item.protocol
      }
      dialogVisible.value = true
    }
    
    // 关闭对话框前的确认
    const handleCloseDialog = (done) => {
      ElMessageBox.confirm('确定要放弃修改吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        done()
      }).catch(() => {})
    }
    
    // 提交表单
    const submitProxyForm = async () => {
      try {
        await proxyFormRef.value.validate()
        
        const url = isEditing.value ? '/update-reverse-proxy' : '/add-reverse-proxy'
        const method = 'POST'
        
        const params = new URLSearchParams()
        params.append('name', proxyForm.value.name)
        params.append('targetIP', proxyForm.value.targetIP)
        params.append('targetPort', proxyForm.value.targetPort)
        params.append('mappingPort', proxyForm.value.mappingPort)
        params.append('protocol', proxyForm.value.protocol)
        
        // 如果是编辑，保留原始名称用于更新
        if (isEditing.value && currentEditItem.value) {
          params.append('originalName', currentEditItem.value.name)
        }
        
        const response = await fetch(`${API_BASE_URL}${url}`, {
          method,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        })
        
        if (!response.ok) {
          throw new Error('操作失败')
        }
        
        const data = await response.json()
        if (data.errCode === 0) {
          ElMessage.success(data.errMsg || '操作成功')
        } else {
          ElMessage.error(data.errMsg || '操作失败')
        }
        dialogVisible.value = false
        fetchData()
      } catch (error) {
        ElMessage.error(error.message || '操作失败')
      }
    }
    
    // 启动代理
    const startProxy = async (item) => {
      try {
        const params = new URLSearchParams()
        params.append('name', item.name)
        
        const response = await fetch(`${API_BASE_URL}/start-reverse-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        })
        
        if (!response.ok) {
          throw new Error('启动失败')
        }
        
        const data = await response.json()
        if (data.errCode === 0) {
          ElMessage.success(data.errMsg || '启动成功')
        } else {
          ElMessage.error(data.errMsg || '启动失败')
        }

        fetchData()
      } catch (error) {
        ElMessage.error(error.message || '启动失败')
      }
    }
    
    // 停止代理
    const stopProxy = async (item) => {
      try {
        const params = new URLSearchParams()
        params.append('name', item.name)
        params.append('flag', 'off')
        
        const response = await fetch(`${API_BASE_URL}/stop-reverse-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        })
        
        if (!response.ok) {
          throw new Error('停止失败')
        }
        
        const data = await response.json()
        if (data.errCode === 0) {
          ElMessage.success(data.errMsg || '停止成功')
        } else {
          ElMessage.error(data.errMsg || '停止失败')
        }
        fetchData()
      } catch (error) {
        ElMessage.error(error.message || '停止失败')
      }
    }
    
    // 删除代理
    const deleteProxy = (item) => {
      ElMessageBox.confirm('确定要删除该代理吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const params = new URLSearchParams()
          params.append('name', item.name)
          
          const response = await fetch(`${API_BASE_URL}/delete-reverse-proxy`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            credentials: 'include',
            body: params
          })
          
          if (!response.ok) {
            throw new Error('删除失败')
          }
          
          const data = await response.json()
          if (data.errCode === 0) {
            ElMessage.success(data.errMsg || '删除成功')
          } else {
            ElMessage.error(data.errMsg || '删除失败')
          }
          fetchData()
        } catch (error) {
          ElMessage.error(error.message || '删除失败')
        }
      }).catch(() => {})
    }
    
    // 刷新数据
    const refreshData = () => {
      fetchData()
    }
    
    // 停止自动刷新
    const stopAutoRefresh = () => {
      if (intervalId.value) {
        clearInterval(intervalId.value)
        intervalId.value = null
      }
      isEditingForm.value = true
    }
    
    // 开始自动刷新
    const startAutoRefresh = () => {
      isEditingForm.value = false
      if (!intervalId.value && !isEditingForm.value) {
        intervalId.value = setInterval(() => {
          fetchData()
        }, 5000)
      }
    }
    
    // 获取数据
    const fetchData = async () => {
      try {
        isLoading.value = true
        const response = await fetch(`${API_BASE_URL}/reverse-proxy`, {
          method: 'GET',
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error('获取数据失败')
        }
        
        const result = await response.json()
        
        if (result.errCode === 1000) {
          ElMessage.error('请先登录系统')
          router.push('/user-login?callback=reverse-proxy')
          return
        }
        
        if (result.errCode != 0) {
          ElMessage.error(result.errMsg)
          return
        }
        
        proxyList.value = result.data?.reverseProxyPort || []
        isLogin.value = result.isLogin || false
        loginUsername.value = result.loginUsername || ''
        isAdmin.value = result.isAdmin || false
        
      } catch (error) {
        console.error('获取数据失败:', error)
        ElMessage.error(error.message || '获取数据失败')
        proxyList.value = []
      } finally {
        isLoading.value = false
      }
    }
    
    // 初始化数据
    onMounted(() => {
      fetchData()
      startAutoRefresh()
      
      // 在组件卸载时清除定时器
      onUnmounted(() => {
        if (intervalId.value) {
          clearInterval(intervalId.value)
        }
      })
    })
    
    return {
      proxyList,
      isLoading,
      dialogVisible,
      isEditing,
      proxyForm,
      proxyFormRef,
      formRules,
      isLogin,
      loginUsername,
      isAdmin,
      dialogTitle,
      showAddDialog,
      showEditDialog,
      handleCloseDialog,
      submitProxyForm,
      startProxy,
      stopProxy,
      deleteProxy,
      refreshData,
      getStatusClass,
      stopAutoRefresh,
      startAutoRefresh
    }
  }
}
</script>

<style scoped lang="scss">
.reverse-proxy-container {
  padding: 0px;
  max-width: 100%;
  margin: 0 auto;
}

.settings-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  overflow: hidden;
  
  .card-header {
    padding: 20px;
    border-bottom: 1px solid #ebeef5;
    
    .card-title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 8px;
    }
    
    .card-subtitle {
      font-size: 14px;
      color: #606266;
      margin: 0;
      
      .text-danger {
        color: #f56c6c;
        font-weight: 500;
      }
    }
  }
  
  .card-body {
    padding: 20px;
    
    .description-text {
      font-size: 14px;
      color: #606266;
      margin: 0;
    }
  }
}

.btn-group {
  display: flex;
  gap: 8px;
}

.table-responsive {
  overflow-x: auto;
}

.proxy-table {
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
  }
  
  tr:hover td {
    background-color: #f5f7fa;
  }
  
  .stopped-row {
    opacity: 0.7;
    background-color: #fafafa;
    
    &:hover td {
      background-color: #f5f5f5;
    }
  }
}

.status-cell {
  max-width: 300px;

  .status-content {
    white-space: normal;
    word-break: break-word;
    
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
}

.action-cell {
  white-space: nowrap;
  
  .el-button + .el-button {
    margin-left: 8px;
  }
}

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
  
  .el-icon {
    font-size: 32px;
    margin-bottom: 12px;
    animation: rotating 2s linear infinite;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
  
  .el-icon {
    font-size: 32px;
    margin-bottom: 12px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式处理 */
@media (max-width: 768px) {
  .proxy-table {
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
  
  .settings-card {
    .card-header {
      padding: 16px;
    }
    
    .card-body {
      padding: 16px;
    }
  }
  
  .btn-group {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}
</style>