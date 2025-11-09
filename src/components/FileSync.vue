<template>
  <div class="file-sync-container">
    <!-- 全局同步服务卡片 -->
    <div class="service-card">
      <h3>同步服务(单向同步)</h3>
      <div class="service-controls">
        <span class="status-badge" :class="{ 'running': globalSwitch }">
          {{ globalSwitch ? '已开启' : '已关闭' }}
        </span>
        <button 
          @click="globalSwitch ? stopGlobalFileSync() : startGlobalFileSync()"
          :disabled="serviceLoading"
        >
          <span v-if="serviceLoading">处理中...</span>
          <span v-else>{{ globalSwitch ? '关闭' : '开启' }}</span>
        </button>
      </div>
    </div>

    <!-- WiFi同步服务卡片 -->
    <div v-if="isMobileServer" class="service-card">
      <h3>WiFi同步操作(当前网络: {{ currentNetwork }})</h3>
      <div class="service-controls">
        <span class="status-badge" :class="{ 'running': wifiFileSyncFlag }">
          {{ wifiFileSyncFlag ? '已开启' : '已关闭' }}
        </span>
        <button 
          @click="wifiFileSyncFlag ? stopWiFiFileSync() : startWiFiFileSync()"
          :disabled="serviceLoading"
        >
          <span v-if="serviceLoading">处理中...</span>
          <span v-else>{{ wifiFileSyncFlag ? '关闭' : '开启' }}</span>
        </button>
      </div>
    </div>

    <!-- 同步任务列表 -->
    <div class="sync-list">
      <div class="list-header">
        <h3>同步列表</h3>
        <div class="list-actions">
          <button @click="showTaskDialog('add')" class="action-btn add-btn">+ 新增任务</button>
        </div>
      </div>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th width="60px">名称</th>
              <th width="150px">本端路径</th>
              <th width="150px">对端地址</th>
              <th width="150px">对端路径</th>
              <th width="80px">对端用户名</th>
              <th width="80px">扫描周期(s)</th>
              <th width="60px">同步方式</th>
              <th width="160px">状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(task, name) in syncTasks" :key="name" class="task-row">
              <td>{{ name }}</td>
              <td>{{ task.LocalPath }}</td>
              <td>{{ task.RemoteAddr }}</td>
              <td>{{ task.RemotePath }}</td>
              <td>{{ task.RemoteUsername }}</td>
              <td>{{ task.ScanTime }}</td>
              <td class="sync-method">
                {{ getChannelName(task.Channel) }}
              </td>
              <td class="status">
                {{ task.Status }}
              </td>
              <td class="actions">
                <button 
                  v-if="task.Switch" 
                  @click="stopFileSyncPer(name)" 
                  class="action-btn stop-btn"
                >
                  停止
                </button>
                <template v-else>
                  <button @click="startFileSyncPer(name)" class="action-btn edit-btn">启动</button>
                  <button @click="showTaskDialog('edit', name, task)" class="action-btn edit-btn">编辑</button>
                  <button @click="deleteFileSyncTask(name)" class="action-btn delete-btn">删除</button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 任务编辑/新增对话框 -->
    <div v-if="showTaskDialogModel" class="dialog-overlay">
      <div class="task-dialog">
        <div class="dialog-header">
          <h3>{{ dialogMode === 'add' ? '新增同步任务' : '编辑同步任务' }}</h3>
          <span class="close" @click="closeTaskDialog">&times;</span>
        </div>
        <div class="dialog-content">
          <div class="form-group">
            <label>任务名称</label>
            <input type="text" v-model="currentTask.name" placeholder="3-15个字符，只能是数字、字母" style="width: 200px;" />
          </div>
          <div class="form-group">
            <label>本端路径</label>
            <div class="path-input">
              <input type="text" v-model="currentTask.localPath" placeholder="本地路径" readonly style="width: 300px;" />
              <button @click="selectDir" class="select-btn">选择</button>
            </div>
          </div>
          <div class="form-group">
            <label>对端地址</label>
            <input type="text" v-model="currentTask.remoteAddr" placeholder="例如: 192.168.1.100:8080" style="width: 400px;" />
          </div>
          <div class="form-group">
            <label>对端路径</label>
            <input type="text" v-model="currentTask.remotePath" placeholder="对端路径" style="width: 400px;" />
          </div>
          <div class="form-group">
            <label>对端用户名</label>
            <input type="text" v-model="currentTask.remoteUsername" placeholder="用户名" style="width: 200px;" />
          </div>
          <div class="form-group">
            <label>对端密码</label>
            <div class="password-input">
              <input 
                :type="showPassword ? 'text' : 'password'" 
                v-model="remotePassword" 
                :placeholder="dialogMode === 'edit' ? '留空表示不修改密码' : '请输入密码'" 
                style="width: 200px;"
              />
              <button @click="showPassword = !showPassword" class="toggle-password">
                {{ showPassword ? '隐藏' : '显示' }}
              </button>
            </div>
            <div v-if="dialogMode === 'edit'" class="password-hint">留空表示不修改密码</div>
          </div>
          <div class="form-group">
            <label>扫描周期(秒)</label>
            <input type="number" v-model="currentTask.scanTime" placeholder="60" min="1" style="width: 200px;" />
          </div>
        </div>
        <div class="dialog-actions">
          <button @click="closeTaskDialog" class="dialog-btn cancel">取消</button>
          <button 
            @click="dialogMode === 'add' ? addFileSyncTask() : updateFileSyncTask(currentTask.name)" 
            class="dialog-btn confirm"
            :disabled="!isTaskValid"
          >
            {{ dialogMode === 'add' ? '新增' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 文件夹选择对话框 -->
    <div v-if="showFolderModal" class="dialog-overlay">
      <div class="directory-dialog">
        <div class="dialog-header">
          <button 
            v-if="currentFolderPath !== '/'" 
            @click="goToParentFolder" 
            class="nav-btn prev-btn"
          >
            ↑ 上一级
          </button>
          <h3>当前路径: {{ currentFolderPath || '/' }}</h3>
          <span class="close" @click="closeFolderModal">&times;</span>
        </div>
        <div class="dialog-content">
          <div class="directory-tree">
            <ul v-if="folders.length > 0">
              <li 
                v-for="folder in folders" 
                :key="folder.Path"
                @click="selectFolder(folder)"
                @dblclick="enterFolder(folder)"
                class="directory-entry"
                :class="{ 'selected': selectedFolder && selectedFolder.Path === folder.Path }"
              >
                <span class="folder-icon">📁</span>
                <span class="directory-name">{{ folder.Name }}</span>
                <span class="enter-icon" @click.stop="enterFolder(folder)">→</span>
              </li>
            </ul>
            <div v-else class="empty-directory">
              当前目录为空
            </div>
          </div>
        </div>
        <div class="dialog-actions">
          <div class="selected-path" v-if="selectedFolder">
            已选择: {{ selectedFolder.Path }}
          </div>
          <div class="action-buttons">
            <button @click="closeFolderModal" class="dialog-btn cancel">取消</button>
            <button 
              @click="confirmFolderSelection" 
              class="dialog-btn confirm"
              :disabled="!selectedFolder"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { API_BASE_URL } from '@/config';
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

export default {
  setup() {
    const router = useRouter()
    
    // 状态
    const globalSwitch = ref(false);
    const wifiFileSyncFlag = ref(false);
    const isMobileServer = ref(false);
    const currentNetwork = ref('');
    const syncTasks = ref({});
    const serviceLoading = ref(false);
    const refreshInterval = ref(null);
    const showPassword = ref(false);
    
    // 任务对话框状态
    const dialogMode = ref('add'); // 'add' or 'edit'
    const currentTask = ref({
      name: '',
      localPath: '',
      remoteAddr: '',
      remotePath: '',
      remoteUsername: '',
      remotePassword: '',
      scanTime: '60'
    });

    const remotePassword = ref('');
    
    // 文件夹对话框状态
    const showFolderModal = ref(false);
    const showTaskDialogModel = ref(false);
    const currentFolderPath = ref('/');
    const folders = ref([]);
    const selectedFolder = ref(null);
    
    // 计算属性：验证任务表单
    const isTaskValid = computed(() => {
      const task = currentTask.value;
      return (
        task.name && /^[a-zA-Z0-9]{3,15}$/.test(task.name) &&
        task.localPath &&
        task.remoteAddr &&
        task.remotePath &&
        task.remoteUsername &&
        task.scanTime
      );
    });
    
    // 获取数据
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/file-sync`, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          credentials: 'include'
        });
        const data = await response.json();
        
        if (data.errCode === 0) {
          globalSwitch.value = data.globalSwitch;
          wifiFileSyncFlag.value = data.wifiFileSyncFlag;
          isMobileServer.value = data.isMobileServer;
          currentNetwork.value = data.currentNetwork;
          syncTasks.value = data.data || {};
        }
        
        if (data.errCode === 1000) {
          ElMessage.error('请先登录系统');
          router.push('/user-login?callback=file-sync-mgmt');
          return;
        } 
        
        if (data.errCode != 0) {
          ElMessage.error(data.errMsg)
          return
        } 
        
      } catch (error) {
        console.error('获取数据失败:', error);
      }
    };
    
    // 设置自动刷新
    const setupAutoRefresh = () => {
      // 清除已有定时器
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value);
      }
      // 每5秒刷新一次数据
      refreshInterval.value = setInterval(fetchData, 3000);
    };
    
    // 全局同步服务控制
    const startGlobalFileSync = async () => {
      serviceLoading.value = true;
      try {
        const response = await fetch(`${API_BASE_URL}/start-global-file-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          credentials: 'include'
        });
        const data = await response.json();
        if (data.errCode === 0) {
          fetchData();
        }
      } catch (error) {
        console.error('操作失败:', error);
      } finally {
        serviceLoading.value = false;
      }
    };
    
    const stopGlobalFileSync = async () => {
      serviceLoading.value = true;
      try {
        const response = await fetch(`${API_BASE_URL}/stop-global-file-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          credentials: 'include'
        });
        const data = await response.json();
        if (data.errCode === 0) {
          fetchData();
        }
      } catch (error) {
        console.error('操作失败:', error);
      } finally {
        serviceLoading.value = false;
      }
    };
    
    // WiFi同步服务控制
    const startWiFiFileSync = async () => {
      serviceLoading.value = true;
      try {
        const response = await fetch(`${API_BASE_URL}/start-wifi-file-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          credentials: 'include'
        });
        const data = await response.json();
        if (data.errCode === 0) {
          fetchData();
        }
      } catch (error) {
        console.error('操作失败:', error);
      } finally {
        serviceLoading.value = false;
      }
    };
    
    const stopWiFiFileSync = async () => {
      serviceLoading.value = true;
      try {
        const response = await fetch(`${API_BASE_URL}/stop-wifi-file-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          credentials: 'include'
        });
        const data = await response.json();
        if (data.errCode === 0) {
          fetchData();
        }
      } catch (error) {
        console.error('操作失败:', error);
      } finally {
        serviceLoading.value = false;
      }
    };
    
    // 任务对话框控制
    const showTaskDialog  = (mode, taskName = null, taskData = null) => {
      dialogMode.value = mode;
      remotePassword.value = ''
      
      if (mode === 'edit' && taskName && taskData) {
        currentTask.value = {
          name: taskName,
          localPath: taskData.LocalPath,
          remoteAddr: taskData.RemoteAddr,
          remotePath: taskData.RemotePath,
          remoteUsername: taskData.RemoteUsername,
          remotePassword: taskData.RemotePassword || '',
          scanTime: taskData.ScanTime.toString()
        };
      } else {
        resetCurrentTask();
      }
      
      showTaskDialogModel.value = true;
    };
    
    const closeTaskDialog = () => {
      showTaskDialogModel.value = false;
      resetCurrentTask();
    };
    
    const resetCurrentTask = () => {
      currentTask.value = {
        name: '',
        localPath: '',
        remoteAddr: '',
        remotePath: '',
        remoteUsername: '',
        remotePassword: '',
        scanTime: '60'
      };
    };
    
    // 同步任务管理
    const addFileSyncTask = async () => {
      if (!isTaskValid.value) return;
      
      try {
        const formData = new URLSearchParams();
        formData.append('name', currentTask.value.name);
        formData.append('localPath', currentTask.value.localPath);
        formData.append('remoteAddr', currentTask.value.remoteAddr);
        formData.append('remotePath', currentTask.value.remotePath);
        formData.append('remoteUsername', currentTask.value.remoteUsername);
        formData.append('remotePassword', remotePassword.value);
        formData.append('scanTime', currentTask.value.scanTime);
        
        const response = await fetch(`${API_BASE_URL}/add-file-sync-task`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData,
          credentials: 'include'
        });
        
        const data = await response.json();
        if (data.errCode === 0) {
          closeTaskDialog();
          fetchData();
        }
      } catch (error) {
        console.error('添加任务失败:', error);
      }
    };
    
    const updateFileSyncTask = async (taskName) => {
      if (!isTaskValid.value) return;
      
      try {
        const formData = new URLSearchParams();
        formData.append('name', taskName);
        formData.append('localPath', currentTask.value.localPath);
        formData.append('remoteAddr', currentTask.value.remoteAddr);
        formData.append('remotePath', currentTask.value.remotePath);
        formData.append('remoteUsername', currentTask.value.remoteUsername);
        formData.append('remotePassword', remotePassword.value);
        formData.append('scanTime', currentTask.value.scanTime);
        
        const response = await fetch(`${API_BASE_URL}/update-file-sync-task`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData,
          credentials: 'include'
        });
        
        const data = await response.json();
        if (data.errCode === 0) {
          closeTaskDialog();
          fetchData();
        }
      } catch (error) {
        console.error('更新任务失败:', error);
      }
    };
    
    const deleteFileSyncTask = async (taskName) => {
      try {
        const response = await fetch(`${API_BASE_URL}/delete-file-sync-task?name=${taskName}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        const data = await response.json();
        if (data.errCode === 0) {
          fetchData();
        }
      } catch (error) {
        console.error('删除任务失败:', error);
      }
    };
    
    const startFileSyncPer = async (taskName) => {
      try {
        const response = await fetch(`${API_BASE_URL}/start-file-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `name=${taskName}`,
          credentials: 'include'
        });
        const data = await response.json();
        if (data.errCode === 0) {
          fetchData();
        }
      } catch (error) {
        console.error('启动任务失败:', error);
      }
    };

    const stopFileSyncPer = async (taskName) => {
      try {
        const response = await fetch(`${API_BASE_URL}/stop-file-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `name=${taskName}`,
          credentials: 'include'
        });
        const data = await response.json();
        if (data.errCode === 0) {
          fetchData();
        }
      } catch (error) {
        console.error('停止任务失败:', error);
      }
    };
    
    // 文件夹选择相关方法
    const openFolderModal = () => {
      showFolderModal.value = true;
      currentFolderPath.value = '/';
      fetchFolders(currentFolderPath.value);
    };
    
    const closeFolderModal = () => {
      showFolderModal.value = false;
      selectedFolder.value = null;
    };
    
    const fetchFolders = async (path) => {
      try {
        const response = await fetch(`${API_BASE_URL}/get-dirList?path=${encodeURIComponent(path)}`, {
          credentials: 'include'
        });
        const data = await response.json();
        folders.value = data.file || [];
      } catch (error) {
        console.error('获取文件夹列表失败:', error);
        folders.value = [];
      }
    };
    
    const selectFolder = (folder) => {
      selectedFolder.value = folder;
    };
    
    const enterFolder = (folder) => {
      currentFolderPath.value = folder.Path;
      fetchFolders(currentFolderPath.value);
    };
    
    const goToParentFolder = () => {
      const parts = currentFolderPath.value.split('/');
      parts.pop();
      currentFolderPath.value = parts.join('/') || '/';
      fetchFolders(currentFolderPath.value);
    };
    
    const confirmFolderSelection = () => {
      if (!selectedFolder.value) {
        alert('请先选择文件夹');
        return;
      }
      
      currentTask.value.localPath = selectedFolder.value.Path;
      closeFolderModal();
    };
    
    const selectDir = () => {
      openFolderModal();
    };
    
    const getChannelName = (channel) => {
      switch (channel) {
        case 1: return 'webdav';
        case 2: return 'http';
        default: return 'none';
      }
    };
    
    // 生命周期钩子
    onMounted(() => {
      fetchData();
      setupAutoRefresh();
    });
    
    onUnmounted(() => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value);
      }
    });
    
    return {
      // 状态
      globalSwitch,
      wifiFileSyncFlag,
      isMobileServer,
      currentNetwork,
      syncTasks,
      serviceLoading,
      showTaskDialog,
      dialogMode,
      currentTask,
      remotePassword,
      isTaskValid,
      showFolderModal,
      showTaskDialogModel,
      currentFolderPath,
      folders,
      selectedFolder,
      showPassword,

      // 方法
      startGlobalFileSync,
      stopGlobalFileSync,
      startWiFiFileSync,
      stopWiFiFileSync,
      closeTaskDialog,
      addFileSyncTask,
      updateFileSyncTask,
      deleteFileSyncTask,
      startFileSyncPer,
      stopFileSyncPer,
      selectFolder,
      enterFolder,
      goToParentFolder,
      confirmFolderSelection,
      closeFolderModal,
      selectDir,
      getChannelName
    };
  }
};
</script>

<style scoped>
.file-sync-container {
  padding: 20px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* 服务卡片样式 */
.service-card {
  background: white;
  border-radius: 8px;
  padding: 15px 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.service-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.service-card h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.service-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.running {
  background: #e6f7e6;
  color: #4caf50;
}

.status-badge:not(.running) {
  background: #f0f0f0;
  color: #757575;
}

.service-controls button {
  padding: 6px 12px;
  background: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.service-controls button:hover {
  background: #e0e0e0;
}

/* 同步列表样式 */
.sync-list {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.list-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.list-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.add-btn {
  background: #f0f7ff;
  color: #1890ff;
  border: 1px dashed #91d5ff;
}

.add-btn:hover {
  background: #e6f7ff;
  border-color: #69c0ff;
}

.edit-btn {
  background: #f0f7ff;
  color: #1890ff;
  border: 1px solid #d9e9ff;
}

.edit-btn:hover {
  background: #e6f7ff;
}

.stop-btn {
  background: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}

.stop-btn:hover {
  background: #ffece8;
}

.delete-btn {
  background: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}

.delete-btn:hover {
  background: #ffece8;
}

.table-container {
  overflow-x: auto;
  border-radius: 6px;
  border: 1px solid #eee;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th, td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #fafafa;
  font-weight: 500;
  color: #555;
  white-space: nowrap;
}

.task-row {
  transition: background 0.2s;
}

.task-row:hover {
  background-color: #f9f9f9;
}

.sync-method, .status {
  font-size: 12px;
  color: #666;
}

.actions {
  display: flex;
  gap: 8px;
}

/* 任务对话框样式 */
.task-dialog {
  background: white;
  border-radius: 8px;
  width: 600px; /* 增加宽度 */
  max-width: 95%; /* 在大屏幕上不超过600px，小屏幕上占95%宽度 */
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.dialog-header {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fafafa;
  position: relative;
}

.dialog-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  flex-grow: 1;
  color: #333;
}

.close {
  color: #aaa;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  position: absolute;
  right: 16px;
  top: 10px;
}

.close:hover {
  color: #333;
}

.dialog-content {
  padding: 20px;
  overflow-y: auto;
  flex-grow: 1;
}

/* 表单组调整 */
.form-group {
  margin-bottom: 18px; /* 增加间距 */
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px; /* 稍大字体 */
  color: #555;
  font-weight: 500; /* 中等粗细 */
}

.form-group input {
  width: 100%;
  padding: 10px 12px; /* 增加内边距 */
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus {
  border-color: #1890ff;
  outline: none;
}

.path-input {
  display: flex;
  gap: 10px; /* 增加间距 */
}

.path-input input {
  flex-grow: 1;
  background-color: #f9f9f9; /* 只读背景色 */
}

.select-btn {
  padding: 10px 15px; /* 增加按钮内边距 */
  background: #f0f7ff;
  color: #1890ff;
  border: 1px solid #d9e9ff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  white-space: nowrap; /* 防止文字换行 */
}

.select-btn:hover {
  background: #e6f7ff;
  border-color: #69c0ff;
}

.dialog-actions {
  padding: 12px 16px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  background: #fafafa;
}

.dialog-btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  min-width: 80px;
  transition: all 0.2s;
}

.dialog-btn.cancel {
  background: white;
  border: 1px solid #d9d9d9;
  color: #333;
}

.dialog-btn.cancel:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.dialog-btn.confirm {
  background: #1890ff;
  color: white;
  border: none;
}

.dialog-btn.confirm:disabled {
  background: #bae0ff;
  cursor: not-allowed;
}

.dialog-btn.confirm:not(:disabled):hover {
  background: #40a9ff;
}

/* 文件夹选择对话框样式 */
.directory-dialog {
  background: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.directory-dialog .dialog-header {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fafafa;
  position: relative;
}

.nav-btn {
  padding: 4px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.nav-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.directory-tree ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.directory-entry {
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  transition: background 0.2s;
  border-bottom: 1px solid #f5f5f5;
  font-size: 13px;
}

.directory-entry:hover {
  background: #f5f5f5;
}

.directory-entry.selected {
  background: #e6f7ff;
}

.folder-icon {
  font-size: 16px;
  color: #ffc53d;
}

.directory-name {
  flex-grow: 1;
}

.enter-icon {
  color: #999;
  padding: 3px;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.2s;
  font-size: 14px;
}

.directory-entry:hover .enter-icon {
  opacity: 1;
}

.enter-icon:hover {
  background: #e6f7ff;
  color: #1890ff;
}

.empty-directory {
  text-align: center;
  color: #999;
  padding: 30px 20px;
  font-size: 13px;
}

.selected-path {
  font-size: 12px;
  color: #666;
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 10px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

/* 对话框遮罩 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* 密码输入框样式 */
.password-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.password-input input {
  width: 200px; /* 固定宽度 */
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

.toggle-password {
  padding: 8px 12px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.toggle-password:hover {
  background: #eaeaea;
}

.password-hint {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

</style>