<template>
  <div class="server-settings-container">
    <!-- 服务器设置卡片 -->
    <div class="settings-card">
      <div class="card-header">
        <h3 class="card-title">中转服务器设置</h3>
        <p class="card-subtitle">
          作为映射客户端，不需要开启服务，直接从下面的服务器列表中选择。<br>
          作为映射服务端，私人模式只能密钥匹配时使用，公共模式所有设备均可使用
          <span class="text-warning">(注:公共模式需将端口开放，另可在设置中设置端口分配范围)</span>
        </p>
      </div>
      
      <div class="card-body">
        <div class="table-responsive">
          <table class="server-config-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>地址</th>
                <th>端口号</th>
                <th>密钥</th>
                <th>二次认证</th>
                <th>最大连接数</th>
                <th>模式</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td data-label="名称">{{ serverConfig.SubName }}</td>
                <td data-label="地址">{{ serverConfig.IpAddr }}</td>
                <td data-label="端口号">{{ serverConfig.Port }}</td>
                <td data-label="密钥">
                  <div class="password-field">
                    <span v-if="showPrivToken">{{ serverConfig.PrivToken }}</span>
                    <span v-else>••••••</span>
                    <el-icon class="eye-icon" @click="showPrivToken = !showPrivToken">
                      <View v-if="showPrivToken" />
                      <Hide v-else />
                    </el-icon>
                  </div>
                </td>
                <td data-label="二次认证">
                  <div class="password-field" v-if="serverConfig.SecondToken">
                    <span v-if="showSecondToken">{{ serverConfig.SecondToken }}</span>
                    <span v-else>••••••</span>
                    <el-icon class="eye-icon" @click="showSecondToken = !showSecondToken">
                      <View v-if="showSecondToken" />
                      <Hide v-else />
                    </el-icon>
                  </div>
                  <span v-else>无</span>
                </td>
                <td data-label="最大连接数">{{ serverConfig.MaxConnectNum }}</td>
                <td data-label="模式">
                  <span class="status-badge" :class="getStatusClass()">
                    {{ getServerStatusText() }}
                  </span>
                </td>
                <td data-label="备注">{{ serverConfig.Remark || '无' }}</td>
                <td data-label="操作">
                  <el-button type="primary" size="small" @click="showEditDialog">
                    编辑配置
                  </el-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 可用服务器列表 -->
    <div class="settings-card">
      <div class="card-header">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h3 class="card-title">可用中转服务器</h3>
            <p class="card-subtitle">
              选择后用于
              <router-link to="/server-mapping" class="link">端口映射</router-link> 
              和
              <router-link to="/p2p-client" class="link">p2p映射</router-link>使用。
              <el-button type="warning" size="small" @click="forceCancelSelect">
                强制取消选择
              </el-button>
            </p>
          </div>
        </div>
      </div>
      
      <div class="card-body">
        <div v-if="isLoading" class="loading-overlay">
          <el-icon class="is-loading"><Loading /></el-icon>
          加载中...
        </div>
        
        <div v-if="!isLoading && filteredServerList.length === 0" class="empty-state">
          <el-icon><Box /></el-icon>
          <p>{{ dataMsg }}</p>
        </div>
        
        <div v-if="filteredServerList.length > 0" class="table-responsive">
          <table class="server-list-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>属性</th>
                <th>地址</th>
                <th>端口号</th>
                <th>端口号(新)</th>
                <th>P2P服务</th>
                <th>二次认证</th>
                <th>连接数/总数</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="server in filteredServerList" :key="server.Name" 
                  :class="{ 'selected-row': server.SelectStatus }">
                <td data-label="名称">
                  <span v-if="server.SelectStatus" class="selected-indicator">(*)</span>
                  {{ server.SubName }}
                </td>
                <td data-label="属性">
                  <span class="server-type-badge" :class="getServerTypeClass(server)">
                    {{ getServerTypeText(server) }}
                  </span>
                </td>
                <td data-label="地址">{{ server.IpAddr }}</td>
                <td data-label="端口号" :class="getPortStatusClass(server.Port)">
                  {{ server.Port === 0 ? '未开启' : server.Port }}
                </td>
                <td data-label="端口号(新)" :class="getPortStatusClass(server.TunnelServerPort)">
                  {{ server.TunnelServerPort === 0 ? '未开启' : server.TunnelServerPort }}
                </td>
                <td data-label="P2P服务" :class="getPortStatusClass(server.P2PServerPort)">
                  {{ server.P2PServerPort === 0 ? '未开启' : server.P2PServerPort }}
                </td>
                <td data-label="二次认证">
                  <span class="auth-badge" :class="server.SecondTokenFlag ? 'enabled' : 'disabled'">
                    {{ server.SecondTokenFlag ? '开启' : '关闭' }}
                  </span>
                </td>
                <td data-label="连接数/总数">
                  <div class="connection-progress">
                    <div class="progress-label">
                      {{ server.ConnectNum }}/{{ server.MaxConnectNum }}
                    </div>
                    <el-progress 
                      :percentage="getConnectionPercentage(server)"
                      :color="getProgressColor(server)"
                      :show-text="false"
                      :stroke-width="16"
                    />
                  </div>
                </td>
                <td data-label="备注" class="remark-cell">{{ server.Remark }}</td>
                <td data-label="操作">
                  <el-button 
                    v-if="server.SelectStatus" 
                    type="danger" 
                    size="small" 
                    @click="unselectServer(server)"
                  >
                    取消
                  </el-button>
                  <el-button 
                    v-else 
                    type="primary" 
                    size="small" 
                    @click="selectServer(server)"
                  >
                    选择
                  </el-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 编辑服务器配置对话框 - 修改为响应式 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑服务器配置"
      :width="isMobile ? '100%' : '600px'"
      :before-close="handleCloseDialog"
    >
      <el-form 
        :model="editForm" 
        label-width="120px" 
        :rules="editRules" 
        ref="editFormRef"
        label-position="top"
      >
        <div class="form-grid">
          <el-form-item label="服务器名称" prop="SubName">
            <el-input v-model="editForm.SubName" disabled />
          </el-form-item>
          
          <el-form-item label="IP地址" prop="IpAddr">
            <el-input v-model="editForm.IpAddr" placeholder="请输入服务器IP地址" />
          </el-form-item>
          
          <el-form-item label="端口号" prop="Port">
            <el-input 
              v-model.number="editForm.Port" 
              type="number" 
              min="0" 
              max="65535" 
              placeholder="0-65535"
            />
          </el-form-item>
          
          <el-form-item label="密钥" prop="PrivToken">
            <el-input 
              v-model="editForm.PrivToken" 
              show-password 
              placeholder="5-15位字母数字组合"
            />
          </el-form-item>
          
          <el-form-item label="二次认证密钥" prop="SecondToken">
            <el-input 
              v-model="editForm.SecondToken" 
              show-password 
              placeholder="可选，最多20位"
            />
          </el-form-item>
          
          <el-form-item label="最大连接数" prop="MaxConnectNum">
            <el-input 
              v-model.number="editForm.MaxConnectNum" 
              type="number" 
              min="1" 
              max="999" 
              placeholder="1-999"
            />
          </el-form-item>
          
          <el-form-item label="服务模式" prop="ServiceMode">
            <el-select 
              v-model="editForm.ServiceMode" 
              placeholder="请选择服务模式"
              class="full-width"
            >
              <el-option label="私人模式" value="private"></el-option>
              <el-option label="公共模式" value="public"></el-option>
              <el-option label="无(已关闭)" value="none"></el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="备注" prop="Remark">
            <el-input 
              v-model="editForm.Remark" 
              type="textarea" 
              :rows="2" 
              placeholder="可选备注信息"
            />
          </el-form-item>
        </div>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEditForm">保存配置</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import CryptoJS from "crypto-js";
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { API_BASE_URL } from "@/config";
import { Loading, Box, View, Hide } from '@element-plus/icons-vue'

export default {
  name: 'ServerSettings',
  components: { Loading, Box, View, Hide },
  setup() {
    const router = useRouter()
    const serverConfig = ref({
      Name: '',
      SubName: '',
      IpAddr: '',
      Port: '',
      PrivToken: '',
      SecondToken: '',
      MaxConnectNum: '',
      Remark: '',
      ServiceMode: 'none',
      LocalSwitch: false,
      GlobalSwitch: false
    })

    const serverList = ref([])
    const dataMsg = ref('加载中...')
    const isLogin = ref(false)
    const loginUsername = ref('')
    const isLoading = ref(false)
    const intervalId = ref(null)
    const showPrivToken = ref(false)
    const showSecondToken = ref(false)
    const isMobile = ref(false)

    // 检测移动端
    const checkMobile = () => {
      isMobile.value = window.innerWidth < 768
    }


    // 计算属性：过滤有效的服务器列表
    const filteredServerList = computed(() => {
      return serverList.value.filter(server => server.Status)
    })

    // 获取服务器状态文本
    const getServerStatusText = () => {
      if (serverConfig.value.LocalSwitch) return '私人模式'
      if (serverConfig.value.GlobalSwitch) return '公共模式'
      return '无(已关闭)'
    }

    // 获取服务器状态样式类
    const getStatusClass = () => {
      if (serverConfig.value.LocalSwitch) return 'private'
      if (serverConfig.value.GlobalSwitch) return 'public'
      return 'disabled'
    }

    // 获取服务器类型文本
    const getServerTypeText = (server) => {
      if (server.IsBelong) return '官方'
      if (server.Global) return '公共'
      return '私人'
    }

    // 获取服务器类型样式类
    const getServerTypeClass = (server) => {
      if (server.IsBelong) return 'official'
      if (server.Global) return 'public'
      return 'private'
    }

    // 获取端口状态样式类
    const getPortStatusClass = (port) => {
      return port === 0 ? 'disabled' : 'enabled'
    }

    // 获取连接百分比
    const getConnectionPercentage = (server) => {
      return Math.min(100, (server.ConnectNum / server.MaxConnectNum) * 100)
    }

    // 获取进度条颜色
    const getProgressColor = (server) => {
      const percentage = server.ConnectNum / server.MaxConnectNum
      if (percentage < 0.7) return '#67C23A'
      if (percentage < 0.9) return '#E6A23C'
      return '#F56C6C'
    }

    // 辅助函数：将对象转换为URL编码的字符串
    const encodeFormData = (data) => {
      return Object.keys(data)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
        .join('&')
    }

    // 编辑对话框相关状态
    const editDialogVisible = ref(false)
    const editFormRef = ref(null)
    const editForm = ref({
      Name: '',
      SubName: '',
      IpAddr: '',
      Port: '',
      PrivToken: '',
      SecondToken: '',
      MaxConnectNum: '',
      Remark: ''
    })

    // 表单验证规则
    const editRules = {
      IpAddr: [
        { required: true, message: '请输入IP地址', trigger: 'blur' },
        { pattern: /^((\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.){3}(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/, 
          message: '请输入有效的IP地址', trigger: 'blur' }
      ],
      Port: [
        { required: true, message: '请输入端口号', trigger: 'blur' },
        { type: 'number', min: 0, max: 65535, message: '端口号范围0-65535', trigger: 'blur' }
      ],
      PrivToken: [
        { required: true, message: '请输入密钥', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9]{5,15}$/, message: '密钥为5-15个字符，只能是数字或字母', trigger: 'blur' }
      ],
      SecondToken: [
        { pattern: /^[a-zA-Z0-9]{0,20}$/, message: '二次密钥不能超过20个字符，只能是数字或字母', trigger: 'blur' }
      ],
      MaxConnectNum: [
        { required: true, message: '请输入最大连接数', trigger: 'blur' },
        { type: 'number', min: 1, max: 999, message: '最大连接数范围1-999', trigger: 'blur' }
      ]
    }

    // 显示编辑对话框
    const showEditDialog = () => {
      editForm.value = {
        Name: serverConfig.value.Name,
        SubName: serverConfig.value.SubName,
        IpAddr: serverConfig.value.IpAddr,
        Port: serverConfig.value.Port,
        PrivToken: serverConfig.value.PrivToken,
        SecondToken: serverConfig.value.SecondToken,
        MaxConnectNum: serverConfig.value.MaxConnectNum,
        ServiceMode: serverConfig.value.LocalSwitch ? 'private' : 
                   serverConfig.value.GlobalSwitch ? 'public' : 'none',
        Remark: serverConfig.value.Remark
      }
      editDialogVisible.value = true
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

    // 提交编辑表单
    const submitEditForm = () => {
      editFormRef.value.validate(async (valid) => {
        if (valid) {
          try {
            const params = new URLSearchParams()
            params.append('name', editForm.value.Name)
            params.append('token', editForm.value.PrivToken)
            params.append('secondToken', editForm.value.SecondToken)
            params.append('ip', editForm.value.IpAddr)
            params.append('port', editForm.value.Port)
            params.append('maxConnectNum', editForm.value.MaxConnectNum)
            params.append('remark', editForm.value.Remark)
            
            let serviceResponse
            if (editForm.value.ServiceMode === 'private') {
              serviceResponse = await fetch(`${API_BASE_URL}/start-tfs`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                credentials: 'include',
                body: 'global=off'
              })
            } else if (editForm.value.ServiceMode === 'public') {
              serviceResponse = await fetch(`${API_BASE_URL}/start-tfs`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                credentials: 'include',
                body: 'global=on'
              })
            } else {
              serviceResponse = await fetch(`${API_BASE_URL}/stop-tfs`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                credentials: 'include',
                body: ''
              })
            }

            if (!serviceResponse.ok) {
              throw new Error('更新服务模式失败')
            }
            
            const configResponse = await fetch(`${API_BASE_URL}/update-local-server`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              credentials: 'include',
              body: params
            })

            if (!configResponse.ok) {
              throw new Error('更新服务器配置失败')
            }

            ElMessage.success('更新成功')
            editDialogVisible.value = false
            fetchData()
          } catch (error) {
            ElMessage.error(error.message || '更新失败')
          }
        } else {
          ElMessage.warning('请填写正确的表单信息')
          return false
        }
      })
    }

    // 选择服务器
    const selectServer = async (server) => {
      if (server.SecondToken) {
        try {
          const { value: password } = await ElMessageBox.prompt('请输入密码', '二次认证', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            inputPattern: /^[a-zA-Z0-9]{1,20}$/,
            inputErrorMessage: '密码格式不正确'
          })

          const encryptedPassword = CryptoJS.MD5(password).toString();

          if (encryptedPassword !== server.SecondToken) {
            ElMessage.error('密码错误')
            return
          }
        } catch (error) {
          return
        }
      }

      try {
        const params = encodeFormData({
          name: server.Name
        })

        const response = await fetch(`${API_BASE_URL}/select-server`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        })

        if (!response.ok) {
          throw new Error('选择服务器失败')
        }

        const data = await response.json()
        
        if (data.errMsg.includes('unstopped services')) {
          ElMessage.warning('请先停止所有端口映射服务!')
        } else if (data.errMsg.includes('reach the maximum')) {
          ElMessage.warning('服务器连接数达到上限!')
        } else {
          ElMessage.success(data.errMsg)
          fetchData()
        }
      } catch (error) {
        ElMessage.error(error.message || '选择失败')
      }
    }

    // 取消选择服务器
    const unselectServer = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/unselect-server`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: ''
        })

        if (!response.ok) {
          throw new Error('取消选择服务器失败')
        }

        const data = await response.json()
        
        if (data.errMsg.includes('unstopped services')) {
          ElMessage.warning('请先停止所有端口映射服务!')
        } else {
          ElMessage.success(data.errMsg)
          fetchData()
        }
      } catch (error) {
        ElMessage.error(error.message || '取消选择失败')
      }
    }

    // 强制取消选择
    const forceCancelSelect = async () => {
      try {
        await ElMessageBox.confirm('是否强制取消选择的服务器?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        const response = await fetch(`${API_BASE_URL}/forceCancelSelect-server`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: ''
        })

        if (!response.ok) {
          throw new Error('强制取消选择失败')
        }

        const data = await response.json()
        
        if (data.errMsg.includes('unstopped services')) {
          ElMessage.warning('请先停止所有端口映射服务!')
        } else {
          ElMessage.success(data.errMsg)
          fetchData()
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error(error.message || '操作失败')
        }
      }
    }

    // 获取数据
    const fetchData = async () => {
      if (isLoading.value) return
      
      try {
        isLoading.value = true
        const response = await fetch(`${API_BASE_URL}/transfer-server`, {
          method: 'GET',
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('获取服务器列表失败')
        }
        
        const result = await response.json()

        if (result.errCode === 1000) {
          ElMessage.error('请先登录系统')
          router.push('/user-login?callback=transfer-server')
          return
        }

        if (result.errCode !== 0) {
          throw new Error(result.errMsg || '获取设置信息失败');
        }

        serverConfig.value = {
          Name: result.Name,
          SubName: result.SubName,
          IpAddr: result.IpAddr,
          Port: result.Port,
          PrivToken: result.PrivToken,
          SecondToken: result.SecondToken,
          MaxConnectNum: result.MaxConnectNum,
          Remark: result.Remark,
          LocalSwitch: result.LocalSwitch,
          GlobalSwitch: result.GlobalSwitch
        }

        serverList.value = result.data || []
        isLogin.value = true
        loginUsername.value = result.loginUsername || ''
        dataMsg.value = result.dataMsg || '暂无数据'

      } catch (error) {
        console.error('获取数据失败:', error)
        ElMessage.error(error.message || '获取数据失败')
        serverList.value = []
        dataMsg.value = '获取数据失败，请刷新重试'
      } finally {
        isLoading.value = false
      }
    }

    // 初始化数据
    onMounted(() => {
      checkMobile()
      fetchData()
      
      // 每10秒刷新一次数据
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
      serverConfig,
      serverList,
      filteredServerList,
      dataMsg,
      isLogin,
      loginUsername,
      isLoading,
      showPrivToken,
      showSecondToken,
      isMobile,
      editDialogVisible,
      editForm,
      editFormRef,
      editRules,
      showEditDialog,
      handleCloseDialog,
      submitEditForm,
      getServerStatusText,
      getStatusClass,
      getServerTypeText,
      getServerTypeClass,
      getPortStatusClass,
      getConnectionPercentage,
      getProgressColor,
      fetchData,
      selectServer,
      unselectServer,
      forceCancelSelect
    }
  }
}
</script>

<style scoped lang="scss">
.server-settings-container {
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
      
      .text-warning {
        color: #e6a23c;
      }
    }
  }
  
  .card-body {
    padding: 20px;
  }
}

.link {
  color: #409eff;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
}

.table-responsive {
  overflow-x: auto;
}

.server-config-table,
.server-list-table {
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
}

.selected-row {
  background-color: #f0f7ff !important;
  
  td {
    font-weight: 500;
  }
}

.status-badge,
.server-type-badge,
.auth-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}

.status-badge {
  &.private {
    background-color: #f0f9eb;
    color: #67c23a;
  }
  
  &.public {
    background-color: #ecf5ff;
    color: #409eff;
  }
  
  &.disabled {
    background-color: #f5f5f5;
    color: #909399;
  }
}

.server-type-badge {
  &.official {
    background-color: #fdf6ec;
    color: #e6a23c;
  }
  
  &.public {
    background-color: #f0f9eb;
    color: #67c23a;
  }
  
  &.private {
    background-color: #ecf5ff;
    color: #409eff;
  }
}

.auth-badge {
  &.enabled {
    background-color: #fdf6ec;
    color: #e6a23c;
  }
  
  &.disabled {
    background-color: #f5f5f5;
    color: #909399;
  }
}

.enabled {
  color: #67c23a;
  font-weight: 500;
}

.disabled {
  color: #909399;
}

.selected-indicator {
  color: #f56c6c;
  margin-right: 4px;
}

.password-field {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .eye-icon {
    cursor: pointer;
    color: #909399;
    font-size: 16px;
    transition: color 0.2s;
    
    &:hover {
      color: #409eff;
    }
  }
}

.connection-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .progress-label {
    min-width: 60px;
    font-size: 12px;
    color: #606266;
  }
  
  :deep(.el-progress) {
    flex-grow: 1;
  }
}

.remark-cell {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.full-width {
  width: 100%;
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
@media (max-width: 992px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .server-config-table,
  .server-list-table {
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
}
</style>