<template>
  <div class="file-management">
    <!-- 服务控制卡片 - 合并到一行 -->
    <div class="services-row">
      <!-- Web文件服务 -->
      <div class="service-card">
        <h3>Web文件服务</h3>
        <div class="service-controls">
          <span class="status-badge" :class="{ 'running': fileSwitch }">
            {{ fileSwitch ? '运行中' : '已停止' }}
          </span>
          <button 
            @click="toggleWebService"
            :disabled="webServiceLoading"
          >
            <span v-if="webServiceLoading">处理中...</span>
            <span v-else>{{ fileSwitch ? '停止' : '启动' }}</span>
          </button>
        </div>
      </div>

      <!-- WebDAV文件服务 -->
      <div class="service-card">
        <h3>WebDAV文件服务(/tfdav)</h3>
        <div class="service-controls">
          <span class="status-badge" :class="{ 'running': webdavSwitch }">
            {{ webdavSwitch ? '运行中' : '已停止' }}
          </span>
          <button 
            @click="toggleWebDAVService"
            :disabled="webdavServiceLoading"
          >
            <span v-if="webdavServiceLoading">处理中...</span>
            <span v-else>{{ webdavSwitch ? '停止' : '启动' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 目录列表 -->
    <div class="directory-list">
      <div class="list-header">
        <h3>目录列表(用户通过<a href="/user-mgmt" class="user-link">用户管理</a>创建)</h3>
        <div>
          <button @click="fetchData" class="refresh-btn">刷新数据</button>
        </div>
      </div>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th width="15%">用户名</th>
              <th width="10%">状态</th>
              <th width="25%">目录</th>
              <th width="10%">只读</th>
              <th width="10%">删除</th>
              <th width="15%">空间</th>
              <th width="15%">操作</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(item, index) in userList" :key="index">
              <!-- 用户行 -->
              <tr class="user-row">
                <td>{{ item.username }}</td>
                <td>
                  <span class="status-badge" :class="{ 'active': item.localFileSwitch }">
                    {{ item.localFileSwitch ? '激活' : '未激活' }}
                  </span>
                </td>
                <td colspan="4">
                  <button class="add-directory-btn" @click="openDirectoryDialog(item)">+ 添加目录</button>
                </td>
                <td class="actions">
                 <button class="action-btn save-btn" @click="saveUserConfig(item)">保存</button>
                  <button 
                    v-if="item.localFileSwitch"
                    @click="stopUserService(item)"
                    class="action-btn deactivate"
                  >
                    停用
                  </button>
                  <button 
                    v-else
                    @click="saveUserConfig(item)"
                    class="action-btn activate"
                  >
                    启用
                  </button>
                </td>
              </tr>
              <!-- 每个目录的行 -->
              <tr v-for="(dir, dirIndex) in item.localDir" :key="dirIndex" class="directory-row">
                <td></td>
                <td></td>
                <td>
                  <div class="directory-item">
                    <span>{{ dir.dir }}</span>
                    <button @click="removeDirectory(item, dirIndex)" class="remove-btn">×</button>
                  </div>
                </td>
                <td>
                  <select v-model="dir.readOnly" class="select-dropdown">
                    <option :value="true">是</option>
                    <option :value="false">否</option>
                  </select>
                </td>
                <td>
                  <select v-model="dir.noDelete" class="select-dropdown">
                    <option :value="true">禁止</option>
                    <option :value="false">允许</option>
                  </select>
                </td>
                <td>
                  <span class="quota" :class="{ 'pending-text': dir.usage === '请点击保存后生效' }">
                    {{ dir.usage || 'used:0G(total:0G)' }}
                  </span>
                </td>
                <td></td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 目录选择对话框 -->
    <div v-if="showDirectoryDialog" class="dialog-overlay">
      <div class="directory-dialog">
        <div class="dialog-header">
          <button 
            v-if="currentPathInfo.notTopDir" 
            @click="goToPrevDirectory" 
            class="nav-btn prev-btn"
          >
            ↑ 上一级
          </button>
          <h3>当前路径: {{ currentPathInfo.currentPath || '/' }}</h3>
        </div>
        <div class="dialog-content">
          <div v-if="loadingDirectories" class="loading-indicator">
            加载中...
          </div>
          <div v-else class="directory-tree">
            <ul v-if="directories.length > 0">
              <li 
                v-for="dir in directories" 
                :key="dir.Path"
                @click="selectDirectory(dir)"
                @dblclick="enterDirectory(dir)"
                class="directory-entry"
                :class="{ 'selected': selectedDirectory === dir.Path }"
              >
                <span class="folder-icon">📁</span>
                <span class="directory-name">{{ dir.Name }}</span>
                <span class="enter-icon" @click.stop="enterDirectory(dir)">→</span>
              </li>
            </ul>
            <div v-else class="empty-directory">
              当前目录为空
            </div>
          </div>
        </div>
        <div class="dialog-actions">
          <div class="selected-path" v-if="selectedDirectory">
            已选择: {{ selectedDirectory }}
          </div>
          <div class="action-buttons">
            <button @click="cancelDirectorySelection" class="dialog-btn cancel">取消</button>
            <button 
              @click="confirmDirectorySelection" 
              class="dialog-btn confirm"
              :disabled="!selectedDirectory"
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
import { API_BASE_URL } from '@/config';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router'


const router = useRouter()

export default {
  name: 'FileManagement',
  data() {
    return {
      fileSwitch: false,
      webdavSwitch: false,
      webServiceLoading: false,
      webdavServiceLoading: false,

      showDirectoryDialog: false,
      loadingDirectories: false,
      currentEditingItem: null,
      selectedDirectory: '',
      directories: [],
      currentPathInfo: {
        currentPath: '/',
        prevPath: '',
        notTopDir: false
      },
      userList: []
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        const response = await fetch(`${API_BASE_URL}/list-fileMgmtUser`,
          {
            method: 'GET',
            credentials: 'include'
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.errMsg || '获取数据失败');
        }

        if (data.errCode === 1000) {
          ElMessage.error('请先登录系统');
          this.$router.push('/user-login?callback=file-setting');
          return;
        }

        if (data.errCode != 0) {
          ElMessage.error(data.errMsg)
          return
        }

        if (data.errCode === 0) {
          this.fileSwitch = data.fileSwitch;
          this.webdavSwitch = data.webdavSwitch;
          this.userList = data.user.map(user => ({
            ...user,
            active: true,
            localDir: user.localDir || [] // 确保 localDir 存在
          }));
        } else {
          throw new Error(data.errMsg || '获取数据失败');
        }
      } catch (error) {
        console.error('获取数据出错:', error);
        ElMessage.error(error.message);
      }
    },
    async toggleWebService() {
      this.webServiceLoading = true;
      try {
        const url = this.fileSwitch 
          ? `${API_BASE_URL}/stop-localFile`
          : `${API_BASE_URL}/start-localFile`;
        
        const response = await fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.errMsg || '操作失败');
        }

        if (data.errCode === 1000) {
          ElMessage.error('请先登录系统');
          return;
        }

        if (data.errCode === 0) {
          this.fileSwitch = !this.fileSwitch;
          ElMessage.success(`Web服务已${this.fileSwitch ? '启动' : '停止'}`);
          this.fetchData(); // 刷新整体数据
        } else {
          throw new Error(data.errMsg || '操作失败');
        }
      } catch (error) {
        console.error('操作Web服务出错:', error);
        ElMessage.error(`操作失败: ${error.message}`);
      } finally {
        this.webServiceLoading = false;
      }
    },

    async toggleWebDAVService() {
      this.webdavServiceLoading = true;
      try {
        const url = this.webdavSwitch
          ? `${API_BASE_URL}/stop-tfdav`
          : `${API_BASE_URL}/start-tfdav`;
        
        const response = await fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.errMsg || '操作失败');
        }

        if (data.errCode === 1000) {
          ElMessage.error('请先登录系统');
          return;
        }

        if (data.errCode === 0) {
          this.webdavSwitch = !this.webdavSwitch;
          ElMessage.success(`WebDAV服务已${this.webdavSwitch ? '启动' : '停止'}`);
          this.fetchData(); // 刷新整体数据
        } else {
          throw new Error(data.errMsg || '操作失败');
        }
      } catch (error) {
        console.error('操作WebDAV服务出错:', error);
        ElMessage.error(`操作失败: ${error.message}`);
      } finally {
        this.webdavServiceLoading = false;
      }
    },
    async stopUserService(item) {
      try {
        const formData = new URLSearchParams();
        formData.append('username', item.username);

        const response = await fetch(`${API_BASE_URL}/stop-fileMgmtUser`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.errMsg || '停用用户失败');
        }

        if (data.errCode === 1000) {
          ElMessage.error('请先登录系统');
          router.push('/user-login?callback=file-setting');
          return;
        } 

        if (data.errCode !== 0) {
          ElMessage.error(data.errMsg);
          return;
        } 

        if (data.errCode === 0) {
          item.active = false;
          ElMessage.success(`用户 ${item.username} 已停用`);
          this.fetchData(); // 刷新整体数据
        } else {
          throw new Error(data.errMsg || '停用用户失败');
        }
      } catch (error) {
        console.error('停用用户出错:', error);
        ElMessage.error(`停用失败: ${error.message}`);
      }
    },
    async saveUserConfig(item) {
      try {
        // 准备dirAttr参数
        // 检查是否有目录
        if (!item.localDir || item.localDir.length === 0) {
          ElMessage.warning('请先添加至少一个目录');
          return;
        }
        
        const dirAttr = item.localDir.map(dir => ({
          dirContent: dir.dir,
          readOnlyStr: dir.readOnly ? "yes" : "no",
          noDeleteStr: dir.noDelete ? "yes" : "no"
        }));

        // 准备表单数据
        const formData = new URLSearchParams();
        formData.append('username', item.username);
        formData.append('dirAttr', JSON.stringify(dirAttr));

        // 发送保存请求
        const response = await fetch(`${API_BASE_URL}/update-fileMgmtUser`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.errMsg || '保存失败');
        }

        if (data.errCode === 1000) {
          ElMessage.error('请先登录系统');
          return;
        }

        if (data.errCode === 0) {
          ElMessage.success('配置保存成功');
          this.fetchData(); // 刷新数据
        } else {
          throw new Error(data.errMsg || '保存失败');
        }
      } catch (error) {
        console.error('保存配置出错:', error);
        ElMessage.error(`保存失败: ${error.message}`);
      }
    },
    async openDirectoryDialog(item) {
      this.currentEditingItem = item;
      this.selectedDirectory = '';
      this.showDirectoryDialog = true;
      this.currentPathInfo = {
        currentPath: '/',
        prevPath: '',
        notTopDir: false
      };
      await this.fetchDirectories('/');
    },
    removeDirectory(item, index) {
      const removedPath = item.localDir[index].dir;
      item.localDir.splice(index, 1);
      ElMessage.success(`目录 ${removedPath} 已移除，请点击保存后生效`);
    },
    async fetchDirectories(path) {
      this.loadingDirectories = true;
      try {
        const response = await fetch(`${API_BASE_URL}/get-dirList?path=${encodeURIComponent(path)}`,
          {
            method: 'GET',
            credentials: 'include'
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.errMsg || '获取目录列表失败');
        }

        if (data.errCode === 1000) {
          ElMessage.error('请先登录系统');
          this.showDirectoryDialog = false;
          return;
        }

        if (data.errCode === 0) {
          this.directories = data.file || [];
          this.currentPathInfo = {
            currentPath: path,
            prevPath: data.prevPath,
            notTopDir: data.notTopDir
          };
        } else {
          throw new Error(data.errMsg || '获取目录列表失败');
        }
      } catch (error) {
        console.error('获取目录列表出错:', error);
        ElMessage.error(error.message);
        this.directories = [];
      } finally {
        this.loadingDirectories = false;
      }
    },
    async goToPrevDirectory() {
      if (this.currentPathInfo.notTopDir && this.currentPathInfo.prevPath) {
        await this.fetchDirectories(this.currentPathInfo.prevPath);
        this.selectedDirectory = '';
      }
    },
    selectDirectory(dir) {
      this.selectedDirectory = dir.Path;
    },
    enterDirectory(dir) {
      this.fetchDirectories(dir.Path);
      this.selectedDirectory = '';
    },
    confirmDirectorySelection() {
      if (this.currentEditingItem) {
        // 确保 localDir 数组存在
        if (!this.currentEditingItem.localDir) {
          this.currentEditingItem.localDir = [];
        }
        
        // 检查是否已选择目录
        if (!this.selectedDirectory) {
          ElMessage.warning('请先选择目录');
          return;
        }

        // 检查是否已存在相同路径
        const exists = this.currentEditingItem.localDir.some(
          d => d.dir === this.selectedDirectory
        );
        
        if (!exists) {
          this.currentEditingItem.localDir.push({
            dir: this.selectedDirectory,
            fileName: this.selectedDirectory,
            readOnly: false,
            noDelete: false,
            usage: '请点击保存后生效'
          });
          ElMessage.success(`目录 ${this.selectedDirectory} 已添加`);
        } else {
          ElMessage.warning('该目录已存在');
        }
      }
      this.showDirectoryDialog = false;
    },
    cancelDirectorySelection() {
      this.showDirectoryDialog = false;
    }
  }
};
</script>

<style scoped>

.file-management {
  padding: 20px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.user-link {
  text-decoration: none;
  color: #000000;
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: 1px;
  transition: color 0.3s;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
}

.user-link:hover {
  color: #337ecc;
  text-decoration: none;
}

.services-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.service-card {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 15px 20px;
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
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.status-badge.running,
.status-badge.active {
  background: #e6f7e6;
  color: #4caf50;
}

.status-badge:not(.running):not(.active) {
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

.directory-list {
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

.refresh-btn, .add-user {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.refresh-btn {
  background: #f0f0f0;
  color: #333;
}

.refresh-btn:hover {
  background: #e0e0e0;
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

/* 间距调整 */
th, td {
  padding: 4px 8px; 
  text-align: left;
  border-bottom: 1px solid #eee;
  line-height: 1.3;
}

th {
  background-color: #fafafa;
  font-weight: 500;
  color: #555;
  white-space: nowrap;
}

.user-row {
  height: 30px;
}

.directory-row {
  background-color: #f9f9f9;
  height: 28px;
}

.directory-row:hover {
  background-color: #f0f0f0;
}

.directory-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 24px;
}

.remove-btn {
  background: none;
  border: none;
  color: #ff4d4f;
  cursor: pointer;
  font-size: 14px;
  padding: 0 3px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.remove-btn:hover {
  opacity: 1;
}

.add-directory-btn {
  padding: 4px 8px;
  background: #f0f7ff;
  color: #1890ff;
  border: 1px dashed #91d5ff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.add-directory-btn:hover {
  background: #e6f7ff;
  border-color: #69c0ff;
}

.select-dropdown {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  font-size: 12px;
  width: 100%;
  outline: none;
}

.select-dropdown:focus {
  border-color: #1890ff;
}

.quota {
  font-size: 11px;
  color: #666;
}

/* 待生效文本的特殊样式 */
.pending-text {
  color: #ff0000; /* 红色 */
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.save-btn {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.save-btn:hover {
  background: #e6f7d7;
}

.status-btn.deactivate {
  background: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}

.status-btn.activate {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.status-btn:hover {
  opacity: 0.9;
}

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

.dialog-header {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fafafa;
}

.dialog-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  flex-grow: 1;
  color: #333;
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

.dialog-content {
  padding: 0;
  overflow-y: auto;
  flex-grow: 1;
}

.loading-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  color: #999;
  font-size: 13px;
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

.dialog-actions {
  padding: 12px 16px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafafa;
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

.dialog-btn {
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  min-width: 70px;
  border: none;
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
}

.dialog-btn.confirm:disabled {
  background: #bae0ff;
  cursor: not-allowed;
}

.dialog-btn.confirm:not(:disabled):hover {
  background: #40a9ff;
}

</style>