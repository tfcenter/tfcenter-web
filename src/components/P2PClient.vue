<template>
  <div class="p2p-mapping-container" :style="backgroundStyle">
    <!-- 顶部导航栏 -->
    <div class="top-nav">
      <div class="nav-container">
        <div class="client-tabs">
          <div 
            v-for="id in p2pClientCount" 
            :key="id" 
            class="client-tab"
            :class="{ 'active': currentId === id - 1 }"
            @click="switchClient(id - 1)"
          >
            客户端 {{ id - 1 }}
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="row">
        <div class="col-md-12">
          <input type="hidden" name="id" id="id" :value="currentId" />

          <!-- P2P基础设置卡片 -->
          <div class="settings-card">
            <div class="card-header">
              <h3 class="card-title">P2P基础设置（客户端{{ currentId }}）</h3>
              <div class="btn-group">
                <el-button 
                  v-if="p2pClient.status" 
                  type="primary" 
                  size="small" 
                  @click="stopService"
                >
                  停止
                </el-button>
                <el-button 
                  v-else 
                  type="primary" 
                  size="small" 
                  @click="showEditClientDialog"
                >
                  编辑配置
                </el-button>
              </div>
            </div>
            <div class="card-body">
              <el-form label-position="top">
                <div class="form-row">
                  <el-form-item label="名称" class="form-item">
                    <el-input 
                      :value="p2pClientForm.name" 
                      readonly
                    />
                  </el-form-item>
                  
                  <el-form-item label="服务器地址" class="form-item">
                    <span>{{ p2pServerAddr }}</span>
                  </el-form-item>
                  
                  <el-form-item label="密钥" class="form-item">
                    <el-input 
                      :value="p2pClientForm.token" 
                      readonly
                    />
                  </el-form-item>
                  
                  <el-form-item label="二次密钥" class="form-item">
                    <el-input 
                      :value="p2pClientForm.secondToken" 
                      readonly
                    />
                  </el-form-item>
                  
                  <el-form-item label="开启中转" class="form-item">
                    <el-input 
                      :value="p2pClientForm.brFlag === 'on' ? '开启' : '关闭'" 
                      readonly
                    />
                  </el-form-item>
                  
                  <el-form-item label="出口端口" class="form-item">
                    <span>{{ exportPort }}</span>
                  </el-form-item>
                  
                  <el-form-item label="状态" class="form-item">
                    <div :class="getStatusClass(p2pClient.result)">
                      {{ p2pClient.result }}
                    </div>
                  </el-form-item>
                </div>
              </el-form>
            </div>
          </div>

          <!-- P2P节点信息卡片 -->
          <div class="settings-card">
            <div class="card-header">
              <h3 class="card-title">P2P节点信息{{ peerFlag ? `(${localIP})` : '' }}</h3>
            </div>
            <div class="card-body">
              <div class="node-info">
                <div class="info-row">
                  <div class="info-label">本端NAT类型</div>
                  <div class="info-value">{{ localNatType }}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">本端连接地址</div>
                  <div class="info-value">{{ localConnectAddr }}</div>
                </div>
                
                <template v-if="peerFlag">
                  <div class="info-row">
                    <div class="info-label">对端NAT类型</div>
                    <div class="info-value">{{ peerNatType }}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">对端连接地址</div>
                    <div class="info-value">{{ peerAddr }}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">状态</div>
                    <div class="info-value" :style="peerStatus.includes('success') ? 'color: #67c23a;' : 'color: #7c7979ff;'">{{ peerStatus }}</div>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- P2P端口映射卡片 -->
          <div class="settings-card">
            <div class="card-header">
              <h3 class="card-title">P2P端口映射</h3>
              <div class="btn-group">
                <el-button type="primary" size="small" @click="showAddDialog">新增映射</el-button>
                <el-button type="warning" size="small" @click="stopAll">停止所有</el-button>
                <el-button type="success" size="small" @click="restartAll">重启所有</el-button>
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
                      <th>本端端口号</th>
                      <th>对端IP地址</th>
                      <th>对端端口号</th>
                      <th>协议</th>
                      <th>状态</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in mappingList" :key="item.name">
                      <td>{{ item.name }}</td>
                      <td>{{ item.listenPort }}</td>
                      <td>{{ item.connectIP }}</td>
                      <td>{{ item.connectPort }}</td>
                      <td>{{ item.protocol === 0 ? 'TCP' : 'UDP' }}</td>
                      <td class="status-cell">
                        <div :class="getStatusClass(item.result)">
                          {{ item.result }}
                        </div>
                      </td>
                      <td class="action-cell">
                        <el-button 
                          v-if="item.status" 
                          type="warning" 
                          size="small" 
                          @click="stopMapping(item)"
                        >
                          停止
                        </el-button>
                        <template v-else>
                          <el-button 
                            type="warning" 
                            size="small" 
                            @click="startMapping(item)"
                          >
                            启动
                          </el-button>

                          <el-button 
                            type="primary" 
                            size="small" 
                            @click="showEditMappingDialog(item)"
                          >
                            编辑
                          </el-button>
                          <el-button 
                            type="danger" 
                            size="small" 
                            @click="deleteMapping(item)"
                          >
                            删除
                          </el-button>
                        </template>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增映射对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      :title="isEditingMapping ? '编辑端口映射' : '新增端口映射'"
      width="600px"
    >
      <el-form 
        :model="currentMappingForm" 
        :rules="formRules" 
        ref="mappingFormRef"
        label-position="top"
      >
        <el-form-item label="名称" prop="name">
          <el-input 
            v-model="currentMappingForm.name" 
            placeholder="3-15个字符，只能是数字或字母"
            :disabled="isEditingMapping"
          />
        </el-form-item>
        
        <el-form-item label="本端端口号" prop="listenPort">
          <el-input 
            v-model.number="currentMappingForm.listenPort" 
            type="number" 
            placeholder="1-65535"
          />
        </el-form-item>
        
        <el-form-item label="对端IP地址" prop="connectIP">
          <el-input 
            v-model="currentMappingForm.connectIP" 
            placeholder="例如: 127.0.0.1"
          />
        </el-form-item>
        
        <el-form-item label="对端端口号" prop="connectPort">
          <el-input 
            v-model.number="currentMappingForm.connectPort" 
            type="number" 
            placeholder="1-65535"
          />
        </el-form-item>
        
        <el-form-item label="协议" prop="protocol">
          <el-select v-model="protocolComputed">
            <el-option value="tcp" label="TCP" />
            <el-option value="udp" label="UDP" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitMappingForm">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑客户端配置对话框 -->
    <el-dialog
      v-model="clientDialogVisible"
      title="编辑P2P客户端配置"
      width="600px"
    >
      <el-form 
        :model="p2pClientForm" 
        :rules="clientFormRules" 
        ref="clientFormRef"
        label-position="top"
      >
        <el-form-item label="名称" prop="name">
          <el-input 
            v-model="p2pClientForm.name" 
            placeholder="客户端名称"
          />
        </el-form-item>
        
        <el-form-item label="密钥" prop="token">
          <el-input 
            v-model="p2pClientForm.token" 
            placeholder="3-20字符"
          />
        </el-form-item>
        
        <el-form-item label="二次密钥">
          <el-input 
            v-model="p2pClientForm.secondToken" 
            placeholder="可选"
          />
        </el-form-item>
        
        <el-form-item label="开启中转">
          <el-select v-model="p2pClientForm.brFlag">
            <el-option value="on" label="开启" />
            <el-option value="off" label="关闭" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="clientDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="updateService">保存并启动</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, Box } from '@element-plus/icons-vue'
import { API_BASE_URL } from "@/config";
import { useRouter } from 'vue-router'

export default {
  name: 'P2PMapping',
  components: { Loading, Box },
  setup() {
    const router = useRouter()
    
    // 页面状态
    const isLoading = ref(false)
    const currentId = ref(0)
    const p2pClientCount = ref(0)
    const loginUsername = ref('admin')
    const refreshInterval = 5000 // 5秒自动刷新
    const intervalId = ref(null)
    
    // 数据
    const p2pClient = ref({
      index: 1,
      name: '',
      serverAddr: '',
      token: '',
      defaultToken: '',
      status: false,
      brFlag: false,
      result: '',
      P2PMappingPort: [],
      exportPort: '',
      importPort: ''
    })
    
    const p2pServerAddr = ref('')
    const exportPort = ref('')
    const localIP = ref('')
    const localNatType = ref('')
    const localConnectAddr = ref('')
    const peerFlag = ref(false)
    const peerNatType = ref('')
    const peerAddr = ref('')
    const peerStatus = ref('')
    const secondToken = ref('')
    const token = ref('')
    
    // 映射列表
    const mappingList = ref([])
    
    // 表单相关
    const p2pClientForm = ref({
      name: '',
      token: '',
      secondToken: '',
      brFlag: 'off'
    })
    
    const clientFormRef = ref(null)
    const clientDialogVisible = ref(false)
    
    const clientFormRules = {
      name: [
        { required: true, message: '请输入名称', trigger: 'blur' }
      ],
      token: [
        { required: true, message: '请输入密钥', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9]{3,20}$/, message: '密钥3-20个字符，只能是数字或字母', trigger: 'blur' }
      ]
    }
    
    const currentMappingForm = ref({
      name: '',
      listenPort: '',
      connectIP: '127.0.0.1',
      connectPort: '',
      protocol: 'tcp'
    })
    
    const mappingFormRef = ref(null)
    const addDialogVisible = ref(false)
    const isEditingMapping = ref(false)
    
    // 表单验证规则
    const formRules = {
      name: [
        { required: true, message: '请输入名称', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9]{3,15}$/, message: '名称3-15个字符，只能是数字或字母', trigger: 'blur' }
      ],
      listenPort: [
        { required: true, message: '请输入本端端口号', trigger: 'blur' },
        { type: 'number', min: 1, max: 65535, message: '端口号范围1-65535', trigger: 'blur' }
      ],
      connectIP: [
        { required: true, message: '请输入对端IP地址', trigger: 'blur' },
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
      connectPort: [
        { required: true, message: '请输入对端端口号', trigger: 'blur' },
        { type: 'number', min: 1, max: 65535, message: '端口号范围1-65535', trigger: 'blur' }
      ],
      protocol: [
        { required: true, message: '请选择协议', trigger: 'change' }
      ]
    }

    const protocolComputed = computed({
      get() {
        return currentMappingForm.value.protocol === 1 || currentMappingForm.value.protocol === 'udp' ? 'udp' : 'tcp';
      },
      set(value) {
        currentMappingForm.value.protocol = value;
      }
    });
    
    // 获取状态样式类
    const getStatusClass = (status) => {
      if (!status) return 'status stopped'
      
      const lowerStatus = status.toLowerCase()
      
      if (lowerStatus.includes('failed') || lowerStatus.includes('失败')) {
        return 'failed'
      } else if (lowerStatus.includes('success') || lowerStatus.includes('running') || lowerStatus.includes('运行中') || lowerStatus.includes('建立成功')) {
        return 'running'
      } else {
        return 'stopped'
      }
    }
    
    // 切换客户端
    const switchClient = (id) => {
      if (id !== currentId.value) {
        currentId.value = id
        fetchP2PList(id)
      }
    }
    
    // 获取P2P列表数据
    const fetchP2PList = async (id) => {
      try {
        isLoading.value = true
        const response = await fetch(`${API_BASE_URL}/get-p2pList?id=${id}`, {
          method: 'GET',
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error('获取数据失败')
        }
        
        const result = await response.json()

        if (result.errCode === 1000) {
          ElMessage.error('请先登录系统')
          router.push('/user-login?callback=p2p-client')
          return
        }

        if (result.errCode != 0) {
          ElMessage.error(result.errMsg)
          return
        }
        
        // 更新数据
        p2pClient.value = result.p2pClient || {}
        p2pServerAddr.value = result.p2pServerAddr || ''
        exportPort.value = result.exportPort || ''
        localIP.value = result.localIP || ''
        localNatType.value = result.localNatType || ''
        localConnectAddr.value = result.localConnectAddr || ''
        peerFlag.value = result.peerFlag || false
        peerNatType.value = result.peerNatType || ''
        peerAddr.value = result.peerAddr || ''
        peerStatus.value = result.peerStatus || ''
        secondToken.value = result.secondToken || ''
        token.value = result.token || ''
        p2pClientCount.value = result.P2PClientCount || 0
        loginUsername.value = result.loginUsername || 'admin'
        
        // 更新表单
        p2pClientForm.value = {
          name: p2pClient.value.name || '',
          token: token.value || '',
          secondToken: secondToken.value || '',
          brFlag: p2pClient.value.brFlag ? 'on' : 'off'
        }
        
        // 更新映射列表
        mappingList.value = p2pClient.value.P2PMappingPort || []
        
      } catch (error) {
        console.error('获取数据失败:', error)
        ElMessage.error(error.message || '获取数据失败')
      } finally {
        isLoading.value = false
      }
    }
    
    // 开始自动刷新
    const startAutoRefresh = () => {
      stopAutoRefresh()
      intervalId.value = setInterval(() => {
        fetchP2PList(currentId.value)
      }, refreshInterval)
    }
    
    // 停止自动刷新
    const stopAutoRefresh = () => {
      if (intervalId.value) {
        clearInterval(intervalId.value)
        intervalId.value = null
      }
    }
    
    // 显示编辑客户端配置对话框
    const showEditClientDialog = () => {
      clientDialogVisible.value = true
    }
    
    // 更新服务
    const updateService = async () => {
      try {
        await clientFormRef.value.validate()
        
        if (!p2pClientForm.value.token) {
          ElMessage.error('密钥不能为空')
          return
        }
        
        const tokenPattern = /^[a-zA-Z0-9]{3,20}$/
        if (!tokenPattern.test(p2pClientForm.value.token)) {
          ElMessage.error('密钥3-20个字符，只能是数字、大写字母或小写字母')
          return
        }
        
        let finalToken = p2pClientForm.value.token
        if (p2pClientForm.value.secondToken) {
          finalToken = `${p2pClientForm.value.token}@#1@$1@${p2pClientForm.value.secondToken}`
        }
        
        const params = new URLSearchParams()
        params.append('brFlag', p2pClientForm.value.brFlag)
        params.append('token', finalToken)
        params.append('id', currentId.value)
        params.append('name', p2pClientForm.value.name)
        
        const response = await fetch(`${API_BASE_URL}/update-p2pClient`, {
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
        clientDialogVisible.value = false
        fetchP2PList(currentId.value)
      } catch (error) {
        ElMessage.error(error.message || '更新失败')
      }
    }
    
    // 停止服务
    const stopService = async () => {
      try {
        const params = new URLSearchParams()
        params.append('id', currentId.value)
        
        const response = await fetch(`${API_BASE_URL}/stop-p2pClient`, {
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
        fetchP2PList(currentId.value)
      } catch (error) {
        ElMessage.error(error.message || '停止失败')
      }
    }
    
    // 显示新增映射对话框
    const showAddDialog = () => {
      isEditingMapping.value = false
      currentMappingForm.value = {
        name: '',
        listenPort: '',
        connectIP: '127.0.0.1',
        connectPort: '',
        protocol: 'tcp'
      }
      addDialogVisible.value = true
    }
    
    // 显示编辑映射对话框
    const showEditMappingDialog = (item) => {
      isEditingMapping.value = true
      currentMappingForm.value = {
        name: item.name,
        listenPort: item.listenPort,
        connectIP: item.connectIP,
        connectPort: item.connectPort,
        protocol: item.protocol
      }
      addDialogVisible.value = true
    }
    
    // 提交映射表单
    const submitMappingForm = async () => {
      try {
        await mappingFormRef.value.validate()
        
        const params = new URLSearchParams()
        params.append('name', currentMappingForm.value.name)
        params.append('lport', currentMappingForm.value.listenPort)
        params.append('cport', currentMappingForm.value.connectPort)
        params.append('cip', currentMappingForm.value.connectIP)
        params.append('id', currentId.value)
        params.append('protocol', currentMappingForm.value.protocol)
        
        const url = isEditingMapping.value ? '/update-p2pListen' : '/start-p2pListen'
        
        const response = await fetch(`${API_BASE_URL}${url}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        })
        
        if (!response.ok) {
          throw new Error(isEditingMapping.value ? '更新失败' : '添加失败')
        }
        
        const data = await response.json()
        ElMessage.success(data.errMsg || (isEditingMapping.value ? '更新成功' : '添加成功'))
        addDialogVisible.value = false
        fetchP2PList(currentId.value)
      } catch (error) {
        ElMessage.error(error.message || (isEditingMapping.value ? '更新失败' : '添加失败'))
      }
    }
    
    // 开启映射
    const startMapping = async (item) => {
      try {
        const params = new URLSearchParams()
        params.append('name', item.name)
        params.append('lport', item.listenPort)
        params.append('cport', item.connectPort)
        params.append('cip', item.connectIP)
        params.append('id', currentId.value)
        params.append('protocol', item.protocol)
        
        const response = await fetch(`${API_BASE_URL}/update-p2pListen`, {
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
        fetchP2PList(currentId.value)
      } catch (error) {
        ElMessage.error(error.message || '启动失败')
      }
    }

    // 停止映射
    const stopMapping = async (item) => {
      try {
        const params = new URLSearchParams()
        params.append('name', item.name)
        params.append('flag', 'off')
        params.append('id', currentId.value)
        
        const response = await fetch(`${API_BASE_URL}/stop-p2pListen`, {
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
        fetchP2PList(currentId.value)
      } catch (error) {
        ElMessage.error(error.message || '停止失败')
      }
    }
    
    // 删除映射
    const deleteMapping = (item) => {
      ElMessageBox.confirm('确定要删除该映射吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const params = new URLSearchParams()
          params.append('name', item.name)
          params.append('id', currentId.value)
          
          const response = await fetch(`${API_BASE_URL}/delete-p2pListen`, {
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
          ElMessage.success(data.errMsg || '删除成功')
          fetchP2PList(currentId.value)
        } catch (error) {
          ElMessage.error(error.message || '删除失败')
        }
      }).catch(() => {})
    }
    
    // 停止所有映射
    const stopAll = async () => {
      try {
        const params = new URLSearchParams()
        params.append('flag', 'on')
        
        const response = await fetch(`${API_BASE_URL}/stop-all-p2pListen`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        })
        
        if (!response.ok) {
          throw new Error('停止所有失败')
        }
        
        const data = await response.json()
        ElMessage.success(data.errMsg || '已停止所有映射')
        fetchP2PList(currentId.value)
      } catch (error) {
        ElMessage.error(error.message || '停止所有失败')
      }
    }
    
    // 重启所有映射
    const restartAll = async () => {
      try {
        const params = new URLSearchParams()
        params.append('flag', 'on')
        
        const response = await fetch(`${API_BASE_URL}/restart-all-p2pListen`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
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
        fetchP2PList(currentId.value)
      } catch (error) {
        ElMessage.error(error.message || '重启所有失败')
      }
    }
    
    // 初始化
    onMounted(() => {
      fetchP2PList(currentId.value)
      startAutoRefresh() // 默认开启自动刷新
    })
    
    // 清理
    onUnmounted(() => {
      stopAutoRefresh()
    })
    
    // 背景样式
    const backgroundStyle = computed(() => ({
      backgroundColor: '#f5f5f5',
      backgroundSize: 'cover'
    }))
    
    return {
      // 状态
      isLoading,
      currentId,
      p2pClientCount,
      
      // 数据
      p2pClient,
      p2pServerAddr,
      exportPort,
      localIP,
      localNatType,
      localConnectAddr,
      peerFlag,
      peerNatType,
      peerAddr,
      peerStatus,
      mappingList,
      
      // 表单
      formRules,
      clientFormRules,
      p2pClientForm,
      currentMappingForm,
      clientFormRef,
      mappingFormRef,
      clientDialogVisible,
      addDialogVisible,
      isEditingMapping,
      
      // 样式
      backgroundStyle,
      
      protocolComputed,

      // 方法
      switchClient,
      getStatusClass,
      showEditClientDialog,
      updateService,
      stopService,
      showAddDialog,
      showEditMappingDialog,
      submitMappingForm,
      startMapping,
      stopMapping,
      deleteMapping,
      stopAll,
      restartAll
    }
  }
}
</script>

<style scoped lang="scss">

.p2p-mapping-container {
  padding: 20px;
  min-height: 100vh;
}

.top-nav {
  height: 60px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  
  .nav-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    max-width: 100%;
    margin: 0 auto;
    padding: 0 20px;
    
    .nav-title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
    
    .client-tabs {
      display: flex;
      gap: 8px;
      
      .client-tab {
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s;
        
        &:hover {
          background-color: #f5f7fa;
        }
        
        &.active {
          background-color: #409eff;
          color: white;
        }
      }
    }
    
    .user-info {
      font-size: 14px;
      color: #606266;
    }
  }
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
    
    .form-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      
      .form-item {
        flex: 1;
        min-width: 150px;
        
        &.actions {
          display: flex;
          justify-content: flex-end;
          align-items: flex-end;
        }
      }
    }
    
    .node-info {
      .info-row {
        display: flex;
        margin-bottom: 12px;
        
        .info-label {
          font-weight: 600;
          width: 150px;
          color: #606266;
        }
        
        .info-value {
          flex: 1;
          color: #303133;
        }
      }
    }
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
    
    .el-input, .el-select {
      width: 100%;
    }
  }
  
  tr:hover td {
    background-color: #f5f7fa;
  }
}

.settings-card {
  .card-header {
    .btn-group {
      .el-button {
        margin-left: 8px;
      }
    }
  }
}

.status-cell {
  .status {
    padding: 4px 8px;
    border-radius: 4px;
    
    &.running {
      background-color: #f0f9eb;
      color: #67c23a;
    }
    
    &.stopped {
      background-color: #f4f4f5;
      color: #909399;
    }
    
    &.failed {
      background-color: #fef0f0;
      color: #f56c6c;
    }
  }
}

.action-cell {
  .el-button + .el-button {
    margin-left: 8px;
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

.running {
  color: #67c23a;
  font-weight: 500;
}

/* 响应式处理 */
@media (max-width: 768px) {
  .settings-card {
    .card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    
    .card-body {
      .form-row {
        .form-item {
          min-width: 100%;
        }
      }
    }
  }
  
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
}
</style>