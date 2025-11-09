<template>
  <div class="webdav-container">
    <div class="webdav-content">
      <!-- 依赖包信息 -->
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <span>依赖包</span>
          </div>
        </template>
        
        <el-table :data="[packageInfo]" border>
          <el-table-column prop="package" label="安装包" width="120" />
          <el-table-column prop="system" label="系统信息" width="240" />
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <span v-if="osType !== 'windows'">{{ row.status }}</span>
              <div v-else class="action-links">
                <el-link type="primary" href="https://winfsp.dev/rel/" target="_blank">winfsp下载</el-link>
                <el-link type="primary" @click="showWIPreview = true">
                  操作说明
                </el-link>
                <el-image-viewer
                  v-if="showWIPreview"
                  :url-list="[imageWIUrl]"
                  :initial-index="0"
                  @close="showWIPreview = false"
                />
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 挂载列表 -->
      <el-card class="mount-list-card">
        <template #header>
          <div class="card-header">
            <span>挂载列表</span>
            <div class="header-actions">
              <el-button type="primary" size="small" @click="showAddDialog">增加</el-button>
              <el-link type="primary" @click="showMCPreview = true">
                操作说明
              </el-link>
              <el-image-viewer
                v-if="showMCPreview"
                :url-list="[imageMCUrl]"
                :initial-index="0"
                @close="showMCPreview = false"
              />
            </div>
          </div>
          <span class="card-subtitle"  v-if="!isExeAdmin">
            非管理员身份运行
            <span class="text-error">(注:某些软件可能不能在挂载盘中运行)</span>
          </span>
          <span class="card-subtitle"  v-else>
            管理员身份运行
          </span>
        </template>

        <!-- 当 mountList 为空时显示提示 -->
        <div v-if="mountList == null || mountList.length === 0" class="empty-mount-list">
          <el-empty description="暂无挂载列表" />
        </div>

        <div class="mount-items-container">
          <div v-for="(row, index) in mountList" :key="index" class="mount-item">
            <div class="mount-item-header">
              <div class="mount-name-status">
                <span class="mount-name">{{ row.Name }}</span>
                <span 
                  class="mount-status" 
                  :class="{
                    'status-success': row.Switch && row.Status?.includes('成功'),
                    'status-inactive': !row.Switch,
                    'status-error': row.Switch && !row.Status?.includes('成功')
                  }"
                >
                  {{ row.Status }}
                </span>
              </div>
              <div class="mount-actions">
                <!-- 当 row.Switch 为 true 且 Status 包含 "成功" 时，显示 "停止" 和 "打开" -->
                <template v-if="row.Switch && row.Status?.includes('成功')">
                  <el-button 
                    type="primary" 
                    size="small"
                    @click="stopWebdavClient(row)"
                  >
                    停止
                  </el-button>
                  <el-button 
                    type="success" 
                    size="small"
                    @click="openMount(row)"
                  >
                    打开
                  </el-button>
                  <el-button 
                    type="info" 
                    size="small"
                    @click="viewLog(row)"
                  >
                    查看日志
                  </el-button>
                </template>
                
                <!-- 否则（row.Switch 为 false 或 Status 不包含 "成功"），显示 "启动"、"编辑"、"删除" -->
                <template v-else>
                  <el-button 
                    type="primary" 
                    size="small"
                    @click="startWebdavClient(row)"
                  >
                    启动
                  </el-button>
                  <el-button 
                    type="warning" 
                    size="small"
                    @click="editWebdavClient(row)"
                  >
                    编辑
                  </el-button>
                  <el-button 
                    type="danger" 
                    size="small"
                    @click="deleteWebdavClient(row)"
                  >
                    删除
                  </el-button>
                  <el-button 
                    type="info" 
                    size="small"
                    @click="viewLog(row)"
                  >
                    查看日志
                  </el-button>
                </template>
              </div>
            </div>
            
            <div class="mount-details">
              <div class="mount-info-row">
                <span class="mount-info-text">【{{ row.MountPoint }}】</span>
                <span class="mount-info-text">{{ row.MountName || '未命名' }}</span>
                <span class="mount-info-text">{{ row.RemoteAddr }}</span>
                <span class="mount-info-text">{{ row.RemoteUsername }}</span>
                <span class="mount-info-text">{{ row.MountVender }}</span>
                <span class="mount-info-text">{{ row.MountMode === 'netDisk' ? '网络盘' : '本地盘' }}</span>
              </div>
            </div>
            
            <div class="mount-storage">
              <el-progress 
                :percentage="calculateUsage(row.UserVolume, row.TotalVolume)" 
                :color="getProgressColor(row.UserVolume, row.TotalVolume)"
                :stroke-width="16"
                :format="formatProgressText(row.UserVolume, row.TotalVolume)"
              />
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 新增挂载对话框 -->
    <el-dialog v-model="addDialogVisible" title="新增挂载" width="800px">
      <el-form :model="newMount" :rules="mountRules" label-width="120px">
        <el-form-item label="名称" prop="Name">
          <el-input v-model="newMount.Name" placeholder="3-15个字符，只能是数字、大写字母或小写字母" />
        </el-form-item>
        
        <el-form-item label="挂载名">
          <el-input v-model="newMount.MountName" placeholder="挂载名称(可选)" />
        </el-form-item>
        
        <el-form-item label="挂载点" prop="MountPoint">
          <el-input v-model="newMount.MountPoint" placeholder="挂载点" />
        </el-form-item>
        
        <el-form-item label="WebDAV地址" prop="RemoteAddr">
          <el-input v-model="newMount.RemoteAddr" placeholder="webdav地址" />
        </el-form-item>
        
        <el-form-item label="用户名" prop="RemoteUsername">
          <el-input v-model="newMount.RemoteUsername" placeholder="用户名" />
        </el-form-item>
        
        <el-form-item label="密码" prop="RemotePassword">
          <el-input 
            v-model="newMount.RemotePassword" 
            type="password" 
            placeholder="密码" 
            show-password 
          />
        </el-form-item>
        
        <el-form-item label="方式" prop="MountVender">
          <el-select 
            v-model="newMount.MountVender" 
            style="width: 100%"
            :disabled="osType !== 'windows'"
          >
            <el-option label="tfcenter" value="tfcenter" />
            <el-option label="rclone" value="rclone" />
          </el-select>
          <span v-if="osType !== 'windows'" class="disabled-hint">
            (Linux系统只能使用rclone方式)
          </span>
        </el-form-item>
        
        <el-form-item label="模式" prop="MountMode">
          <el-select v-model="newMount.MountMode" style="width: 100%">
            <el-option label="网络盘" value="netDisk" />
            <el-option label="本地盘" value="localDisk" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addWebdavClient">保存</el-button>
      </template>
    </el-dialog>

    <!-- 编辑挂载对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑挂载" width="800px">
      <el-form :model="editMount" :rules="editMountRules" label-width="120px">
        <el-form-item label="名称" prop="Name">
          <el-input v-model="editMount.Name" readonly class="readonly-input" disabled />
        </el-form-item>
        
        <el-form-item label="挂载名">
          <el-input v-model="editMount.MountName" placeholder="挂载名称(可选)" />
        </el-form-item>
        
        <el-form-item label="挂载点" prop="MountPoint">
          <el-input v-model="editMount.MountPoint" placeholder="挂载点" />
        </el-form-item>
        
        <el-form-item label="WebDAV地址" prop="RemoteAddr">
          <el-input v-model="editMount.RemoteAddr" placeholder="webdav地址" />
        </el-form-item>
        
        <el-form-item label="用户名" prop="RemoteUsername">
          <el-input v-model="editMount.RemoteUsername" placeholder="用户名" />
        </el-form-item>
        
        <el-form-item label="密码">
          <el-input 
            v-model="editMount.RemotePassword" 
            type="password" 
            placeholder="留空表示不修改密码" 
            show-password 
          />
        </el-form-item>
        
        <el-form-item label="方式" prop="MountVender">
          <el-select 
            v-model="editMount.MountVender" 
            style="width: 100%"
            :disabled="osType !== 'windows'"
          >
            <el-option label="tfcenter" value="tfcenter" />
            <el-option label="rclone" value="rclone" />
          </el-select>
          <span v-if="osType !== 'windows'" class="disabled-hint">
            (Linux系统只能使用rclone方式)
          </span>
        </el-form-item>
        
        <el-form-item label="模式" prop="MountMode">
          <el-select v-model="editMount.MountMode" style="width: 100%">
            <el-option label="网络盘" value="netDisk" />
            <el-option label="本地盘" value="localDisk" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="updateWebdavClient">保存</el-button>
      </template>
    </el-dialog>

    <!-- 日志查看对话框 -->
    <el-dialog v-model="logDialogVisible" title="日志内容" width="70%">
      <div class="log-container">
        <pre>{{ logContent }}</pre>
      </div>
      <template #footer>
        <el-button @click="logDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="refreshLog">刷新日志</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { API_BASE_URL } from '@/config';
import { useRouter } from 'vue-router'

const router = useRouter()

// 图片路径
const imageMCUrl = '/static/dist/images/mount-config.png';
const showMCPreview = ref(false);
const imageWIUrl = '/static/dist/images/winfsp-install.png';
const showWIPreview = ref(false);

// 系统信息
const osType = ref('windows')
const platform = ref('amd64')
const isExeAdmin = ref(false)

// 日志查看相关
const logDialogVisible = ref(false)
const logContent = ref('')
const currentLogName = ref('')

// 依赖包信息
const packageInfo = reactive({
  package: 'winfsp',
  system: computed(() => `${osType.value}-${platform.value}`),
  status: '已安装'
})

// 挂载列表
const mountList = ref([])

// 新增挂载对话框
const addDialogVisible = ref(false)
const newMount = reactive({
  Name: '',
  MountName: '',
  MountPoint: '',
  RemoteAddr: '',
  RemoteUsername: '',
  RemotePassword: '',
  MountVender: 'tfcenter',
  MountMode: 'netDisk',
  MountType: 'webdav',
  CacheMode: 'full',
  RefreshTime: '10'
})

// 编辑挂载对话框
const editDialogVisible = ref(false)
const editMount = reactive({
  Name: '',
  MountName: '',
  MountPoint: '',
  RemoteAddr: '',
  RemoteUsername: '',
  RemotePassword: '',
  MountVender: 'tfcenter',
  MountMode: 'netDisk'
})

// 新增表单验证规则
const mountRules = {
  Name: [
    { required: true, message: '名称不能为空', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9]{3,15}$/, message: '名称3-15个字符，只能是数字、大写字母或小写字母', trigger: 'blur' }
  ],
  MountPoint: [
    { required: true, message: '挂载点不能为空', trigger: 'blur' }
  ],
  RemoteAddr: [
    { required: true, message: 'WebDAV地址不能为空', trigger: 'blur' }
  ],
  RemoteUsername: [
    { required: true, message: '用户名不能为空', trigger: 'blur' }
  ],
  RemotePassword: [
    { required: true, message: '密码不能为空', trigger: 'blur' },
    { min: 2, max: 64, message: '密码长度为2-64位', trigger: 'blur' }
  ],
  MountVender: [
    { required: true, message: '请选择挂载方式', trigger: 'change' }
  ],
  MountMode: [
    { required: true, message: '请选择挂载模式', trigger: 'change' }
  ]
}

// 编辑表单验证规则
const editMountRules = {
  MountPoint: [
    { required: true, message: '挂载点不能为空', trigger: 'blur' }
  ],
  RemoteAddr: [
    { required: true, message: 'WebDAV地址不能为空', trigger: 'blur' }
  ],
  RemoteUsername: [
    { required: true, message: '用户名不能为空', trigger: 'blur' }
  ],
  MountVender: [
    { required: true, message: '请选择挂载方式', trigger: 'change' }
  ],
  MountMode: [
    { required: true, message: '请选择挂载模式', trigger: 'change' }
  ]
}

// 查看日志
const viewLog = async (row) => {
  try {
    currentLogName.value = row.Name
    const response = await fetch(`${API_BASE_URL}/download-log-file?path=${row.Name}.txt`, {
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error('获取日志失败')
    }
    
    logContent.value = await response.text()
    logDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取日志内容失败: ' + error.message)
  }
}

// 刷新日志
const refreshLog = async () => {
  if (currentLogName.value) {
    await viewLog({ Name: currentLogName.value })
    ElMessage.success('日志已刷新')
  }
}

// 格式化存储容量
const formatStorage = (value) => {
  if (!value) return '0B';
  const num = parseFloat(value);
  if (isNaN(num)) return '0B';
  
  if (num >= 1024 * 1024 * 1024) {
    return (num / (1024 * 1024 * 1024)).toFixed(2) + 'GB';
  } else if (num >= 1024 * 1024) {
    return (num / (1024 * 1024)).toFixed(2) + 'MB';
  } else if (num >= 1024) {
    return (num / 1024).toFixed(2) + 'KB';
  }
  return num.toFixed(2) + 'B';
};

// 计算使用率
const calculateUsage = (used, total) => {
  if (!used || !total) return 0;
  const usedNum = parseFloat(used);
  const totalNum = parseFloat(total);
  if (isNaN(usedNum) || isNaN(totalNum) || totalNum === 0) return 0;
  return Math.round((usedNum / totalNum) * 100);
};

// 获取进度条颜色
const getProgressColor = (used, total) => {
  const usage = calculateUsage(used, total);
  if (usage > 90) return '#f56c6c';
  if (usage > 70) return '#e6a23c';
  return '#67c23a';
};

// 进度条文本格式化
const formatProgressText = (used, total) => {
  return () => {
    const usage = calculateUsage(used, total);
    return `${formatStorage(used)} / ${formatStorage(total)} (${usage}%)`;
  };
};

// 显示新增对话框
const showAddDialog = () => {
  Object.assign(newMount, {
    Name: '',
    MountName: '',
    MountPoint: '',
    RemoteAddr: '',
    RemoteUsername: '',
    RemotePassword: '',
    MountVender: 'tfcenter',
    MountMode: 'netDisk',
    MountType: 'webdav',
    CacheMode: 'full',
    RefreshTime: '10'
  })
  addDialogVisible.value = true
}

// 添加WebDAV客户端
const addWebdavClient = async () => {
  try {
    const formData = new URLSearchParams();
    formData.append('name', newMount.Name);
    formData.append('mountName', newMount.MountName);
    formData.append('mountPoint', newMount.MountPoint);
    formData.append('remoteAddr', newMount.RemoteAddr);
    formData.append('remoteUsername', newMount.RemoteUsername);
    formData.append('remotePassword', newMount.RemotePassword);
    formData.append('mountVender', newMount.MountVender);
    formData.append('mountMode', newMount.MountMode);

    const response = await fetch(`${API_BASE_URL}/add-webdav-client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      credentials: 'include'
    })
    
    const result = await response.json()
    
    if (result.errCode === 0) {
      ElMessage.success(result.errMsg)
      addDialogVisible.value = false
      fetchMountList()
    } else {
      ElMessage.error(result.errMsg)
    }
  } catch (error) {
    ElMessage.error(error.message || '添加失败')
  }
}

// 启动WebDAV客户端
const startWebdavClient = async (row) => {
  try {
    const formData = new URLSearchParams();
    formData.append('name', row.Name);

    const response = await fetch(`${API_BASE_URL}/start-webdav-client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      credentials: 'include'
    })
    
    const result = await response.json()
    
    if (result.errCode === 0) {
      ElMessage.success(result.errMsg)
      fetchMountList()
    } else {
      ElMessage.error(result.errMsg)
    }
  } catch (error) {
    ElMessage.error(error.message || '启动失败')
  }
}

// 编辑WebDAV客户端
const editWebdavClient = (row) => {
  Object.assign(editMount, {
    Name: row.Name,
    MountName: row.MountName,
    MountPoint: row.MountPoint,
    RemoteAddr: row.RemoteAddr,
    RemoteUsername: row.RemoteUsername,
    RemotePassword: '', // 密码初始化为空
    MountVender: row.MountVender,
    MountMode: row.MountMode
  })
  editDialogVisible.value = true
}

// 更新WebDAV客户端
const updateWebdavClient = async () => {
  try {
    const formData = new URLSearchParams();
    formData.append('name', editMount.Name);
    formData.append('mountName', editMount.MountName);
    formData.append('mountPoint', editMount.MountPoint);
    formData.append('remoteAddr', editMount.RemoteAddr);
    formData.append('remoteUsername', editMount.RemoteUsername);
    
    // 只有密码不为空时才添加密码字段
    if (editMount.RemotePassword) {
      formData.append('remotePassword', editMount.RemotePassword);
    }
    
    formData.append('mountVender', editMount.MountVender);
    formData.append('mountMode', editMount.MountMode);

    const response = await fetch(`${API_BASE_URL}/update-webdav-client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      credentials: 'include'
    })
    
    const result = await response.json()
    
    if (result.errCode === 0) {
      ElMessage.success(result.errMsg)
      editDialogVisible.value = false
      fetchMountList()
    } else {
      ElMessage.error(result.errMsg)
    }
  } catch (error) {
    ElMessage.error(error.message || '更新失败')
  }
}

// 删除WebDAV客户端
const deleteWebdavClient = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除挂载 ${row.Name} 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await fetch(
      `${API_BASE_URL}/delete-webdav-client?name=${encodeURIComponent(row.Name)}`,
      {
        method: 'DELETE',
        credentials: 'include'
      }
    );
    
    const result = await response.json()
    
    if (result.errCode === 0) {
      ElMessage.success(result.errMsg)
      fetchMountList()
    } else {
      ElMessage.error(result.errMsg)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 停止WebDAV客户端
const stopWebdavClient = async (row) => {
  try {
    const formData = new URLSearchParams();
    formData.append('name', row.Name);

    const response = await fetch(`${API_BASE_URL}/stop-webdav-client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      credentials: 'include'
    })
    
    const result = await response.json()
    
    if (result.errCode === 0) {
      ElMessage.success(result.errMsg)
      fetchMountList()
    } else {
      ElMessage.error(result.errMsg)
    }
  } catch (error) {
    ElMessage.error(error.message || '停止失败')
  }
}

const openMount = async (row) => {
  try {
    await ElMessageBox.confirm(`无法自动打开文件夹，请手动访问:
          ${row.MountPoint}
          点击确认复制路径`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 创建一个虚拟元素来安全复制
    const copy = (text) => {
      return new Promise((resolve) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';  // 避免触发布局变化
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        resolve();
      });
    };

    // 执行流程
    await copy(row.MountPoint);
  } catch (error) {
    // 用户点击取消或其他错误处理
    console.log('复制取消或失败', error);
  }
};

// 获取挂载列表
const fetchMountList = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/get-webdav-client`, {
      credentials: 'include'
    })
    const result = await response.json()
    if (result.errCode === 0) {
      mountList.value = result.data
      osType.value = result.osType || 'windows'
      platform.value = result.platform || 'amd64'
      isExeAdmin.value = result.isExeAdmin

      // 如果不是Windows系统，设置默认挂载方式为rclone
      if (osType.value !== 'windows') {
        newMount.MountVender = 'rclone'
        editMount.MountVender = 'rclone'
      }
    } else if (result.errCode === 1000) {
      router.push('/user-login?callback=mount-mgmt');
    } else {
      ElMessage.error(result.errMsg)
    }
  } catch (error) {
      ElMessage.error('获取挂载列表失败: ' + error.message)
  }
}

onMounted(() => {
  fetchMountList()
  startAutoRefresh()
})

// 自动刷新相关
const autoRefreshInterval = ref(null)

// 开始自动刷新
const startAutoRefresh = () => {
  fetchMountList() // 立即执行一次
  autoRefreshInterval.value = setInterval(fetchMountList, 5000) // 每5秒刷新一次
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
    autoRefreshInterval.value = null
  }
}

// 组件卸载时清除定时器
onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.webdav-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.webdav-content {
  margin: 0 auto;
}

.info-card,
.mount-list-card {
  margin-bottom: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
}

.header-actions {
  margin-left:5px;
  display: flex;
  align-items: center;
  gap: 0px;
}

.readonly-input {
  background-color: #f2f2f2;
  color: #808080;
}

.action-links {
  display: flex;
  gap: 10px;
}

/* 挂载项样式 */
.mount-items-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mount-item {
  background-color: #fff;
  border-radius: 4px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.mount-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.mount-name-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mount-name {
  font-weight: bold;
  font-size: 16px;
}

.mount-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background-color: #f2f2f2;
  color: #666;
}

.mount-status.status-success {
  background-color: #67c23a;
  color: white;
}

.mount-status.status-inactive {
  background-color: #909399;
  color: white;
}

.mount-status.status-error {
  background-color: #f56c6c;
  color: white;
}

.mount-actions {
  display: flex;
  gap: 8px;
}

.mount-details {
  margin-bottom: 12px;
}

.mount-info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
  align-items: center;
}

.mount-info-text {
  font-size: 13px;
  color: #606266;
  padding: 4px 8px;
  background-color: #f8f8f8;
  border-radius: 4px;
  line-height: 1.5;
}

.mount-storage {
  margin-top: 8px;
}

/* 进度条样式调整 */
:deep(.el-progress-bar) {
  padding-right: 0;
  margin-right: 0;
}

:deep(.el-progress__text) {
  font-size: 12px !important;
  color: #606266 !important;
  margin-left: 10px;
  min-width: 180px;
  font-family: monospace;
}

.card-subtitle {
  font-size: 14px;
  color: #606266;
  margin: 0;
  
  .text-error {
    color: #ff0000;
  }
}

/* 日志容器样式 */
.log-container {
  max-height: 60vh;
  overflow: auto;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .mount-item-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .mount-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 8px;
  }
  
  .mount-info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  
  .mount-info-text {
    width: 100%;
    box-sizing: border-box;
  }
  
  :deep(.el-progress__text) {
    display: block;
    margin-top: 4px;
    margin-left: 0;
  }
}
</style>