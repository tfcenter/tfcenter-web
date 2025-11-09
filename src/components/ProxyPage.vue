<template>
  <div class="proxy-management-container">
    <div class="main-content">
      <!-- 服务器信息卡片 -->
      <div class="proxy-card">
        <div class="card-header">
          <h3 class="card-title">正向代理服务器</h3>
        </div>
        <div class="card-body">
          <p class="description-text">
            正向代理是客户端（如用户浏览器）与互联网之间的中间服务器。代表客户端向外部服务器发送请求, 服务端不知道实际发起请求的客户端。
          </p>
        </div>
      </div>

      <!-- SOCKS5代理配置卡片 -->
      <div class="proxy-card">
        <div class="card-header">
          <h3 class="card-title">SOCKS5代理</h3>
          <el-button 
            type="primary" 
            size="small" 
            @click="showEditDialog('socks5')"
            :disabled="socks5.switch"
          >
            编辑配置
          </el-button>
        </div>
        <div class="card-body">
          <table class="proxy-table">
            <thead>
              <tr>
                <th>IP地址</th>
                <th>端口号</th>
                <th>用户名</th>
                <th>密码</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ socks5.ip }}</td>
                <td>{{ socks5.port }}</td>
                <td>{{ socks5.username || '无认证' }}</td>
                <td>
                  <div class="password-field">
                    <span v-if="showSocks5Password">{{ socks5.password || '无密码' }}</span>
                    <span v-else>••••••</span>
                    <el-icon class="eye-icon" @click="showSocks5Password = !showSocks5Password">
                      <View v-if="showSocks5Password" />
                      <Hide v-else />
                    </el-icon>
                  </div>
                </td>
                <td>
                  <div :class="['status-badge', getStatusClass(socks5.status)]">
                    {{ formatStatus(socks5.status) }}
                  </div>
                </td>
                <td class="action-cell">
                  <el-button
                    v-if="socks5.switch"
                    type="warning"
                    @click="toggleProxy('socks5', false)"
                    :loading="socks5Loading"
                  >
                    停止
                  </el-button>
                  <el-button
                    v-else
                    type="success"
                    @click="toggleProxy('socks5', true)"
                    :loading="socks5Loading"
                  >
                    启动
                  </el-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- HTTPS代理配置卡片 -->
      <div class="proxy-card">
        <div class="card-header">
          <h3 class="card-title">HTTPS代理</h3>
          <el-button 
            type="primary" 
            size="small" 
            @click="showEditDialog('https')"
            :disabled="proxy.switch"
          >
            编辑配置
          </el-button>
        </div>
        <div class="card-body">
          <table class="proxy-table">
            <thead>
              <tr>
                <th>IP地址</th>
                <th>端口号</th>
                <th>用户名</th>
                <th>密码</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ proxy.ip }}</td>
                <td>{{ proxy.port }}</td>
                <td>{{ proxy.username || '无认证' }}</td>
                <td>
                  <div class="password-field">
                    <span v-if="showHttpsPassword">{{ proxy.password || '无密码' }}</span>
                    <span v-else>••••••</span>
                    <el-icon class="eye-icon" @click="showHttpsPassword = !showHttpsPassword">
                      <View v-if="showHttpsPassword" />
                      <Hide v-else />
                    </el-icon>
                  </div>
                </td>
                <td>
                  <div :class="['status-badge', getStatusClass(proxy.status)]">
                    {{ formatStatus(proxy.status) }}
                  </div>
                </td>
                <td class="action-cell">
                  <el-button
                    v-if="proxy.switch"
                    type="warning"
                    @click="toggleProxy('https', false)"
                    :loading="httpsLoading"
                  >
                    停止
                  </el-button>
                  <el-button
                    v-else
                    type="success"
                    @click="toggleProxy('https', true)"
                    :loading="httpsLoading"
                  >
                    启动
                  </el-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 编辑配置对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="`编辑${dialogType === 'socks5' ? 'SOCKS5' : 'HTTPS'}代理配置`"
      width="500px"
    >
      <el-form 
        :model="dialogForm" 
        :rules="formRules" 
        ref="dialogFormRef"
        label-width="120px"
      >
        <el-form-item label="IP地址" prop="ip">
          <el-input v-model="dialogForm.ip" placeholder="例如: 0.0.0.0" />
        </el-form-item>
        
        <el-form-item label="端口号" prop="port">
          <el-input 
            v-model.number="dialogForm.port" 
            type="number" 
            placeholder="1-65535"
          />
        </el-form-item>
        
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="dialogForm.username" 
            placeholder="留空表示不需要认证"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="dialogForm.password" 
            type="password"
            show-password
            placeholder="留空表示不需要认证"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitProxyConfig"
            :loading="dialogLoading"
          >
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { View, Hide } from '@element-plus/icons-vue'
import { API_BASE_URL } from "@/config";
import { useRouter } from 'vue-router'

export default {
  name: 'ProxyManagement',
  components: {
    View,
    Hide
  },
  setup() {
    const router = useRouter()
    
    // 用户信息
    const isAdmin = ref(false)
    const isLogin = ref(false)
    const loginUsername = ref('')
    
    // 代理数据
    const socks5 = ref({
      index: 0,
      ip: '0.0.0.0',
      port: 0,
      username: '',
      password: '',
      switch: false,
      status: 'not running'
    })
    
    const proxy = ref({
      index: 0,
      ip: '0.0.0.0',
      port: 0,
      username: '',
      password: '',
      switch: false,
      status: 'not running'
    })
    
    // 密码显示状态
    const showSocks5Password = ref(false)
    const showHttpsPassword = ref(false)
    
    // 对话框相关
    const dialogVisible = ref(false)
    const dialogType = ref('socks5') // 'socks5' or 'https'
    const dialogForm = ref({
      ip: '',
      port: '',
      username: '',
      password: ''
    })
    const dialogFormRef = ref(null)
    const dialogLoading = ref(false)
    
    // 加载状态
    const socks5Loading = ref(false)
    const httpsLoading = ref(false)
    
    // 表单验证规则
    const formRules = {
      ip: [
        { required: true, message: '请输入IP地址', trigger: 'blur' },
        { 
          pattern: /^(\d{1,3}\.){3}\d{1,3}$/,
          message: '请输入有效的IP地址',
          trigger: 'blur'
        }
      ],
      port: [
        { required: true, message: '请输入端口号', trigger: 'blur' },
        { 
          type: 'number',
          min: 1,
          max: 65535,
          message: '端口号范围1-65535',
          trigger: 'blur'
        }
      ],
      username: [
        { 
          pattern: /^[a-zA-Z0-9]{0,15}$/,
          message: '用户名0-15个字符，只能是数字或字母',
          trigger: 'blur'
        }
      ],
      password: [
        { 
          pattern: /^[a-zA-Z0-9]{0,64}$/,
          message: '密码0-64个字符，只能是数字或字母',
          trigger: 'blur'
        }
      ]
    }
    
    // 获取状态样式类
    const getStatusClass = (status) => {
      if (!status) return 'stopped'
      
      const lowerStatus = status.toLowerCase()
      
      if (lowerStatus.includes('running') || lowerStatus.includes('active')) {
        return 'running'
      } else if (lowerStatus.includes('error') || lowerStatus.includes('fail')) {
        return 'error'
      } else {
        return 'stopped'
      }
    }
    
    // 格式化状态显示
    const formatStatus = (status) => {
      const statusMap = {
        'not running': '未运行',
        'running': '运行中',
        'stopped': '已停止',
        'error': '错误',
        'not connect': '未连接',
        'success': '成功'
      }
      return statusMap[status] || status
    }
    
    // 显示编辑对话框
    const showEditDialog = (type) => {
      dialogType.value = type
      const sourceData = type === 'socks5' ? socks5.value : proxy.value
      
      dialogForm.value = {
        ip: sourceData.ip,
        port: sourceData.port,
        username: sourceData.username,
        password: sourceData.password
      }
      
      dialogVisible.value = true
    }
    
    // 提交代理配置
    const submitProxyConfig = async () => {
      try {
        await dialogFormRef.value.validate()
        dialogLoading.value = true
        
        const isSocks5 = dialogType.value === 'socks5'
        const endpoint = isSocks5 ? '/update-socks5' : '/update-proxy'
        const proxyData = isSocks5 ? socks5 : proxy
        
        // 准备参数
        const params = new URLSearchParams()
        params.append('username', dialogForm.value.username)
        params.append('password', dialogForm.value.password)
        params.append('port', dialogForm.value.port)
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
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
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '操作失败')
        }
        
        // 更新本地数据
        Object.assign(proxyData.value, {
          ip: dialogForm.value.ip,
          port: dialogForm.value.port,
          username: dialogForm.value.username,
          password: dialogForm.value.password,
          switch: true, // 更新配置后自动启动
          status: 'running'
        })
        
        ElMessage.success('配置更新成功')
        dialogVisible.value = false
      } catch (error) {
        console.error('配置更新失败:', error)
        ElMessage.error('配置更新失败: ' + (error.message || '未知错误'))
      } finally {
        dialogLoading.value = false
      }
    }
    
    // 启动/停止代理
    const toggleProxy = async (type, start) => {
      try {
        const proxyData = type === 'socks5' ? socks5 : proxy
        const loadingRef = type === 'socks5' ? socks5Loading : httpsLoading
        
        loadingRef.value = true
        
        const endpoint = start 
          ? (type === 'socks5' ? '/start-socks5' : '/start-proxy')
          : (type === 'socks5' ? '/stop-socks5' : '/stop-proxy')
        
        const method = 'POST'
        const body = start ? null : 'flag=off' // 根据原HTML代码
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: body
        })
        
        if (!response.ok) {
          throw new Error('操作失败')
        }
        
        const data = await response.json()
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '操作失败')
        }
        
        // 更新本地状态
        proxyData.value.switch = start
        proxyData.value.status = start ? 'running' : 'stopped'
        
        ElMessage.success(`${start ? '启动' : '停止'}${type === 'socks5' ? 'SOCKS5' : 'HTTPS'}代理成功`)
      } catch (error) {
        console.error('操作失败:', error)
        ElMessage.error(`${start ? '启动' : '停止'}代理失败: ${error.message || '未知错误'}`)
      } finally {
        if (type === 'socks5') {
          socks5Loading.value = false
        } else {
          httpsLoading.value = false
        }
      }
    }
    
    // 获取代理数据
    const fetchProxyData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/get-proxy`, {
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error('获取代理数据失败')
        }
        
        const data = await response.json()
        if (data.errCode === 1000) {
          ElMessage.error('请先登录系统')
          router.push('/user-login?callback=proxy-mgmt')
          return
        }
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '获取代理数据失败')
        }
        
        isAdmin.value = data.isAdmin
        isLogin.value = data.isLogin
        loginUsername.value = data.loginUsername
        socks5.value = data.socks5
        proxy.value = data.proxy
      } catch (error) {
        console.error('获取代理数据失败:', error)
        ElMessage.error('获取代理数据失败: ' + error.message)
      }
    }
    
    // 初始化
    onMounted(() => {
      fetchProxyData()
      
      // 每10秒刷新一次数据
      const intervalId = setInterval(fetchProxyData, 10000)
      
      // 组件卸载时清除定时器
      return () => clearInterval(intervalId)
    })
    
    return {
      isAdmin,
      isLogin,
      loginUsername,
      socks5,
      proxy,
      showSocks5Password,
      showHttpsPassword,
      dialogVisible,
      dialogType,
      dialogForm,
      dialogFormRef,
      formRules,
      getStatusClass,
      formatStatus,
      showEditDialog,
      submitProxyConfig,
      toggleProxy,
      socks5Loading,
      httpsLoading,
      dialogLoading
    }
  }
}
</script>

<style scoped lang="scss">
.proxy-management-container {
  padding: 0;
  max-width: 100%;
  margin: 0 auto;
  
  .header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: #fff;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    z-index: 100;
    display: flex;
    align-items: center;
    padding: 0 20px;
    
    .navbar {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .user-info {
        display: flex;
        align-items: center;
        gap: 10px;
      }
    }
  }
  
  .main-content {
    margin-top: 10px;
    margin-left: 10px;
    padding: 0px 0px;
  }
  
  .proxy-card {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    margin-bottom: 24px;
    overflow: hidden;
    
    .card-header {
      padding: 16px 20px;
      border-bottom: 1px solid #ebeef5;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .card-title {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
        margin: 0;
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
  
  .proxy-table {
    width: 100%;
    border-collapse: collapse;
    
    th, td {
        padding: 10px 12px; /* 减小单元格内边距 */
        text-align: left;
        border-bottom: 1px solid #ebeef5;
    }
    
    th {
      background-color: #f5f7fa;
      color: #909399;
      font-weight: 600;
    }
    
    td {
      color: #606266;
      vertical-align: middle;
    }
  }
  
  .status-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    
    &.running {
      background-color: #f0f9eb;
      color: #67c23a;
    }
    
    &.stopped {
      background-color: #f5f5f5;
      color: #909399;
    }
    
    &.error {
      background-color: #fef0f0;
      color: #f56c6c;
    }
  }
  
  .password-field {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .eye-icon {
      cursor: pointer;
      color: #909399;
      font-size: 16px;
      
      &:hover {
        color: #409eff;
      }
    }
  }
  
  .action-cell {
    white-space: nowrap;
    
    .el-button + .el-button {
      margin-left: 8px;
    }
  }
  
  @media (max-width: 768px) {
    .proxy-table {
      display: block;
      overflow-x: auto;
    }
    
    .main-content {
        margin-top: 70px;
        padding: 10px 8px; /* 移动端左右padding减小到8px */
    }
    
    .proxy-card {
      .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        
        .el-button {
          align-self: flex-end;
        }
      }
    }
  }
}
</style>