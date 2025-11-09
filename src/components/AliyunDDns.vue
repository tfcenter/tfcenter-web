<template>
  <div class="aliyun-ddns-container">
    <div class="main-content">
      <!-- 阿里云密钥配置卡片 -->
      <div class="config-card">
        <div class="card-header">
          <h3 class="card-title">阿里云访问密钥</h3>
          <el-button type="primary" size="small" @click="showKeyEditDialog">
            <el-icon><Edit /></el-icon>
            编辑密钥
          </el-button>
        </div>
        <div class="card-body">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="AccessKey ID">
              {{ keyForm.keyID || '未配置' }}
            </el-descriptions-item>
            <el-descriptions-item label="AccessKey Secret">
              {{ keyForm.keySecret ? '••••••••' : '未配置' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <!-- DDNS列表卡片 -->
      <div class="ddns-card">
        <div class="card-header">
          <div class="card-title-wrapper">
            <h3 class="card-title">DDNS列表</h3>
            <el-tag v-if="dnsSwitch" type="success">服务已启用</el-tag>
            <el-tag v-else type="danger">服务已禁用</el-tag>
          </div>
          <div class="card-actions">
            <el-button type="primary" size="small" @click="showDnsEditDialog(null)">
              <el-icon><Plus /></el-icon>
              新增记录
            </el-button>
          </div>
        </div>
        
        <div class="card-body">
          <el-table :data="dnsList" border style="width: 100%">
            <el-table-column prop="name" label="名称" width="100" align="center" />
            <el-table-column prop="RR" label="前缀" width="100" align="center" />
            <el-table-column prop="domainName" label="域名" width="150" align="center" />
            <el-table-column prop="type" label="类型" width="100" align="center">
              <template #default="{ row }">
                {{ row.type === 'A' ? 'IPv4' : 'IPv6' }}
              </template>
            </el-table-column>
            <el-table-column label="获取IP方式" width="120" align="center">
              <template #default="{ row }">
                {{ row.flag ? '自定义' : '自动获取' }}
              </template>
            </el-table-column>
            <el-table-column prop="value" label="映射IP" width="150" align="center" />
            <el-table-column prop="status" label="状态" width="200">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)" effect="plain">
                  {{ formatStatus(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" align="center">
              <template #default="{ row }">
                <div class="action-buttons">
                  <el-button
                    v-if="row.status.includes('已激活') || row.status.includes('存在多条映射')"
                    type="warning"
                    size="small"
                    @click="inactivateDns(row)"
                  >
                    取消激活
                  </el-button>
                  <el-button
                    v-else
                    type="primary"
                    size="small"
                    @click="updateDns(row)"
                  >
                    激活
                  </el-button>
                  
                  <el-button
                    v-if="!row.status.includes('已激活')"
                    type="danger"
                    size="small"
                    @click="deleteDns(row)"
                  >
                    删除
                  </el-button>
                  
                  <el-button
                    v-if="!row.status.includes('已激活')"
                    type="info"
                    size="small"
                    @click="showDnsEditDialog(row)"
                  >
                    编辑
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <!-- 阿里云密钥编辑对话框 -->
    <el-dialog
      v-model="keyDialogVisible"
      title="编辑阿里云访问密钥"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form 
        :model="keyForm" 
        :rules="keyRules" 
        ref="keyFormRef"
        label-width="120px"
      >
        <el-form-item label="AccessKey ID" prop="keyID">
          <el-input v-model="keyForm.keyID" placeholder="请输入阿里云AccessKey ID" />
        </el-form-item>
        
        <el-form-item label="AccessKey Secret" prop="keySecret">
          <el-input 
            v-model="keyForm.keySecret" 
            type="password"
            show-password
            placeholder="请输入阿里云AccessKey Secret"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="keyDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="saveAliKey"
            :loading="keyLoading"
          >
            保存密钥
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- DNS记录编辑对话框 -->
    <el-dialog
      v-model="dnsDialogVisible"
      :title="dnsDialogMode === 'edit' ? '编辑DNS记录' : '新增DNS记录'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form 
        :model="currentRecord" 
        :rules="recordRules" 
        ref="recordFormRef"
        label-width="120px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="currentRecord.name" :disabled="dnsDialogMode === 'edit'"/>
        </el-form-item>
        
        <el-form-item label="前缀" prop="RR">
          <el-input v-model="currentRecord.RR" />
        </el-form-item>
        
        <el-form-item label="域名" prop="domainName">
          <el-input v-model="currentRecord.domainName" />
        </el-form-item>
        
        <el-form-item label="记录类型" prop="type">
          <el-select v-model="currentRecord.type" style="width: 100%">
            <el-option label="IPv4 (A记录)" value="A" />
            <el-option label="IPv6 (AAAA记录)" value="AAAA" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="获取IP方式" prop="flagStr">
          <el-select 
            v-model="currentRecord.flagStr" 
            style="width: 100%"
            @change="handleFlagChange"
          >
            <el-option label="自动获取" value="auto" />
            <el-option label="自定义" value="define" />
          </el-select>
        </el-form-item>
        
        <el-form-item 
          label="IP地址" 
          prop="value"
          :rules="currentRecord.flagStr === 'define' ? [
            { required: true, message: '请输入IP地址', trigger: 'blur' },
            { validator: validateIP, trigger: 'blur' }
          ] : []"
        >
          <el-input 
            v-model="currentRecord.value" 
            :readonly="currentRecord.flagStr === 'auto'"
            :class="{ 'readonly-input': currentRecord.flagStr === 'auto' }"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dnsDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="saveDnsRecord"
            :loading="recordLoading"
          >
            {{ dnsDialogMode === 'edit' ? '更新' : '保存' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Plus } from '@element-plus/icons-vue'
import { API_BASE_URL } from "@/config"
import { useRouter } from 'vue-router'

const router = useRouter()

// 用户信息
const isAdmin = ref(false)
const isLogin = ref(false)
const loginUsername = ref('')

// 阿里云密钥表单
const keyForm = ref({
  keyID: '',
  keySecret: ''
})

const keyFormRef = ref(null)
const keyLoading = ref(false)
const keyDialogVisible = ref(false)

// 密钥验证规则
const keyRules = {
  keyID: [
    { required: true, message: '请输入AccessKey ID', trigger: 'blur' }
  ],
  keySecret: [
    { required: true, message: '请输入AccessKey Secret', trigger: 'blur' }
  ]
}

// DDNS相关数据
const dnsList = ref([])
const dnsSwitch = ref(true)
const refreshInterval = ref(null)

// DNS记录编辑对话框相关
const dnsDialogVisible = ref(false)
const currentRecord = ref({
  name: '',
  RR: '',
  domainName: '',
  type: 'A',
  flagStr: 'auto',
  value: '自动获取中...',
  flag: false
})
const recordFormRef = ref(null)
const recordLoading = ref(false)
const dnsDialogMode = ref('add')

// 记录验证规则
const recordRules = {
  name: [
    { required: true, message: '请输入记录名称', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]{1,64}$/, message: '名称只能包含字母、数字、下划线和横线', trigger: 'blur' }
  ],
  RR: [
    { required: true, message: '请输入记录前缀', trigger: 'blur' },
  ],
  domainName: [
    { required: true, message: '请输入域名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9.-]{1,255}$/, message: '请输入有效的域名', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择记录类型', trigger: 'blur' }
  ],
  flagStr: [
    { required: true, message: '请选择获取IP方式', trigger: 'blur' }
  ]
}

// IP地址验证
const validateIP = (rule, value, callback) => {
  if (currentRecord.value.flagStr === 'auto') {
    callback()
    return
  }
  
  const ipv4Exp = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6Exp = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  
  if (currentRecord.value.type === 'A' && !ipv4Exp.test(value)) {
    callback(new Error('请输入有效的IPv4地址'))
  } else if (currentRecord.value.type === 'AAAA' && !ipv6Exp.test(value)) {
    callback(new Error('请输入有效的IPv6地址'))
  } else {
    callback()
  }
}

// 获取状态标签类型
const getStatusTagType = (status) => {
  if (!status) return 'info'
  
  const lowerStatus = status.toLowerCase()
  
  if (lowerStatus.includes('已激活') || lowerStatus.includes('成功')) {
    return 'success'
  } else if (lowerStatus.includes('失败') || lowerStatus.includes('错误')) {
    return 'danger'
  } else if (lowerStatus.includes('未激活') || lowerStatus.includes('关闭')) {
    return 'warning'
  } else {
    return 'info'
  }
}

// 格式化状态显示
const formatStatus = (status) => {
  if (!status) return '未知状态'
  
  if (status.includes('已激活')) return '已激活'
  if (status.includes('未激活')) return '未激活'
  if (status.includes('失败')) return '失败'
  
  return status
}

// 处理获取IP方式变化
const handleFlagChange = () => {
  if (currentRecord.value.flagStr === 'auto') {
    currentRecord.value.value = '自动获取中...'
    currentRecord.value.flag = false
  } else {
    currentRecord.value.value = ''
    currentRecord.value.flag = true
  }
}

// 显示密钥编辑对话框
const showKeyEditDialog = () => {
  keyDialogVisible.value = true
}

// 显示DNS记录编辑对话框
const showDnsEditDialog = (record) => {
  if (record) {
    // 编辑现有记录
    dnsDialogMode.value = 'edit'
    currentRecord.value = {
      ...record,
      flagStr: record.flag ? 'define' : 'auto'
    }
  } else {
    // 新增记录
    dnsDialogMode.value = 'add'
    currentRecord.value = {
      name: '',
      RR: '',
      domainName: '',
      type: 'A',
      flagStr: 'auto',
      value: '自动获取中...',
      flag: false,
      status: '未配置'
    }
  }
  dnsDialogVisible.value = true
}

// 保存阿里云密钥
const saveAliKey = async () => {
  try {
    await keyFormRef.value.validate()
    keyLoading.value = true
    
    const params = new URLSearchParams()
    params.append('keyID', keyForm.value.keyID)
    params.append('keySecret', keyForm.value.keySecret)
    
    const response = await fetch(`${API_BASE_URL}/update-aliKey`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      credentials: 'include',
      body: params
    })
    
    if (!response.ok) throw new Error('网络请求失败')
    
    const data = await response.json()
    
    if (data.errCode !== 0) {
      throw new Error(data.errMsg || '保存失败')
    }
    
    ElMessage.success('阿里云密钥保存成功')
    keyDialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('保存阿里云密钥失败:', error)
    ElMessage.error(`保存失败: ${error.message || '未知错误'}`)
  } finally {
    keyLoading.value = false
  }
}

// 保存DNS记录
const saveDnsRecord = async () => {
  try {
    await recordFormRef.value.validate()
    recordLoading.value = true
    
    const params = new URLSearchParams()
    params.append('name', currentRecord.value.name)
    params.append('RR', currentRecord.value.RR)
    params.append('domainName', currentRecord.value.domainName)
    params.append('type', currentRecord.value.type)
    params.append('flagStr', currentRecord.value.flagStr)
    params.append('value', currentRecord.value.value)
    
    const endpoint = (dnsDialogMode.value === 'edit') ? '/update-aliDns' : '/add-aliDns'
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      credentials: 'include',
      body: params
    })
    
    if (!response.ok) throw new Error('网络请求失败')
    
    const data = await response.json()
    
    if (data.errCode !== 0) {
      throw new Error(data.errMsg || '操作失败')
    }
    
    ElMessage.success('DNS记录保存成功')
    dnsDialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('保存DNS记录失败:', error)
    ElMessage.error(`保存失败: ${error.message || '未知错误'}`)
  } finally {
    recordLoading.value = false
  }
}

// 更新DNS记录
const updateDns = async (record) => {
  try {
    const params = new URLSearchParams()
    params.append('name', record.name)
    params.append('RR', record.RR)
    params.append('domainName', record.domainName)
    params.append('type', record.type)
    params.append('flagStr', record.flag ? 'define' : 'auto')
    params.append('value', record.value)
    
    const response = await fetch(`${API_BASE_URL}/update-aliDns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      credentials: 'include',
      body: params
    })
    
    if (!response.ok) throw new Error('网络请求失败')
    
    const data = await response.json()
    
    if (data.errCode !== 0) {
      throw new Error(data.errMsg || '更新失败')
    }
    
    ElMessage.success('DNS记录更新成功')
    fetchData()
  } catch (error) {
    console.error('更新DNS记录失败:', error)
    ElMessage.error(`更新失败: ${error.message || '未知错误'}`)
  }
}

// 取消激活DNS记录
const inactivateDns = async (record) => {
  try {
    const params = new URLSearchParams()
    params.append('name', record.name)
    
    const response = await fetch(`${API_BASE_URL}/inactivate-aliDns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      credentials: 'include',
      body: params
    })
    
    if (!response.ok) throw new Error('网络请求失败')
    
    const data = await response.json()
    
    if (data.errCode !== 0) {
      throw new Error(data.errMsg || '取消激活失败')
    }
    
    ElMessage.success('DNS记录已取消激活')
    fetchData()
  } catch (error) {
    console.error('取消激活DNS记录失败:', error)
    ElMessage.error(`取消激活失败: ${error.message || '未知错误'}`)
  }
}

// 删除DNS记录
const deleteDns = async (record) => {
  try {
    await ElMessageBox.confirm('确定要删除这条DNS记录吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const params = new URLSearchParams()
    params.append('name', record.name)
    
    const response = await fetch(`${API_BASE_URL}/delete-aliDns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      credentials: 'include',
      body: params
    })
    
    if (!response.ok) throw new Error('网络请求失败')
    
    const data = await response.json()
    
    if (data.errCode !== 0) {
      throw new Error(data.errMsg || '删除失败')
    }
    
    ElMessage.success('DNS记录删除成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除DNS记录失败:', error)
      ElMessage.error(`删除失败: ${error.message || '未知错误'}`)
    }
  }
}

// 获取数据
const fetchData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/aliDns`, {
      credentials: 'include'
    })
    
    if (!response.ok) throw new Error('网络请求失败')
    
    const data = await response.json()
    if (data.errCode === 1000) {
        ElMessage.error('请先登录系统')
        router.push('/user-login?callback=aliyun-ddns')
        return
    }
    
    if (data.errCode !== 0) {
      throw new Error(data.errMsg || '获取数据失败')
    }
    
    // 更新用户信息
    isAdmin.value = data.isAdmin
    isLogin.value = data.isLogin
    loginUsername.value = data.loginUsername
    
    // 更新密钥信息
    if (data.data?.keyID) {
      keyForm.value.keyID = data.data.keyID
      keyForm.value.keySecret = data.data.keySecret
    }
    
    // 更新DDNS列表
    if (data.data?.DNSMapping) {
      dnsList.value = data.data.DNSMapping
    }
    
    // 更新开关状态
    dnsSwitch.value = data.dnsSwitch
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error(`获取数据失败: ${error.message || '未知错误'}`)
  }
}

// 初始化
onMounted(() => {
  fetchData()
  // 设置自动刷新，每10秒刷新一次数据
  refreshInterval.value = setInterval(fetchData, 10000)
})

// 组件卸载时清除定时器
onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})
</script>

<style scoped lang="scss">
.aliyun-ddns-container {
  padding: 0;
  max-width: 100%;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #f5f7fa;
  
  .header {
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: #fff;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    z-index: 100;
    display: flex;
    align-items: center;
    padding: 0 24px;
    
    .navbar {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      h1 {
        margin: 0;
        font-size: 20px;
        color: #303133;
      }
      
      .user-info {
        display: flex;
        align-items: center;
        gap: 12px;
        
        span {
          font-weight: 500;
          color: #606266;
        }
      }
    }
  }
  
  .main-content {
    margin-top: 50px;
    margin-left: 0px;
    padding: 24px;
    
    @media (max-width: 768px) {
      padding: 16px;
    }
  }
  
  .config-card,
  .ddns-card {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.08);
    margin-bottom: 24px;
    overflow: hidden;
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.12);
    }
    
    .card-header {
      padding: 16px 24px;
      border-bottom: 1px solid #ebeef5;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #f9fafc;
      
      .card-title-wrapper {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .card-title {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          margin: 0;
        }
      }
      
      .card-actions {
        display: flex;
        gap: 12px;
      }
    }
    
    .card-body {
      padding: 24px;
      
      .el-descriptions {
        :deep(.el-descriptions__body) {
          background-color: #f9fafc;
        }
      }
      
      .status-detail {
        margin-top: 4px;
        font-size: 12px;
        color: #909399;
        word-break: break-all;
      }
      
      .action-buttons {
        display: flex;
        gap: 8px;
        justify-content: center;
      }
      
      @media (max-width: 768px) {
        padding: 16px;
        
        .action-buttons {
          flex-direction: column;
          align-items: center;
        }
      }
    }
  }
  
  .readonly-input {
    background-color: #f5f7fa;
    color: #909399;
    
    :deep(.el-input__inner) {
      background-color: #f5f7fa;
      color: #909399;
      cursor: not-allowed;
    }
  }
  
  @media (max-width: 768px) {
    .config-card,
    .ddns-card {
      .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        
        .card-actions {
          width: 100%;
          justify-content: flex-end;
        }
      }
    }
  }
}
</style>