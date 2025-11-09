<template>
  <div class="collect-page">
    <!-- 顶部导航栏 -->
    <div class="page-header">
      <h2 class="page-title">收藏夹</h2>
      <el-tag v-if="data.length > 0" type="info">共 {{ data.length }} 项收藏</el-tag>
    </div>

    <!-- 桌面端表格布局 -->
    <el-card class="collect-container" v-loading="loading" v-if="!isMobile">
      <el-table
        :data="sortedData"
        style="width: 100%"
        @sort-change="handleSortChange"
        :default-sort="{ prop: 'UpdateTime', order: 'descending' }"
      >
        <el-table-column prop="Path" label="文件路径" min-width="300" sortable="custom">
          <template #default="{ row }">
            <div class="file-item">
              <span class="file-icon">{{ getFileIcon(row) }}</span>
              <span 
                class="file-path clickable" 
                @click="handlePathClick(row)"
              >
                {{ row.Path }}
              </span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column 
          prop="UpdateTime" 
          label="收藏时间" 
          width="180" 
          align="center"
          sortable="custom"
        />
        
        <el-table-column 
          label="文件大小" 
          width="120" 
          align="center"
          sortable="custom"
          :sort-by="(row) => row.RealSize"
        >
          <template #default="{ row }">
           <span :style="{ color: (row.Size === 'DELETE') ? 'red' : 'black' }">
            {{ row.Size === 'NA' ? '文件夹' : row.Size === 'DELETE' ? '已删除' : formatSize(row.RealSize) }}
           </span>
          </template>
        </el-table-column>
        
        <el-table-column 
          prop="Name" 
          label="收藏者" 
          width="120" 
          align="center"
          sortable="custom"
        />
        
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              type="danger"
              @click.stop="deleteCollect(row)"
              :loading="deletingId === row.Path"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 移动端卡片布局 -->
    <div class="mobile-collect-list" v-else>
      <el-card 
        v-for="item in sortedData" 
        :key="item.Path" 
        class="mobile-collect-card"
        shadow="hover"
      >
        <div class="mobile-collect-content">
          <div class="mobile-file-item" @click="handlePathClick(item)">
            <span class="file-icon">{{ getFileIcon(item) }}</span>
            <span class="file-path">{{ item.Path }}</span>
          </div>
          
          <div class="mobile-collect-meta">
            <div class="meta-item">
              <span class="meta-label">收藏时间:</span>
              <span>{{ item.UpdateTime }}</span>
            </div>
            
            <div class="meta-item">
              <span class="meta-label">文件大小:</span>
              <span :style="{ color: (item.Size === 'DELETE') ? 'red' : 'black' }">
                {{ item.Size === 'NA' ? '文件夹' : item.Size === 'DELETE' ? '已删除' : formatSize(item.RealSize) }}
              </span>
            </div>
            
            <div class="meta-item">
              <span class="meta-label">收藏者:</span>
              <span>{{ item.Name }}</span>
            </div>
          </div>
          
          <div class="mobile-collect-actions">
            <el-button
              size="mini"
              type="danger"
              @click.stop="deleteCollect(item)"
              :loading="deletingId === item.Path"
            >
              删除
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { API_BASE_URL, HOME_BASE_URL } from '@/config'

const router = useRouter()

// 响应式屏幕检测
const isMobile = ref(false)
const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 768
}

// 数据状态
const loading = ref(true)
const data = ref([])
const deletingId = ref(null)
const sortProp = ref('UpdateTime')
const sortOrder = ref('descending')

const refreshInterval = ref(null)

// 设置自动刷新
const setupAutoRefresh = () => {
  // 每10秒自动刷新一次数据
  refreshInterval.value = setInterval(fetchCollectList, 5000)
}

// 清除自动刷新
const clearAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

// 获取收藏列表
const fetchCollectList = async () => {
  try {
    loading.value = true
    const response = await fetch(`${API_BASE_URL}/get-collect`, {
      method: 'GET',
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error('获取收藏列表失败')
    }
    
    const result = await response.json()

    if (result.errCode === 1000) {
        ElMessage.error('请先登录系统');
        router.push('/user-login?callback=collect-list');
        return;
    } 
    
    if (result.errCode != 0) {
      ElMessage.error(result.errMsg)
      return
    }

    data.value = result.data || []
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
      case 'Path':
        compareResult = a.Path.localeCompare(b.Path)
        break
      case 'Name':
        compareResult = a.Name.localeCompare(b.Name)
        break
      case 'UpdateTime':
        compareResult = new Date(a.UpdateTime) - new Date(b.UpdateTime)
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

// 格式化文件大小
const formatSize = (bytes) => {
  if (isNaN(bytes) || bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const base = 1024;
  const exponent = Math.floor(Math.log(bytes) / Math.log(base));
  const unit = units[Math.min(exponent, units.length - 1)];
  
  return `${(bytes / Math.pow(base, exponent)).toFixed(2)} ${unit}`;
}

// 路径点击处理
const handlePathClick = (row) => {
  if (row.Size === 'DELETE') {
    ElMessage.error('对象已删除')
    return 
  }

  if (row.IsDir) {
    router.push(`/file-list?path=${encodeURIComponent(row.Path)}`)
  } else if (row.IsTxt) {
    window.open(`${HOME_BASE_URL}/open-text/${encodeURIComponent(row.FileName)}?path=${encodeURIComponent(row.Path)}`, '_blank')
  } else {
    window.open(`${API_BASE_URL}/open-file/${encodeURIComponent(row.FileName)}?path=${encodeURIComponent(row.Path)}`, '_blank')
  }
}

// 删除收藏
const deleteCollect = async (item) => {
  try {
    await ElMessageBox.confirm(`确定要删除收藏 "${item.Path}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    deletingId.value = item.Path
    const params = new URLSearchParams()
    params.append('name', item.Name)
    params.append('path', item.Path)
    
    const response = await fetch(`${API_BASE_URL}/delete-collect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      credentials: 'include',
      body: params
    })
    
    if (!response.ok) {
      throw new Error('删除收藏失败')
    }
    
    const result = await response.json()
    if (result.errCode !== 0) {
      throw new Error(result.errMsg || '删除收藏失败')
    }
    
    ElMessage.success('删除成功')
    fetchCollectList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message)
    }
  } finally {
    deletingId.value = null
  }
}

// 初始化加载
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
  fetchCollectList()
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
.collect-page {
  padding: 15px;
  max-width: 100%;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

/* 桌面端表格样式 */
.collect-container {
  margin-top: 15px;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table th) {
  padding: 10px 0;
}

:deep(.el-table td) {
  padding: 8px 0;
}

:deep(.el-table .cell) {
  padding-left: 8px;
  padding-right: 8px;
  line-height: 1.5;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  font-size: 18px;
  width: 24px;
  display: inline-block;
  text-align: center;
}

.file-path {
  word-break: break-all;
}

.clickable {
  color: var(--el-color-primary);
  cursor: pointer;
}

.clickable:hover {
  text-decoration: underline;
}

/* 移动端卡片样式 */
.mobile-collect-list {
  margin-top: 10px;
}

.mobile-collect-card {
  margin-bottom: 10px;
  border-radius: 8px;
}

.mobile-collect-content {
  padding: 12px;
}

.mobile-file-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 15px;
  cursor: pointer;
}

.mobile-file-item .file-icon {
  margin-right: 10px;
  font-size: 20px;
}

.mobile-file-item .file-path {
  flex: 1;
  word-break: break-all;
  color: var(--el-color-primary);
}

.mobile-collect-meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 12px;
  font-size: 13px;
}

.meta-item {
  display: flex;
  align-items: center;
}

.meta-label {
  color: var(--el-text-color-secondary);
  margin-right: 6px;
}

.mobile-collect-actions {
  display: flex;
  justify-content: flex-end;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .collect-page {
    padding: 10px;
  }
  
  .page-title {
    font-size: 18px;
  }
  
  .mobile-collect-meta {
    grid-template-columns: 1fr;
  }
  
  .mobile-file-item {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 16px;
  }
  
  .mobile-collect-content {
    padding: 10px;
  }
  
  .mobile-file-item {
    font-size: 13px;
  }
  
  .mobile-collect-meta {
    font-size: 12px;
  }
}
</style>