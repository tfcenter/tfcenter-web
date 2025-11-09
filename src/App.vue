<template>
  <div class="app-container" :class="effectivePosition">
    <LeftSidebar v-if="effectivePosition === 'left'" :username="currentUser" />
    <TopNavbar v-if="effectivePosition === 'top'" :username="currentUser" />
    
    <main class="main-content">
      <router-view />
      <!-- 可拖动的布局切换器 -->
      <div 
        class="layout-switcher draggable" 
        v-if="!isMobile"
        :style="switcherStyle"
        @mousedown="startDrag"
      >
        <button @click="setNavPosition('left')" :class="{ active: navPosition === 'left' }">
          左侧导航
        </button>
        <button @click="setNavPosition('top')" :class="{ active: navPosition === 'top' }">
          顶部导航
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useLayoutStore } from '@/stores/layout'
import LeftSidebar from '@/components/LeftSidebar.vue'
import TopNavbar from '@/components/TopNavbar.vue'

import { API_BASE_URL } from '@/config'
import eventBus from '@/utils/eventBus';

const layoutStore = useLayoutStore()
const currentUser = ref('')

const {
  navPosition,
  isMobile,
  effectivePosition
} = storeToRefs(layoutStore)

const { setNavPosition, checkMobile } = layoutStore

// 拖动相关状态
const switcherPosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

// 切换器样式
const switcherStyle = ref({
  left: '0px',
  top: '0px'
})

// 初始化位置到右下角
const initializePosition = () => {
  // 使用 nextTick 确保 DOM 已渲染，可以获取实际尺寸
  nextTick(() => {
    const switcherElement = document.querySelector('.layout-switcher')
    if (!switcherElement) return
    
    const rect = switcherElement.getBoundingClientRect()
    const margin = 20 // 距离边界的间距
    
    switcherPosition.value = {
      x: window.innerWidth - rect.width - margin,
      y: window.innerHeight - rect.height - margin
    }
    
    updateSwitcherStyle()
  })
}

// 更新切换器样式
const updateSwitcherStyle = () => {
  switcherStyle.value = {
    left: `${switcherPosition.value.x}px`,
    top: `${switcherPosition.value.y}px`
  }
}

// 边界检查函数
const checkBoundaries = () => {
  const switcherElement = document.querySelector('.layout-switcher')
  if (!switcherElement) return
  
  const rect = switcherElement.getBoundingClientRect()
  const margin = 10 // 最小边界距离
  
  // 计算最大允许位置
  const maxX = window.innerWidth - rect.width - margin
  const maxY = window.innerHeight - rect.height - margin
  
  // 确保位置在边界内
  switcherPosition.value.x = Math.max(margin, Math.min(switcherPosition.value.x, maxX))
  switcherPosition.value.y = Math.max(margin, Math.min(switcherPosition.value.y, maxY))
  
  updateSwitcherStyle()
}

// 开始拖动
const startDrag = (e) => {
  // 防止拖动时触发按钮点击
  if (e.target.tagName === 'BUTTON') return
  
  isDragging.value = true
  dragStart.value = {
    x: e.clientX - switcherPosition.value.x,
    y: e.clientY - switcherPosition.value.y
  }
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  
  // 阻止事件冒泡，避免影响页面其他交互
  e.stopPropagation()
  e.preventDefault()
}

// 拖动中
const onDrag = (e) => {
  if (!isDragging.value) return
  
  // 计算新位置
  let newX = e.clientX - dragStart.value.x
  let newY = e.clientY - dragStart.value.y
  
  // 边界检查
  const switcherElement = document.querySelector('.layout-switcher')
  if (!switcherElement) return
  
  const rect = switcherElement.getBoundingClientRect()
  const margin = 10
  const maxX = window.innerWidth - rect.width - margin
  const maxY = window.innerHeight - rect.height - margin
  
  newX = Math.max(margin, Math.min(newX, maxX))
  newY = Math.max(margin, Math.min(newY, maxY))
  
  switcherPosition.value = {
    x: newX,
    y: newY
  }
  
  updateSwitcherStyle()
  
  // 阻止事件冒泡
  e.stopPropagation()
  e.preventDefault()
}

// 停止拖动
const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 窗口大小变化处理
const handleResize = () => {
  checkMobile()
  checkBoundaries() // 窗口缩放时重新检查边界
}

// 获取当前用户信息
const fetchCurrentUser = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/get-currentUser`, {
      credentials: 'include'
    })
    const data = await response.json()
    if (data.errCode && data.errCode !== 0) {
      throw new Error(data.errMsg || '获取用户信息失败')
    } else {
      localStorage.setItem('userInfo', JSON.stringify({
        username: data.username,
        loadCompo: data.loadCompo,
        productName: data.productName
      }))
      eventBus.emit('login', { 
        username: data.username, 
        loadCompo: data.loadCompo, 
        productName: data.productName 
      });
    }
  } catch (error) {
    localStorage.removeItem('userInfo')
    eventBus.emit('login', { username: '' });
    console.error('获取用户信息失败:', error)
  }
}

onMounted(() => {
  checkMobile()
  
  // 延迟初始化位置，确保 DOM 完全渲染
  setTimeout(() => {
    initializePosition()
  }, 100)
  
  window.addEventListener('resize', handleResize)
  fetchCurrentUser()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  // 清理拖动事件监听
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<style scoped>
/* 基础布局 */
.app-container {
  display: flex;
  height: 100vh;
  flex-direction: column;
  transition: all 0.3s ease;
  overflow: hidden; /* 容器本身不滚动 */
}

.app-container.left {
  flex-direction: row;
}

.app-container.top {
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 20px;
  position: relative;
  transition: margin 0.3s ease;
  overflow-y: auto; /* 只有主要内容区域可以垂直滚动 */
  overflow-x: hidden; /* 禁止水平滚动 */
  height: calc(100vh - 40px); /* 减去 padding */
}

/* 左侧导航时的间距 */
.app-container.left .main-content {
  margin-left: 220px;
  width: calc(100% - 220px); /* 确保宽度正确 */
  height: calc(100vh - 40px);
}

/* 顶部导航时的间距 */
.app-container.top .main-content {
  margin-top: 60px;
  height: calc(100vh - 60px - 40px); /* 减去导航栏高度和 padding */
}

/* 布局切换按钮 */
.layout-switcher {
  position: fixed;
  z-index: 9999; /* 确保在最上层，但不会阻止滚动 */
  background: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.15);
  border: 1px solid #e0e0e0;
  display: flex;
  gap: 8px;
  transition: box-shadow 0.2s ease;
  width: fit-content;
  /* 关键：切换器本身不阻止滚动 */
  pointer-events: none;
}

/* 只有在拖动时才捕获鼠标事件 */
.layout-switcher.draggable:active {
  pointer-events: auto;
}

/* 切换器区域可拖动 */
.layout-switcher.draggable::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  cursor: move;
  pointer-events: auto;
  z-index: -1;
}

/* 按钮正常交互 */
.layout-switcher button {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: #f5f5f5;
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
  transition: all 0.2s ease;
  min-width: 60px;
  pointer-events: auto; /* 按钮始终可点击 */
  position: relative;
  z-index: 1;
}

.layout-switcher button:hover {
  background: #e8e8e8;
  transform: translateY(-1px);
}

.layout-switcher button.active {
  background: #3498db;
  color: white;
  border-color: #2980b9;
  box-shadow: 0 2px 4px rgba(41, 128, 185, 0.3);
}

.layout-switcher button.active:hover {
  background: #2980b9;
  transform: translateY(-1px);
}
</style>

<style>
/* 全局样式确保 body 可以滚动 */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: auto;
}

#app {
  height: 100%;
}

/* 确保路由内容可以正常滚动 */
.router-view-container {
  height: 100%;
  overflow-y: auto;
}
</style>