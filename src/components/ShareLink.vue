<template>
  <div class="share-page">
    <!-- 顶部标题 -->
    <div class="page-header">
      <h2 class="page-title">
        <span class="title-link" @click="goToShareLink">
          分享夹
        </span>
        <span class="share-url-hint">
          (链接前缀: {{ shareLinkUrl }})
          <el-button 
            type="text" 
            @click="showShareLinkDialog"
            class="modify-btn"
          >
            修改
          </el-button>
        </span>
      </h2>
    </div>

    <!-- 移动端卡片布局 -->
    <div class="mobile-list" v-if="isMobile">
      <el-card 
        v-for="item in sortedData" 
        :key="item.NO" 
        class="mobile-card"
        shadow="hover"
        v-loading="loading"
      >
        <div class="mobile-card-content">
          <div class="mobile-file-item" @click="handlePathClick(item)">
            <span class="file-icon">{{ getFileIcon(item) }}</span>
            <span class="file-name">{{ item.FileName }}</span>
            <span v-if="item.DeadTime === 'NNN'" class="file-size">({{ item.Size }})</span>
          </div>
          
          <div class="mobile-meta">
            <div class="meta-item">
              <span class="meta-label">更新时间:</span>
              <span>{{ item.UpdateTime }}</span>
            </div>
            
            <div class="meta-item">
              <span class="meta-label">过期时间:</span>
              <span :style="{ color: (item.DeadTime === '已过期') ? 'red' : 'black' }">
                {{ item.DeadTime === 'NNN' ? '' : item.DeadTime }}
              </span>
            </div>
            
            <div class="meta-item">
              <span class="meta-label">大小:</span>
              <span :style="{ color: (item.Size === 'DELETE') ? 'red' : 'black' }">
                {{ formatSizeDisplay(item) }}
              </span>
            </div>
            
            <div v-if="item.DeadTime !== 'NNN' && item.ValidTime !== 0" class="meta-item">
              <span class="meta-label">有效期:</span>
              <span>{{ item.ValidTime }}天</span>
            </div>
            
            <div v-if="item.DeadTime !== 'NNN' && item.Password" class="meta-item">
              <span class="meta-label">密码:</span>
              <div class="password-field">
                <span v-if="showPasswords[item.NO]">{{ item.Password }}</span>
                <span v-else>••••••</span>
                <el-icon class="eye-icon" @click.stop="togglePasswordVisibility(item.NO)">
                  <View v-if="showPasswords[item.NO]" />
                  <Hide v-else />
                </el-icon>
              </div>
            </div>
            
            <div v-if="item.IsDir && item.DeadTime !== 'NNN'" class="meta-item">
              <span class="meta-label">可上传:</span>
              <span>{{ item.Edit ? '是' : '否' }}</span>
            </div>
            
            <div class="meta-item">
              <span class="meta-label">分享者:</span>
              <span>{{ item.UserName }}</span>
            </div>
          </div>
          
          <div class="mobile-actions" v-if="item.DeadTime !== 'NNN'">
            <template v-if="item.StopStatus">
              <el-button v-if="item.Size !== 'DELETE'"
                size="mini"
                @click.stop="startShareLink(item)"
              >
                启动
              </el-button>
            </template>
            <template v-else>
              <el-button v-if="item.Size !== 'DELETE'"
                size="mini"
                @click.stop="stopShareLink(item)"
              >
                停止
              </el-button>
              <el-button v-if="item.Size !== 'DELETE'"
                size="mini"
                @click.stop="showUpdateDialog(item)"
              >
                修改
              </el-button>
              <el-button
                size="mini"
                @click.stop="deleteShareLink(item)"
              >
                删除
              </el-button>
              <el-button v-if="item.Size !== 'DELETE'"
                size="mini"
                @click.stop="copyShareLink(item)"
              >
                {{ item.IsEdit ? '分享' : '复制' }}
              </el-button>
            </template>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 桌面端表格布局 -->
    <el-card class="share-container" v-loading="loading" v-else>
      <el-table
        :data="sortedData"
        style="width: 100%"
        @sort-change="handleSortChange"
        :default-sort="{ prop: 'UpdateTime', order: 'descending' }"
      >
        <el-table-column prop="FileName" label="文件名" min-width="300" sortable>
            <template #default="{ row }">
                <div class="file-item">
                <span class="file-icon">{{ getFileIcon(row) }}</span>
                <span 
                    class="file-name clickable" 
                    @click.stop="handlePathClick(row)"
                >
                    {{ row.FileName }}
                </span>
                <span v-if="row.DeadTime === 'NNN'" class="file-path">({{ row.Size }})</span>
                </div>
            </template>
        </el-table-column>
        
        <el-table-column 
          prop="UpdateTime" 
          label="更新时间" 
          width="150" 
          align="center"
          sortable
        />
        
        <el-table-column 
          prop="DeadTime" 
          label="过期时间" 
          width="120" 
          align="center"
          sortable
        >
          <template #default="{ row }">
            <span :style="{ color: (row.DeadTime === '已过期') ? 'red' : 'black' }">
              {{ row.DeadTime === 'NNN' ? '' : row.DeadTime }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column 
          label="文件属性" 
          width="100" 
          align="center"
          sortable
          :sort-by="(row) => row.RealSize"
        >
          <template #default="{ row }">
            <span :style="{ color: (row.Size === 'DELETE') ? 'red' : 'black' }">
              {{ formatSizeDisplay(row) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="有效期(天)" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.DeadTime !== 'NNN' && row.ValidTime === 0">
              无
            </span>
            <span v-else-if="row.DeadTime !== 'NNN' && row.ValidTime !== 0">
              {{ row.ValidTime }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="下载密码" width="150" align="center">
          <template #default="{ row }">
            <div v-if="row.DeadTime !== 'NNN' && row.Password">
              <div class="password-field">
                <span v-if="showPasswords[row.NO]">{{ row.Password }}</span>
                <span v-else>••••••</span>
                <el-icon class="eye-icon" @click="togglePasswordVisibility(row.NO)">
                  <View v-if="showPasswords[row.NO]" />
                  <Hide v-else />
                </el-icon>
              </div>
            </div>
            <span v-else-if="row.DeadTime !== 'NNN' && !row.Password">无</span>
          </template>
        </el-table-column>

        <el-table-column label="可上传" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.IsDir && row.DeadTime !== 'NNN' && row.Edit === false">
              否
            </span>
            <span v-else-if="row.IsDir && row.DeadTime !== 'NNN' && row.Edit === true">
              是
            </span>
          </template>
        </el-table-column>
        
        <el-table-column 
          prop="UserName" 
          label="分享者" 
          width="120" 
          align="center"
          sortable
        />
        
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <div v-if="row.DeadTime !== 'NNN'"   class="action-buttons">
              <template v-if="row.StopStatus">
                <el-button v-if="row.Size !== 'DELETE'"
                  size="small"
                  type="text"
                  @click="startShareLink(row)"
                >
                  启动
                </el-button>
              </template>
              <template v-else>
                <el-button v-if="row.Size !== 'DELETE'"
                  size="small"
                  type="text"
                  @click="stopShareLink(row)"
                >
                  停止
                </el-button>
                <el-button v-if="row.Size !== 'DELETE'"
                  size="small"
                  type="text"
                  @click="showUpdateDialog(row)"
                >
                  修改
                </el-button>
                <el-button
                  size="small"
                  type="text"
                  @click="deleteShareLink(row)"
                >
                  删除
                </el-button>
                <el-button v-if="row.Size !== 'DELETE'"
                  size="small"
                  type="text"
                  @click="copyShareLink(row)"
                >
                  {{ row.IsEdit ? '分享链接' : '复制链接' }}
                </el-button>
              </template>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 更新分享链接对话框 -->
    <el-dialog
      v-model="updateDialogVisible"
      title="更新分享链接"
      width="500px"
    >
      <el-form :model="currentShareLink" label-width="120px">
        <el-form-item label="文件名">
          <el-input v-model="currentShareLink.FileName" disabled />
        </el-form-item>
        <el-form-item label="有效期" required>
          <el-radio-group v-model="currentShareLink.validType">
            <el-radio :label="0">长期有效</el-radio>
            <el-radio :label="1">自定义</el-radio>
          </el-radio-group>
          <el-input-number
            v-if="currentShareLink.validType === 1"
            v-model="currentShareLink.ValidTime"
            :min="1"
            :max="365"
            controls-position="right"
            style="margin-top: 8px;"
            placeholder="输入有效期天数"
          />
        </el-form-item>

        <el-form-item label="下载密码">
          <el-input
            v-model="currentShareLink.Password"
            placeholder="留空表示无密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="是否可上传" v-if="currentShareLink.IsDir">
          <el-switch
            v-model="currentShareLink.Edit"
            active-text="是"
            inactive-text="否"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="updateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmUpdate">确定</el-button>
      </template>
    </el-dialog>

    <!-- 修改分享链接前缀对话框 -->
    <el-dialog
      v-model="shareLinkDialogVisible"
      title="修改分享链接前缀"
      width="500px"
    >
      <el-form :model="shareLinkForm" label-width="120px">
        <el-form-item label="链接前缀" required>
          <el-input v-model="shareLinkForm.url" placeholder="请输入分享链接前缀" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shareLinkDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="updateShareLinkUrl">确定</el-button>
      </template>
    </el-dialog>

    <!-- 消息提示 -->
    <el-dialog
      v-model="showAlert"
      title="提示"
      width="30%"
      center
    >
      <span>{{ alertMessage }}</span>
      <template #footer>
        <el-button @click="showAlert = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { API_BASE_URL, HOME_BASE_URL } from '@/config'
import { View, Hide } from '@element-plus/icons-vue'

const router = useRouter()

const refreshInterval = ref(null)

// 设置自动刷新
const setupAutoRefresh = () => {
  // 每10秒自动刷新一次数据
  refreshInterval.value = setInterval(fetchShareLinks, 5000)
}

// 清除自动刷新
const clearAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}


// 响应式屏幕检测
const isMobile = ref(false)
const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 768
}

// 密码显示状态
const showPasswords = ref({})
const togglePasswordVisibility = (id) => {
  showPasswords.value = {
    ...showPasswords.value,
    [id]: !showPasswords.value[id]
  }
}

const goToShareLink = () => {
  window.location.href = '/shareLink-list';
}

const goToMedaShareLink = () => {
  window.location.href = '/shareLink-list?media=1';
}

// 数据状态
const loading = ref(true)
const data = ref([])
const shareLinkUrl = ref('')
const showAlert = ref(false)
const alertMessage = ref('')
const sortProp = ref('UpdateTime')
const sortOrder = ref('descending')

// 对话框相关
const updateDialogVisible = ref(false)
const shareLinkDialogVisible = ref(false)
const shareLinkForm = ref({
  url: ''
})

const currentShareLink = ref({
  NO: '',
  FileName: '',
  UserName: '',
  ValidTime: 0,
  Password: '',
  Edit: false,
  IsDir: false,
  validType: 0 // 0-长期有效, 1-自定义
})

// 显示修改分享链接前缀对话框
const showShareLinkDialog = () => {
  shareLinkForm.value.url = shareLinkUrl.value
  shareLinkDialogVisible.value = true
}

// 路径点击处理
const handlePathClick = (row) => {
  if (row.Size === 'DELETE') {
    ElMessage.error('对象已删除')
    return 
  }

  if (row.IsDir) {
    if (row.DeadTime === 'NNN') {
        goToMedaShareLink()
    } else {
        router.push(`/file-list?path=${encodeURIComponent(row.Path)}`)
    }
  } else if (row.IsTxt) {
    window.open(`${HOME_BASE_URL}/open-text/${encodeURIComponent(row.FileName)}?path=${encodeURIComponent(row.Path)}`, '_blank')
  } else {
    window.open(`${API_BASE_URL}/open-file/${encodeURIComponent(row.FileName)}?path=${encodeURIComponent(row.Path)}`, '_blank')
  }
}

// 更新分享链接前缀
const updateShareLinkUrl = async () => {
  try {
    const params = new URLSearchParams()
    params.append('shareLinkUrl', shareLinkForm.value.url)

    const response = await fetch(`${API_BASE_URL}/update-shareLinkUrl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      credentials: 'include',
      body: params
    })
    
    if (!response.ok) {
      throw new Error('更新分享链接前缀失败')
    }
    
    const result = await response.json()
    if (result.errCode !== 0) {
      throw new Error(result.errMsg || '更新分享链接前缀失败')
    }
    
    shareLinkUrl.value = shareLinkForm.value.url
    shareLinkDialogVisible.value = false
    ElMessage.success('更新成功')
  } catch (error) {
    ElMessage.error(error.message)
  }
}

// 显示更新对话框
const showUpdateDialog = (row) => {
  currentShareLink.value = {
    NO: row.NO,
    FileName: row.FileName,
    UserName: row.UserName,
    ValidTime: row.ValidTime || 7,
    validType: row.ValidTime === 0 ? 0 : 1,
    Password: row.Password || '',
    Edit: row.Edit,
    IsDir: row.IsDir
  }
  updateDialogVisible.value = true
}

// 确认更新分享链接
const confirmUpdate = async () => {
  try {
    if (currentShareLink.value.Password && 
        (currentShareLink.value.Password.length < 2 || currentShareLink.value.Password.length > 64)) {
      ElMessage.warning('密码长度必须为2-64位或为空')
      return
    }

    const validTime = currentShareLink.value.validType === 0 ? 0 : currentShareLink.value.ValidTime

    const params = new URLSearchParams()
    params.append('name', currentShareLink.value.UserName)
    params.append('id', currentShareLink.value.NO)
    params.append('validTime', validTime)
    params.append('edit', currentShareLink.value.Edit ? '1' : '0')
    params.append('password', currentShareLink.value.Password || '')
    
    const response = await fetch(`${API_BASE_URL}/update-shareLink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      credentials: 'include',
      body: params
    })
    
    if (!response.ok) {
      throw new Error('更新分享链接失败')
    }
    
    const result = await response.json()
    if (result.errCode !== 0) {
      throw new Error(result.errMsg || '更新分享链接失败')
    }
    
    ElMessage.success('更新成功')
    updateDialogVisible.value = false
    fetchShareLinks()
  } catch (error) {
    ElMessage.error(error.message)
  }
}

// 格式化文件大小显示
const formatSizeDisplay = (row) => {
  if (row.DeadTime === 'NNN') return ''
  if (row.Size === 'NA') return '文件夹'
  if (row.Size === 'DELETE') return '已删除'
  if (row.RealSize > 0) return formatSize(row.RealSize)
  return row.Size
}

// 格式化文件大小
const formatSize = (bytes) => {
  if (isNaN(bytes) || bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const base = 1024;
  const exponent = Math.floor(Math.log(bytes) / Math.log(base));
  const unit = units[Math.min(exponent, units.length - 1)];
  
  return `${(bytes / Math.pow(base, exponent)).toFixed(2)} ${unit}`;
}

// 获取分享链接列表
const fetchShareLinks = async () => {
  try {
    const queryString = window.location.search; 
    const urlParams = new URLSearchParams(queryString); 
    const mediaValue = urlParams.get('media');

    const getShareLinkUrl = mediaValue 
          ? `${API_BASE_URL}/get-shareLink?media=1` 
          : `${API_BASE_URL}/get-shareLink`;

    loading.value = true
    const response = await fetch(getShareLinkUrl, {
      method: 'GET',
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error('获取分享链接失败')
    }
    
    const result = await response.json()

    if (result.errCode === 1000) {
        ElMessage.error('请先登录系统');
        router.push('/user-login?callback=shareLink-list');
        return;
    } 
    
    if (result.errCode != 0) {
      ElMessage.error(result.errMsg)
    }

    data.value = result.data || []
    shareLinkUrl.value = result.shareLinkUrl || ''
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}

// 排序后的数据
const sortedData = computed(() => {
  return [...data.value].sort((a, b) => {
    let compareResult = 0
    
    switch (sortProp.value) {
      case 'FileName':
        compareResult = a.FileName.localeCompare(b.FileName)
        break
      case 'UserName':
        compareResult = a.UserName.localeCompare(b.UserName)
        break
      case 'UpdateTime':
        compareResult = new Date(a.UpdateTime) - new Date(b.UpdateTime)
        break
      case 'DeadTime':
        compareResult = (a.DeadTime || '').localeCompare(b.DeadTime || '')
        break
      case 'RealSize':
        compareResult = (a.RealSize || 0) - (b.RealSize || 0)
        break
      default:
        compareResult = 0
    }
    
    return sortOrder.value === 'ascending' ? compareResult : -compareResult
  })
})

// 处理排序变化
const handleSortChange = ({ prop, order }) => {
  sortProp.value = prop
  sortOrder.value = order || 'descending'
}

// 文件图标函数
const getFileIcon = (file) => {
  if (file.IsDir) return '📁'
  if (file.IsPic) return '🖼️'
  if (file.IsWord) return '📝'
  if (file.IsExcel) return '📊'
  if (file.IsPpt) return '📑'
  if (file.IsPdf) return '📘'
  if (file.IsTxt) return '📄'
  if (file.IsRar) return '🗜️'
  if (file.IsVideo) return '🎬'
  if (file.IsMusic) return '🎵'
  return '📄'
}

// 启动分享链接
const startShareLink = async (row) => {
  try {
    const params = new URLSearchParams()
    params.append('name', row.UserName)
    params.append('id', row.NO)
    
    const response = await fetch(`${API_BASE_URL}/start-shareLink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      credentials: 'include',
      body: params
    })
    
    if (!response.ok) {
      throw new Error('启动分享链接失败')
    }
    
    const result = await response.json()
    if (result.errCode !== 0) {
      throw new Error(result.errMsg || '启动分享链接失败')
    }
    
    ElMessage.success('启动成功')
    fetchShareLinks()
  } catch (error) {
    ElMessage.error(error.message)
  }
}

// 停止分享链接
const stopShareLink = async (row) => {
  try {
    const params = new URLSearchParams()
    params.append('name', row.UserName)
    params.append('id', row.NO)
    
    const response = await fetch(`${API_BASE_URL}/stop-shareLink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      credentials: 'include',
      body: params
    })
    
    if (!response.ok) {
      throw new Error('停止分享链接失败')
    }
    
    const result = await response.json()
    if (result.errCode !== 0) {
      throw new Error(result.errMsg || '停止分享链接失败')
    }
    
    ElMessage.success('停止成功')
    fetchShareLinks()
  } catch (error) {
    ElMessage.error(error.message)
  }
}

// 删除分享链接
const deleteShareLink = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除分享链接 "${row.FileName}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const params = new URLSearchParams()
    params.append('name', row.UserName)
    params.append('id', row.NO)
    
    const response = await fetch(`${API_BASE_URL}/delete-shareLink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      credentials: 'include',
      body: params
    })
    
    if (!response.ok) {
      throw new Error('删除分享链接失败')
    }
    
    const result = await response.json()
    if (result.errCode !== 0) {
      throw new Error(result.errMsg || '删除分享链接失败')
    }
    
    ElMessage.success('删除成功')
    fetchShareLinks()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message)
    }
  }
}

// 复制文本到剪贴板
const copyText = (text) => {
    return new Promise((resolve) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    resolve();
    });
}

// 复制分享链接
const copyShareLink = (row) => {
  if (row.IsEdit) {
    showAlert.value = true
    alertMessage.value = '该链接可能因在线编辑导致是旧文件，可通过在线预览下载最新内容'
  }
  
  const url = `${shareLinkUrl.value}/share-fileManagement/${encodeURIComponent(row.FileName)}?shareID=${row.NO}`
  try {
    copyText(url)
    ElMessage.success('链接已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error(`复制失败: ${error.message || '请手动复制链接'} ${url}`)
  }
}

// 初始化加载
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
  fetchShareLinks()
  setupAutoRefresh() // 初始化时启动自动刷新
})

onUnmounted(() => {
  clearAutoRefresh()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkScreenSize)
})
</script>

<style scoped>
.share-page {
  padding: 10px;
  max-width: 100%;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 15px;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  display: flex;
  flex-direction: column;
}

.title-link {
  cursor: pointer;
  color: var(--el-color-primary);
}

.share-url-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 5px;
  display: flex;
  align-items: center;
}

.modify-btn {
  padding: 0;
  margin-left: 5px;
  font-size: 12px;
}

/* 桌面端表格样式 */
.share-container {
  margin-top: 15px;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-table th) {
  padding: 8px 0;
}

:deep(.el-table td) {
  padding: 6px 0;
}

:deep(.el-table .cell) {
  padding-left: 5px;
  padding-right: 5px;
  line-height: 1.4;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.file-icon {
  font-size: 16px;
  width: 20px;
  display: inline-block;
  text-align: center;
}

.file-name {
  word-break: break-all;
  cursor: pointer;
  color: var(--el-color-primary);
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.action-buttons .el-button {
  font-size: 12px;
  padding: 0 5px;
}

/* 移动端卡片样式 */
.mobile-list {
  margin-top: 10px;
}

.mobile-card {
  margin-bottom: 10px;
  border-radius: 8px;
}

.mobile-card-content {
  padding: 10px;
}

.mobile-file-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  cursor: pointer;
}

.mobile-file-item .file-icon {
  margin-right: 8px;
  font-size: 18px;
}

.mobile-file-item .file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-color-primary);
}

.mobile-file-item .file-size {
  margin-left: 5px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.mobile-meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 10px;
  font-size: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
}

.meta-label {
  color: var(--el-text-color-secondary);
  margin-right: 5px;
}

.mobile-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}

.mobile-actions .el-button {
  flex: 1;
  min-width: 60px;
  padding: 5px;
  font-size: 12px;
}

/* 密码字段样式 */
.password-field {
  display: flex;
  align-items: center;
  gap: 5px;
}

.eye-icon {
  cursor: pointer;
  color: #909399;
  font-size: 14px;
  transition: color 0.2s;
}

.eye-icon:hover {
  color: #409eff;
}

/* 对话框样式调整 */
:deep(.el-dialog) {
  width: 90% !important;
  max-width: 500px;
}

:deep(.el-dialog__body) {
  padding: 15px 20px;
}

:deep(.el-form-item) {
  margin-bottom: 15px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .page-title {
    font-size: 16px;
  }
  
  .share-url-hint {
    font-size: 11px;
  }
  
  .mobile-meta {
    grid-template-columns: 1fr;
  }
  
  .mobile-actions .el-button {
    min-width: 45px;
    font-size: 11px;
    padding: 4px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 15px;
  }
  
  .mobile-file-item {
    font-size: 13px;
  }
  
  .mobile-meta {
    font-size: 11px;
  }
  
  .mobile-actions .el-button {
    min-width: 40px;
    font-size: 10px;
    padding: 3px;
  }
}
</style>