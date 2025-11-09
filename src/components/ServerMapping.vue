<template>
  <div class="port-mapping-container">
    <!-- 服务器信息卡片 -->
    <div class="settings-card">
      <div class="card-header">
        <h3 class="card-title">映射服务器</h3>
        <p class="card-subtitle">
          <span v-if="flagChooseServer">{{ ipAddr }}</span>
          <router-link v-else to="/transfer-server" class="text-danger">
            请选择中转服务器
          </router-link>
        </p>
      </div>
      <div class="card-body">
        <p class="description-text">
          端口映射是将内网主机端口映射到外网端口。当用户访问外网端口时，将自动将请求转为访问对应内网主机端口服务。
        </p>
      </div>
    </div>

    <!-- 端口映射列表卡片 -->
    <div class="settings-card">
      <div class="card-header">
        <div class="d-flex justify-content-between align-items-center">
          <h3 class="card-title">端口映射列表</h3>
          <div class="btn-group">
            <el-button type="primary" size="small" @click="showAddDialog">新增</el-button>
            <el-button type="warning" size="small" @click="stopAll">停止所有</el-button>
            <el-button type="success" size="small" @click="restartAll">重启所有</el-button>
            <el-button type="info" size="small" @click="refreshData">刷新</el-button>
          </div>
        </div>
      </div>
      
      <div class="card-body">
        <div v-if="isLoading" class="loading-overlay">
          <el-icon class="is-loading"><Loading /></el-icon>
          加载中...
        </div>
        
        <div v-if="!isLoading && mappingList.length === 0" class="empty-state">
          <el-icon><Box /></el-icon>
          <p>暂无端口映射配置</p>
        </div>
        
        <div v-if="mappingList.length > 0" class="table-responsive">
          <table class="mapping-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>内网地址</th>
                <th>内网端口号</th>
                <th>映射端口号</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in mappingList" :key="item.name" :class="{ 'stopped-row': !isRunning(item.result) }">
                <td data-label="名称">{{ item.name }}</td>
                <td data-label="内网地址">{{ item.targetIP }}</td>
                <td data-label="内网端口号">{{ item.targetPort }}</td>
                <td data-label="映射端口号">{{ item.mappingPort }}</td>
                <td data-label="状态" class="status-cell">
                  <div class="status-content" :class="getStatusClass(item.result)">
                    {{ item.result }}
                  </div>
                </td>
                <td data-label="操作" class="action-cell">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="showEditDialog(item)"
                    :disabled="isRunning(item.result)"
                  >
                    编辑
                  </el-button>
                  <el-button 
                    v-if="!isRunning(item.result)"
                    type="success" 
                    size="small" 
                    @click="startMapping(item.name)"
                  >
                    启动
                  </el-button>
                  <el-button 
                    v-else
                    type="warning" 
                    size="small" 
                    @click="stopMapping(item.name)"
                  >
                    停止
                  </el-button>
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click="deleteMapping(item.name)"
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

    <!-- 新增/编辑映射对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑端口映射' : '新增端口映射'"
      :width="isMobile ? '100%' : '600px'"
      :before-close="handleCloseDialog"
    >
      <el-form 
        :model="mappingForm" 
        :rules="formRules" 
        ref="mappingFormRef"
        label-position="top"
      >
        <el-form-item label="名称" prop="name">
          <el-input 
            v-model="mappingForm.name" 
            placeholder="3-15个字符，只能是数字或字母"
            :disabled="isEditing"
          />
        </el-form-item>
        
        <el-form-item label="内网IP地址" prop="targetIP">
          <el-input v-model="mappingForm.targetIP" placeholder="例如: 127.0.0.1" />
        </el-form-item>
        
        <el-form-item label="内网端口号" prop="targetPort">
          <el-input 
            v-model.number="mappingForm.targetPort" 
            type="number" 
            placeholder="1-65535"
          />
        </el-form-item>
        
        <el-form-item label="映射端口号" prop="mappingPort">
          <el-input 
            v-model.number="mappingForm.mappingPort" 
            type="number" 
            placeholder="0-65535"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitMappingForm">保存</el-button>
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
  name: 'PortMapping',
  components: { Loading, Box },
  setup() {
    const router = useRouter()
    const mappingList = ref([])
    const isLoading = ref(false)
    const intervalId = ref(null)
    const dialogVisible = ref(false)
    const isEditing = ref(false)
    const mappingFormRef = ref(null)

    const isMobile = ref(false)

    // 检测移动端
    const checkMobile = () => {
      isMobile.value = window.innerWidth < 768
    }

    
    // 表单数据
    const mappingForm = ref({
      name: '',
      targetIP: '127.0.0.1',
      targetPort: '',
      mappingPort: ''
    })
    
    // 页面状态
    const flagChooseServer = ref(false)
    const ipAddr = ref('')
    
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
      ]
    }
    
    // 检查服务是否运行中
    const isRunning = (status) => {
      return status && !status.includes('stopped') && !status.includes('未启动') && !status.includes('not connect')
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
      if (!flagChooseServer.value) {
        ElMessage.warning('请先选择服务器')
        return
      }
      
      isEditing.value = false
      mappingForm.value = {
        name: '',
        targetIP: '127.0.0.1',
        targetPort: '',
        mappingPort: ''
      }
      dialogVisible.value = true
    }
    
    // 显示编辑对话框
    const showEditDialog = (item) => {
      if (isRunning(item.result)) {
        ElMessage.warning('请先停止该映射再进行编辑')
        return
      }
      
      isEditing.value = true
      mappingForm.value = {
        name: item.name,
        targetIP: item.targetIP,
        targetPort: item.targetPort,
        mappingPort: item.mappingPort
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
    const submitMappingForm = async () => {
      try {
        await mappingFormRef.value.validate()
        
        const url = isEditing.value ? '/update-mapping' : '/mapping'
        const method = isEditing.value ? 'POST' : 'POST'
        
        const params = new URLSearchParams()
        params.append('name', mappingForm.value.name)
        params.append('targetIP', mappingForm.value.targetIP)
        params.append('targetPort', mappingForm.value.targetPort)
        params.append('mappingPort', mappingForm.value.mappingPort)
        
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
        ElMessage.success(data.errMsg || '操作成功')
        dialogVisible.value = false
        fetchData()
      } catch (error) {
        ElMessage.error(error.message || '操作失败')
      }
    }
    
    // 启动映射
    const startMapping = async (name) => {
      try {
        const params = new URLSearchParams()
        params.append('name', name)
        params.append('flag', 'off')
        
        const response = await fetch(`${API_BASE_URL}/restart-mapping`, {
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
        ElMessage.success(data.errMsg || '启动成功')
        fetchData()
      } catch (error) {
        ElMessage.error(error.message || '启动失败')
      }
    }
    
    // 停止映射
    const stopMapping = async (name) => {
      try {
        const params = new URLSearchParams()
        params.append('name', name)
        params.append('flag', 'off')
        
        const response = await fetch(`${API_BASE_URL}/stop-mapping`, {
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
        ElMessage.success(data.errMsg || '停止成功')
        fetchData()
      } catch (error) {
        ElMessage.error(error.message || '停止失败')
      }
    }
    
    // 删除映射
    const deleteMapping = (name) => {
      ElMessageBox.confirm('确定要删除该映射吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/mapping?name=${name}`, {
            method: 'DELETE',
            credentials: 'include'
          })
          
          if (!response.ok) {
            throw new Error('删除失败')
          }
          
          const data = await response.json()
          ElMessage.success(data.errMsg || '删除成功')
          fetchData()
        } catch (error) {
          ElMessage.error(error.message || '删除失败')
        }
      }).catch(() => {})
    }
    
    // 停止所有映射
    const stopAll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/stop-mapping`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: 'flag=on'
        })
        
        if (!response.ok) {
          throw new Error('停止所有失败')
        }
        
        const data = await response.json()
        ElMessage.success(data.errMsg || '已停止所有映射')
        fetchData()
      } catch (error) {
        ElMessage.error(error.message || '停止所有失败')
      }
    }
    
    // 重启所有映射
    const restartAll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/restart-mapping`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: 'flag=on'
        })
        
        if (!response.ok) {
          throw new Error('重启所有失败')
        }
        
        const data = await response.json()
        if (data.errMsg.includes("not select server")) {
          ElMessage.warning('请先选择服务器!')
        } else {
          ElMessage.success(data.errMsg || '已重启所有映射')
        }
        fetchData()
      } catch (error) {
        ElMessage.error(error.message || '重启所有失败')
      }
    }
    
    // 刷新数据
    const refreshData = () => {
      fetchData()
    }
    
    // 获取数据
    const fetchData = async () => {
      try {
        isLoading.value = true
        const response = await fetch(`${API_BASE_URL}/mapping-list`, {
          method: 'GET',
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error('获取数据失败')
        }
        
        const result = await response.json()
        
        if (result.errCode === 1000) {
          ElMessage.error('请先登录系统')
          router.push('/user-login?callback=server-mapping')
          return
        }
        
        if (result.errCode != 0) {
          ElMessage.error(result.errMsg)
          return
        }
        
        mappingList.value = result.data || []
        flagChooseServer.value = result.flagChooseServer || false
        ipAddr.value = result.ipAddr || ''
        
      } catch (error) {
        console.error('获取数据失败:', error)
        ElMessage.error(error.message || '获取数据失败')
        mappingList.value = []
      } finally {
        isLoading.value = false
      }
    }
    
    // 初始化数据
    onMounted(() => {
      checkMobile()
      fetchData()
      
      // 每5秒刷新一次数据
      intervalId.value = setInterval(() => {
        fetchData()
      }, 5000)
      
      // 在组件卸载时清除定时器
      onUnmounted(() => {
        if (intervalId.value) {
          clearInterval(intervalId.value)
        }
      })
    })
    
    return {
      isMobile,
      mappingList,
      isLoading,
      dialogVisible,
      isEditing,
      mappingForm,
      mappingFormRef,
      formRules,
      flagChooseServer,
      ipAddr,
      showAddDialog,
      showEditDialog,
      handleCloseDialog,
      submitMappingForm,
      startMapping,
      stopMapping,
      deleteMapping,
      stopAll,
      restartAll,
      refreshData,
      isRunning,
      getStatusClass
    }
  }
}
</script>

<style scoped lang="scss">
.port-mapping-container {
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

.mapping-table {
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
      color: #67c23a; // 绿色表示运行中
    }
    
    &.stopped {
      color: #909399; // 灰色表示已停止
    }
    
    &.failed {
      color: #f56c6c; // 红色表示失败
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
  .mapping-table {
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