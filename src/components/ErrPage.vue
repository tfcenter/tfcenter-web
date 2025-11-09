<template>
  <div class="error-container">
    <div class="error-content">
      <!-- 错误图标 -->
      <div class="error-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#F56C6C" stroke-width="2"/>
          <path d="M12 8V12" stroke="#F56C6C" stroke-width="2" stroke-linecap="round"/>
          <path d="M12 16H12.01" stroke="#F56C6C" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      
      <!-- 错误标题 -->
      <h1 class="error-title">发生错误</h1>
      
      <!-- 错误信息 -->
      <div class="error-message">
        {{ errorMessage || '未知错误' }}
      </div>
      
      <!-- 操作按钮 -->
      <div class="error-actions">
        <el-button type="primary" @click="goHome">返回首页</el-button>
        <el-button @click="goBack">返回上一页</el-button>
      </div>
      
      <!-- 错误详情（开发环境显示） -->
      <div v-if="errorDetail && isDev" class="error-detail">
        <h3>错误详情</h3>
        <pre>{{ errorDetail }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 错误信息参数
const errorMessage = ref('')
const errorDetail = ref(null)

// 更安全的环境检测方式
const isDev = computed(() => {
  try {
    // 尝试多种环境变量获取方式
    return import.meta.env?.MODE === 'development' || 
           process.env.NODE_ENV === 'development' ||
           process.env.VUE_APP_ENV === 'development'
  } catch {
    return false
  }
})

// 解析URL参数
const parseErrorParams = () => {
  try {
    // 解码message参数
    errorMessage.value = route.query.message 
      ? decodeURIComponent(route.query.message)
      : '未知错误'
    
    // 解析detail参数
    if (route.query.detail) {
      try {
        errorDetail.value = JSON.parse(decodeURIComponent(route.query.detail))
      } catch (e) {
        errorDetail.value = { 
          rawDetail: route.query.detail,
          parseError: e.message
        }
      }
    }
  } catch (e) {
    errorMessage.value = '参数解析错误: ' + e.message
  }
}

// 返回首页
const goHome = () => {
  router.push('/')
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 组件挂载时解析参数
onMounted(() => {
  parseErrorParams()
})
</script>

<style scoped>
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f8f8;
  padding: 20px;
}

.error-content {
  max-width: 600px;
  width: 100%;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  text-align: center;
}

.error-icon {
  margin-bottom: 20px;
}

.error-icon svg {
  color: #f56c6c;
}

.error-title {
  font-size: 24px;
  color: #f56c6c;
  margin-bottom: 16px;
}

.error-message {
  font-size: 16px;
  color: #606266;
  margin-bottom: 24px;
  word-break: break-word;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.error-detail {
  margin-top: 30px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
  text-align: left;
}

.error-detail h3 {
  margin-bottom: 10px;
  color: #909399;
}

.error-detail pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #666;
}
</style>