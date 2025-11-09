<template>
  <div class="file-manager-container" @click="handleContainerClick" @contextmenu.prevent="handleBackgroundRightClick">
      <!-- 顶部工具栏 -->
      <div class="toolbar">      
        <div class="toolbar-group">
          <button @click="createFile" :disabled="topDir"  title="新建文件">
            <i class="icon">📄</i>
            <span>新建文件</span>
          </button>
          <button @click="createFolder" :disabled="topDir" title="新建文件夹">
            <i class="icon">📁</i>
            <span>新建文件夹</span>
          </button>
        </div>
        
        <div class="toolbar-group">
          <button @click="renameItem" :disabled="topDir || !selectedItem " title="重命名">
            <i class="icon">✏️</i>
          </button>
          <button @click="deleteItem" :disabled="topDir || !selectedItem" title="删除">
            <i class="icon">🗑️</i>
          </button>
          <button @click="cutItem" :disabled="topDir || !selectedItem" title="剪切">
            <i class="icon">✂️</i>
          </button>
          <button @click="copyItem" :disabled="topDir || !selectedItem" title="复制">
            <i class="icon">📰</i>
          </button>
          <button @click="pasteItem" :disabled="topDir || !clipboardItem" title="粘贴">
            <i class="icon">📋</i>
          </button>
          <button @click="collectItem" :disabled="!selectedItem" title="收藏">
            <i class="icon">⭐</i>
          </button>
          <button @click="shareItem" :disabled="!selectedItem" title="分享">
            <i class="icon">↗️</i>
          </button>
        </div>
        
        <div class="toolbar-group">
          <button @click="downloadItem" :disabled="!selectedItem" title="下载">
            <i class="icon">⤓</i>
            <span>下载</span>
          </button>
          <!-- 上传按钮 -->
          <button @click="triggerFileUpload" :disabled="topDir" title="上传文件">
            <i class="icon">⤴</i>
            <span>上传</span>
          </button>
          <button @click="triggerFolderUpload" :disabled="topDir" title="上传文件夹">
            <i class="icon">⤴📁</i>
          </button>
          <input 
            type="file" 
            ref="fileInput" 
            @change="handleFileUpload" 
            style="display: none" 
            multiple 
          />
          <input 
            type="file" 
            ref="folderInput" 
            @change="handleFolderUpload" 
            style="display: none" 
            webkitdirectory
            directory
            multiple
          />
      </div>


      <!-- 在工具栏中添加搜索框 -->
      <div class="toolbar-group search-group">
        <el-input
          v-model="searchKeyword"
          placeholder="输入搜索关键词"
          clearable
          @keyup.enter="performSearch"
          @clear="cancelSearch"
        >
          <template #append>
            <el-button @click="performSearch" :loading="isSearching">
              <i class="icon">🔍</i>
            </el-button>
          </template>
        </el-input>
        
        <el-button 
          v-if="isSearchMode"
          @click="cancelSearch"
          type="danger"
          plain
          size="small"
        >
          取消搜索
        </el-button>
      </div>

      <!-- 在文件列表上方添加搜索状态提示 -->
      <div v-if="isSearchMode" class="search-status">
        <el-alert
          :title="searchStatusText"
          :type="searchComplete ? 'success' : 'warning'"
          :closable="false"
          show-icon
        />
      </div>
    </div>

    <!-- 上传列表对话框 -->
    <el-dialog
      v-model="showUploadList"
      title="文件上传列表"
      width="60%"
      :close-on-click-modal="false"
      :before-close="handleBeforeClose"
    >
      <div class="upload-list-container">
        <div v-for="(item, index) in uploadList" :key="item.id" class="upload-item">
          <div class="file-info">
            <span class="file-icon">{{ getFileIcon(item) }}</span>
            <div class="file-details">
              <div class="file-name">{{ item.file.name }}</div>
              <div class="file-path" v-if="item.folderPath">{{ item.folderPath }}</div>
              <div class="file-size">{{ formatSize(item.file.size) }}</div>
            </div>
          </div>
          <div class="upload-progress">
            <el-progress 
              :percentage="item.progress" 
              :status="getProgressStatus(item)"
              :stroke-width="12"
            />
            <div class="upload-speed" v-if="item.speed > 0 && !item.completed && !item.error">
                {{ formatSpeed(item.speed) }} - {{ formatTime(item.remainingTime) }}
            </div>
            <div class="upload-error" v-if="item.error">
                {{ item.errorMessage }}
            </div>
          </div>
          <div class="upload-actions">
            <el-button 
              v-if="!item.completed && !item.error"
              @click="cancelUpload(index)"
              size="small"
              type="danger"
              plain
            >
              取消
            </el-button>
            <el-tag v-if="item.completed" type="success">完成</el-tag>
            <el-tag v-if="item.error" type="danger">失败</el-tag>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="closeUploadList">关闭</el-button>
      </template>
    </el-dialog>

     <!-- 新增分享对话框 -->
    <el-dialog
      v-model="showShareDialog"
      title="分享文件"
      width="500px"
    >
      <el-form :model="shareForm" label-width="120px">
        <el-form-item label="文件名称">
          <el-input v-model="shareForm.fileName" disabled />
        </el-form-item>
        <el-form-item label="有效期" required>
          <el-radio-group v-model="shareForm.validType">
            <el-radio :label="0">长期有效</el-radio>
            <el-radio :label="1">自定义</el-radio>
          </el-radio-group>
          <el-input-number
            v-if="shareForm.validType === 1"
            v-model="shareForm.validDays"
            :min="1"
            :max="365"
            controls-position="right"
            style="margin-top: 8px;"
            placeholder="输入有效期天数"
          />
        </el-form-item>
        <el-form-item label="下载密码">
          <el-input
            v-model="shareForm.password"
            placeholder="留空表示无密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="允许上传" v-if="shareForm.isDir">
          <el-switch
            v-model="shareForm.allowUpload"
            active-text="允许"
            inactive-text="禁止"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showShareDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmShare">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 面包屑导航 -->
    <div class="breadcrumb-bar">
      <div class="breadcrumb-items">
        <span 
          v-for="(part, index) in breadcrumbParts" 
          :key="index"
          class="breadcrumb-item"
          :class="{ 'clickable': index < breadcrumbParts.length - 1 }"
          @click="navigateToBreadcrumb(index)"
        >
          <span class="breadcrumb-icon" v-if="index === 0">🖥️</span>
          <span class="breadcrumb-icon" v-else-if="index < breadcrumbParts.length - 1">📁</span>
          <span class="breadcrumb-icon" v-else>📂</span>
          <span class="breadcrumb-text">{{ part.name }}</span>
          <span class="breadcrumb-separator" v-if="index < breadcrumbParts.length - 1">›</span>
        </span>
      </div>
      <div class="breadcrumb-actions">
        <button class="refresh-button" @click="refreshCurrentPath" title="刷新">
          <i class="icon">🔄</i>
        </button>
      </div>
    </div>
    
    <!-- 文件列表表头 -->
    <div class="file-list-header">
      <div class="header-name" @click="sortBy('Name')">
        名称
        <span v-if="sortField === 'Name'" class="sort-indicator">
          {{ sortOrder === 'asc' ? '↑' : '↓' }}
        </span>
      </div>
      <div class="header-size" @click="sortBy('RealSize')">
        大小
        <span v-if="sortField === 'RealSize'" class="sort-indicator">
          {{ sortOrder === 'asc' ? '↑' : '↓' }}
        </span>
      </div>
      <div class="header-type" @click="sortBy('IsDir')">
        类型
        <span v-if="sortField === 'IsDir'" class="sort-indicator">
          {{ sortOrder === 'asc' ? '↑' : '↓' }}
        </span>
      </div>
      <div class="header-modified" @click="sortBy('ModTime')">
        修改日期
        <span v-if="sortField === 'ModTime'" class="sort-indicator">
          {{ sortOrder === 'asc' ? '↑' : '↓' }}
        </span>
      </div>
      <div class="header-path">
        路径
      </div>
    </div>
    
    <!-- 文件列表 -->
    <div class="file-list">
      <div 
          v-for="item in sortedFileList" 
          :key="item.Path"
          class="file-item"
          :class="{ 'selected': selectedItem === item, 'folder': item.IsDir }"
          @click="selectItem(item)"
          @dblclick="handleItemDblClick(item)"
          @contextmenu.prevent="handleItemRightClick($event, item)"
        >
        <div class="item-name">
          <span class="file-icon">{{ getFileIcon(item) }}</span>
          {{ item.Name }}
        </div>
        <div class="item-size">{{ formatSize(item.RealSize) }}</div>
        <div class="item-type">{{ getFileType(item) }}</div>
        <div class="item-modified">{{ formatDate(item.ModTime) }}</div>
        <div class="item-path">{{ item.Path }}</div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <ContextMenu
      v-if="contextMenu.visible"
      :visible="contextMenu.visible"
      :position="contextMenu.position"
      :menu-items="contextMenu.items"
      :selected-item="selectedItem"
      @command="handleContextMenuCommand"
      @close="closeContextMenu"
    />
    
    <!-- 状态栏 -->
    <div class="status-bar">
      <div class="status-item">
        {{ fileList.length }} 个项目
      </div>
      <div class="status-item" v-if="selectedItem">
        选中: {{ selectedItem.Name }} ({{ formatSize(selectedItem.RealSize) }})
      </div>
      <div class="status-item" v-if="selectedItem">
        路径: {{ selectedItem.Path }}
      </div>
    </div>
    
    <CreateDialog 
      v-if="showCreateDialog"
      :isFile="isCreatingFile"
      @confirm="confirmCreate"
      @cancel="cancelCreate"
    />
  </div>

  <!-- 新增图片预览对话框 -->
  <el-dialog
    v-model="showImagePreview"
    :title="previewImageName"
    width="80%"
    top="5vh"
    :close-on-click-modal="true"
    :append-to-body="true"
  >
    <div class="image-preview-container">
      <el-image
        :src="previewImageUrl"
        :preview-src-list="[previewImageUrl]"
        fit="contain"
        style="width: 100%"
      >
        <template #error>
          <div class="image-error">
            <i class="el-icon-picture-outline"></i>
            <span>图片加载失败</span>
          </div>
        </template>
        <template #placeholder>
          <div class="image-loading">
            <i class="el-icon-loading"></i>
            <span>图片加载中...</span>
          </div>
        </template>
      </el-image>
    </div>
    <template #footer>
      <el-button @click="downloadCurrentImage" type="primary">下载</el-button>
      <el-button @click="showImagePreview = false">关闭</el-button>
    </template>
  </el-dialog>
  
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { API_BASE_URL } from '@/config';
import { HOME_BASE_URL } from "@/config";
import CreateDialog from './CreateDialog.vue';
import ContextMenu from './ContextMenu.vue'; // 确保路径正确

import { useRouter } from 'vue-router'


export default {
  components: {
    CreateDialog,
    ContextMenu
  },
  setup() {
    const router = useRouter()

    // 当前路径和文件列表
    const currentPath = ref('');
    const fileList = ref([]);
    const topDir   = ref(true);

    // 获取路径上的Path
    const queryString = window.location.search; 
    const urlParams = new URLSearchParams(queryString); 
    const pathValue = urlParams.get('path'); 
    if (pathValue != null) {  
      currentPath.value = pathValue
    } 

    // 搜索相关状态
    const searchKeyword = ref('');
    const isSearching = ref(false);
    const isSearchMode = ref(false);
    const searchComplete = ref(true);
    const searchResultCount = ref(0);
    const originalFileList = ref([]);
    
    // 导航历史
    const navHistory = reactive([]);
    const navHistoryIndex = ref(-1);
    
    // 选中的文件和剪贴板
    const selectedItem = ref(null);
    const clipboardItem = ref(null);

    const rightClickSource = ref(null); // 'item' 或 'background'
    
    // 对话框状态
    const showCreateDialog = ref(false);
    const isCreatingFile = ref(false);
    
    // 文件上传引用
    const fileInput = ref(null);
    const folderInput = ref(null);
    const showUploadList = ref(false);
    const uploadList = ref([]);
    let uploadControllers = []; // 用于存储AbortController
    
    // 排序相关
    const sortField = ref('IsDir');
    const sortOrder = ref('asc');

    // 添加剪切状态
    const isCutOperation = ref(false);
    
    // 计算属性
    const canGoBack = computed(() => navHistoryIndex.value > 0);
    const canGoForward = computed(() => navHistoryIndex.value < navHistory.length - 1);
    const canGoUp = computed(() => currentPath.value !== '/');
    
    // 面包屑导航部分
    const breadcrumbParts = computed(() => {
      if (currentPath.value === '/') return [{ name: '根目录', path: '/' }];
      
      const parts = currentPath.value.split('/').filter(p => p);
      const result = [{ name: '根目录', path: '/' }];
      
      let currentPathAcc = '';
      for (const part of parts) {
        currentPathAcc += `/${part}`;
        result.push({
          name: part,
          path: currentPathAcc
        });
      }
      
      return result;
    });
    
    // 排序后的文件列表
    const sortedFileList = computed(() => {
      return [...fileList.value].sort((a, b) => {
        let fieldA, fieldB;
        
        // 特殊处理文件夹排序
        if (sortField.value === 'IsDir') {
          if (a.IsDir === b.IsDir) return 0;
          return sortOrder.value === 'asc' 
            ? (a.IsDir ? -1 : 1)
            : (a.IsDir ? 1 : -1);
        }
        
        fieldA = a[sortField.value];
        fieldB = b[sortField.value];
        
        // 处理大小写不敏感的字符串比较
        if (typeof fieldA === 'string') {
          fieldA = fieldA.toLowerCase();
          fieldB = fieldB.toLowerCase();
        }
        
        if (fieldA < fieldB) return sortOrder.value === 'asc' ? -1 : 1;
        if (fieldA > fieldB) return sortOrder.value === 'asc' ? 1 : -1;
        return 0;
      });
    });
    
    // 方法
    const fetchFileList = async (path) => {
      try {
        const response = await fetch(`${API_BASE_URL}/get-fileList?path=${encodeURIComponent(path)}`,
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
          router.push('/user-login?callback=file-list');
          return;
        } 

        if (data.errCode !== 0) {
          ElMessage.error(data.errMsg);
          return;
        } 

        fileList.value = data.file || [];
        topDir.value = !data.notTopDir;
        if (!data.isPermission) {
          currentPath.value = '';
        }
        
        // 添加到导航历史
        if (navHistory[navHistoryIndex.value] !== path) {
          navHistory.splice(navHistoryIndex.value + 1);
          navHistory.push(path);
          navHistoryIndex.value = navHistory.length - 1;
        }
      } catch (error) {
        ElMessage.error(error.message);
      }
    };
    
    const navigateTo = (path) => {
      // 取消选择
      selectedItem.value = null;
      currentPath.value = path;
      fetchFileList(path);
    };
    
    const navigateToBreadcrumb = (index) => {
      if (index < breadcrumbParts.value.length - 1) {
        navigateTo(breadcrumbParts.value[index].path);
      }
    };
    
    const refreshCurrentPath = () => {
      fetchFileList(currentPath.value);
      ElMessage.success("刷新成功")
    };
    
    const goBack = () => {
      if (canGoBack.value) {
        navHistoryIndex.value--;
        currentPath.value = navHistory[navHistoryIndex.value];
        fetchFileList(currentPath.value);
      }
    };
    
    const goForward = () => {
      if (canGoForward.value) {
        navHistoryIndex.value++;
        currentPath.value = navHistory[navHistoryIndex.value];
        fetchFileList(currentPath.value);
      }
    };
    
    const goUp = () => {
      if (currentPath.value === '/') return;
      
      const parts = currentPath.value.split('/').filter(p => p);
      parts.pop();
      const newPath = parts.length ? '/' + parts.join('/') : '/';
      navigateTo(newPath);
    };
    
    const selectItem = (item) => {
      selectedItem.value = item;
    };
    
    // 新增图片预览相关状态
    const showImagePreview = ref(false);
    const previewImageUrl = ref('');
    const previewImageName = ref('');

    // 新增图片预览方法
    const previewImage = (item) => {
      previewImageUrl.value = `${API_BASE_URL}/download-file?path=${encodeURIComponent(item.Path)}`;
      previewImageName.value = item.Name;
      showImagePreview.value = true;
    };
    
    // 新增下载当前预览图片方法
    const downloadCurrentImage = () => {
      if (previewImageUrl.value) {
        const link = document.createElement('a');
        link.href = previewImageUrl.value.replace('/preview-image', '/download-file');
        link.download = previewImageName.value;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };

    const handleItemDblClick = (item) => {
      if (item.IsDir) {
        navigateTo(item.Path);
      } else {
        ElMessage.info(`正在打开文件: ${item.Name}`);
        const link = document.createElement('a');

        if (item.IsTxt) {
          link.href = `${HOME_BASE_URL}/open-text/${encodeURIComponent(item.Name)}?path=${encodeURIComponent(item.Path)}`;
        } else if (item.IsPic) {
          // 如果是图片，显示预览弹窗
          previewImage(item);
        } else {
          link.href = `${API_BASE_URL}/open-file/${encodeURIComponent(item.Name)}?path=${encodeURIComponent(item.Path)}`;
        }
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        // 如果是下载文件而非查看
        // link.download = item.Name; 
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
    
    // 排序方法
    const sortBy = (field) => {
      if (sortField.value === field) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
      } else {
        sortField.value = field;
        sortOrder.value = 'asc';
      }
    };
    
    // 文件图标和类型方法
    const getFileIcon = (file) => {
      if (file.IsDir) return '📁';
      if (file.IsPic) return '🖼️';
      if (file.IsWord) return '📝';
      if (file.IsExcel) return '📊';
      if (file.IsPpt) return '📑';
      if (file.IsPdf) return '📘';
      if (file.IsTxt) return '📄';
      if (file.IsRar) return '🗜️';
      if (file.IsVideo) return '🎬';
      if (file.IsMusic) return '🎵';
      return '📄';
    };
    
    const getFileType = (file) => {
      if (file.IsDir) return '文件夹';
      if (file.IsPic) return '图片';
      if (file.IsWord) return 'Word文档';
      if (file.IsExcel) return 'Excel文档';
      if (file.IsPpt) return 'PPT文档';
      if (file.IsPdf) return 'PDF文档';
      if (file.IsTxt) return '文本文件';
      if (file.IsRar) return '压缩文件';
      if (file.IsVideo) return '视频文件';
      if (file.IsMusic) return '音频文件';
      return '文件';
    };
    
    const formatDate = (dateStr) => {
      return dateStr; // 实际应用中可以进行更友好的格式化
    };
    
    const formatSize = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    // 文件操作方法
    const createFile = () => {
      isCreatingFile.value = true;
      showCreateDialog.value = true;
    };
    
    const createFolder = () => {
      isCreatingFile.value = false;
      showCreateDialog.value = true;
    };
    
    const confirmCreate = async (name) => {
      try {
        const url = isCreatingFile.value 
          ? `${API_BASE_URL}/create-file` 
          : `${API_BASE_URL}/create-folder`;


        const params = new URLSearchParams();
        params.append('currentPath', currentPath.value);
        params.append('path', currentPath.value + '/' + name);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.errMsg || (isCreatingFile.value ? '创建文件失败' : '创建文件夹失败'));
        }

        if (data.errCode === 1000) {
          ElMessage.error('请先登录系统');
          return;
        }

        if (data.errCode !== 0) {
          ElMessage.error(data.errMsg);
          return;
        }

        ElMessage.success(isCreatingFile.value ? '文件创建成功' : '文件夹创建成功');
        fetchFileList(currentPath.value);
        showCreateDialog.value = false;
      } catch (error) {
        ElMessage.error(error.message);
      }
    };
    
    const cancelCreate = () => {
      showCreateDialog.value = false;
    };
    
    const renameItem = () => {
      if (!selectedItem.value) return;
      
      // 保存当前选中项的路径到局部变量
      const localPath = selectedItem.value.Path;
      const localName = selectedItem.value.Name;
      
      // 使用ElMessageBox自定义对话框（替代原有RenameDialog组件）
      ElMessageBox.prompt('请输入新名称', '重命名', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: localName,
        inputPattern: /^[^\\/:*?"<>|]+$/, // 文件名合法性校验
        inputErrorMessage: '文件名包含非法字符',
        beforeClose: async (action, instance, done) => {
          if (action === 'confirm') {
            try {
              const newName = instance.inputValue.trim();
              if (!newName) {
                ElMessage.warning('名称不能为空');
                return;
              }
              
              const params = new URLSearchParams();
              params.append('path', localPath); // 使用保存的路径
              params.append('rename', newName);

              const response = await fetch(`${API_BASE_URL}/rename`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                credentials: 'include',
                body: params
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.errMsg || '重命名失败');
              }

              if (data.errCode === 1000) {
                ElMessage.error('请先登录系统');
                done();
                return;
              }

              if (data.errCode !== 0) {
                ElMessage.error(data.errMsg);
                return;
              }

              ElMessage.success('重命名成功');
              fetchFileList(currentPath.value);
              done();
            } catch (error) {
              ElMessage.error(error.message);
            }
          } else {
            done();
          }
        }
      }).catch(() => {
        // 用户取消操作
      });
    };
 
    const deleteItem = async () => {
      if (!selectedItem.value) return;

      // 保存当前选中项的路径到局部变量
      const localPath = selectedItem.value.Path;
      const localName = selectedItem.value.Name;

      try {
        await ElMessageBox.confirm(
          `确定要删除 ${localName} 吗？`,
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        const response = await fetch(
          `${API_BASE_URL}/delete?path=${encodeURIComponent(localPath)}`,
          {
            method: 'DELETE',
            credentials: 'include'
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.errMsg || '删除失败');
        }

        if (data.errCode === 1000) {
          ElMessage.error('请先登录系统');
          return;
        }

        if (data.errCode !== 0) {
          ElMessage.error(data.errMsg);
          return;
        }

        ElMessage.success('删除成功');
        fetchFileList(currentPath.value);
        selectedItem.value = null;
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error(error.message);
        }
      }
    };

    const collectItem = async () => {
      if (!selectedItem.value) return;

      try {
        const params = new URLSearchParams();
        params.append('path', selectedItem.value.Path);
        const response = await fetch( `${API_BASE_URL}/add-collect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.errMsg || '收藏失败');
        }

        if (data.errCode === 1000) {
          ElMessage.error('请先登录系统');
          return;
        }

        if (data.errCode !== 0) {
          ElMessage.error(data.errMsg);
          return;
        }

        ElMessage.success('收藏成功');
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error(error.message);
        }
      }
    };

    // 分享对话框相关状态
    const showShareDialog = ref(false);
    const shareForm = reactive({
      fileName: '',
      isDir: false,
      filePath: '',
      validType: 1, // 0-长期有效 1-自定义天数
      validDays: 7,
      password: '',
      allowUpload: false
    });

    // 修改原有的shareItem方法
    const shareItem = () => {
      if (!selectedItem.value) return;

      // 初始化分享表单
      shareForm.fileName = selectedItem.value.Name;
      shareForm.isDir = selectedItem.value.IsDir;
      shareForm.filePath = selectedItem.value.Path;
      shareForm.validType = 1;
      shareForm.validDays = 7;
      shareForm.password = '';
      shareForm.allowUpload = false;
      
      showShareDialog.value = true;
    };

    // 确认分享
    const confirmShare = async () => {
      try {
        // 验证密码长度
        if (shareForm.password && 
            (shareForm.password.length < 2 || shareForm.password.length > 64)) {
          ElMessage.warning('密码长度必须为2-64位或为空');
          return;
        }

        // 计算有效期天数
        const validTime = shareForm.validType === 0 ? 0 : shareForm.validDays;

        const params = new URLSearchParams();
        params.append('path', shareForm.filePath);
        params.append('validTime', validTime);
        params.append('password', shareForm.password || '');
        params.append('edit', shareForm.allowUpload ? '1' : '0');
        
        const response = await fetch(`${API_BASE_URL}/add-shareLink`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.errMsg || '分享失败');
        }
        
        if (data.errCode === 1000) {
          ElMessage.error('请先登录系统');
          router.push('/user-login?callback=file-list');
          return;
        }
        
        if (data.errCode !== 0) {
          ElMessage.error(data.errMsg);
          return;
        }
        
        ElMessage.success('分享成功');
        showShareDialog.value = false;
        
        // 如果是文件夹且允许上传，显示提示
        if (shareForm.isDir && shareForm.allowUpload) {
          ElMessage.info('该分享链接已开启上传权限，其他人可向此文件夹上传文件');
        }
      } catch (error) {
        ElMessage.error(error.message);
      }
    };

    // 剪切功能
    const cutItem = () => {
      if (!selectedItem.value) return;
      clipboardItem.value = selectedItem.value;
      isCutOperation.value = true;
      ElMessage.success(`已剪切: ${selectedItem.value.Name}`);
    };
    
    const copyItem = () => {
      if (!selectedItem.value) return;
      clipboardItem.value = selectedItem.value;
      isCutOperation.value = false;
      ElMessage.success(`已复制: ${selectedItem.value.Name}`);
    };
    
    const pasteItem = async () => {
      if (!clipboardItem.value) {
        ElMessage.warning("没有复制或剪切的文件")
        return;
      }

      const operPath = clipboardItem.value.Path;
      // const tips = isCutOperation.value 
      //  ? `确定要剪切粘贴 ${clipboardItem.value.Path} 吗？` 
      //  : `确定要复制粘贴 ${clipboardItem.value.Path} 吗？`;

      try {
        // ✅ 1. 先确认用户操作（点击取消会抛出错误，进入 catch）
        /* await ElMessageBox.confirm(tips, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }); */

        // ✅ 2. 只有用户点击"确定"才会执行后续代码
        const url = isCutOperation.value 
          ? `${API_BASE_URL}/move` 
          : `${API_BASE_URL}/copy`;

        const params = new URLSearchParams();
        const path = operPath.substring(0, operPath.lastIndexOf('/'));

        params.append('path', path);
        params.append('name', clipboardItem.value.Name);
        params.append('destPath', currentPath.value);
        params.append('method', 'direct');

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.errMsg || '粘贴失败');
        }

        if (data.errCode === 1000) {
          ElMessage.error('请先登录系统');
          return;
        }

        if (data.errCode !== 0) {
          ElMessage.error(data.errMsg);
          return;
        }

        if (isCutOperation.value) { // 一次性粘贴
            clipboardItem.value = null;
        }

        ElMessage.success('粘贴成功');
        fetchFileList(currentPath.value);
      } catch (error) {
        // ✅ 3. 用户点击"取消"或 API 报错都会进入这里
        if (error !== 'cancel') { // 如果是 API 错误才提示
          ElMessage.error(error.message);
        }
        // 点击"取消"时不做任何提示，直接终止
      }
    };
    
    const downloadItem = async () => {
      if (!selectedItem.value) return;

      // 这样才能快速加载在下载管理器中，可以在下载管理其中看到对应的文件
      if (selectedItem.value.IsDir == false) {
        window.location.href = API_BASE_URL + '/download-file?path=' + encodeURIComponent(selectedItem.value.Path);
      } else {
        const downloadUrl = HOME_BASE_URL + '/download-local-folder?path=' + encodeURIComponent(selectedItem.value.Path);
        window.open(downloadUrl)
      } 
    };
    
    // 生成唯一ID
    const generateId = () => {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };
    
    // 格式化速度
    const formatSpeed = (bytesPerSecond) => {
      if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
      if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
    };
    
    // 格式化剩余时间
    const formatTime = (seconds) => {
      if (seconds < 60) return `${seconds.toFixed(0)}秒`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)}分${Math.floor(seconds % 60)}秒`;
      return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分`;
    };
    
    // 获取进度条状态
    const getProgressStatus = (item) => {
      if (item.error) return 'exception';
      if (item.completed) return 'success';
      return undefined;
    };
    
    // 触发文件选择
    const triggerFileUpload = () => {
      fileInput.value.click();
    };
    
    const handleBeforeClose = (done) => {
      const hasActiveUploads = uploadList.value.some(
        item => !item.completed && !item.error
      );
      
      if (hasActiveUploads) {
        ElMessageBox.confirm('仍有文件正在上传，确定要关闭吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          // 取消所有上传
          cancelAllUploads();
          done();
        }).catch(() => {
          // 取消关闭操作
        });
      } else {
        done();
      }
    };
    
    const cancelAllUploads = () => {
      uploadList.value.forEach((item, index) => {
        if (!item.completed && !item.error) {
          cancelUpload(index);
        }
      });
      ElMessage.warning('已取消所有上传');
    };

    // 关闭上传列表
    const closeUploadList = () => {
      const allDone = uploadList.value.every(item => item.completed || item.error);
      if (allDone) {
        showUploadList.value = false;
        uploadList.value = uploadList.value.filter(item => !item.completed);
      } else {
        // 如果有未完成的上传，弹出确认对话框
        ElMessageBox.confirm('仍有文件正在上传，确定要关闭吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          cancelAllUploads();
          showUploadList.value = false;
        }).catch(() => {
          // 取消关闭操作
        });
      }
    };
    
    // 处理上传错误
    const handleUploadError = (uploadItem, message) => {
      uploadItem.error = true;
      uploadItem.errorMessage = message;
      uploadItem.progress = uploadItem.progress || 0;
      
      // 强制更新视图
      uploadList.value = [...uploadList.value];
      
      ElMessage.error(`${uploadItem.file.name} 上传失败: ${message}`);
    };
    
    // 取消上传
    const cancelUpload = (index) => {
      if (uploadControllers[index]) {
        uploadControllers[index].abort();
      }
      
      if (uploadList.value[index]?.xhr) {
        uploadList.value[index].xhr.abort();
      }
      
      if (uploadList.value[index] && !uploadList.value[index].completed && !uploadList.value[index].error) {
        uploadList.value[index].error = true;
        uploadList.value[index].errorMessage = '上传已取消';
        ElMessage.warning(`已取消上传: ${uploadList.value[index].file.name}`);
      }
    };
    
    // 处理文件上传
    const handleFileUpload = async (event) => {
      const files = event.target.files;
      if (!files.length) return;
      
      uploadList.value = [];
      uploadControllers = [];
      showUploadList.value = true;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadId = generateId();
        
        const uploadItem = {
          id: uploadId,
          file: file,
          progress: 0,
          speed: 0,
          remainingTime: 0,
          completed: false,
          error: false,
          errorMessage: '',
          startTime: Date.now(),
          lastLoaded: 0,
          lastTime: Date.now(),
          xhr: null // 保存xhr引用
        };
        
        uploadList.value.push(uploadItem);
        
        try {
          const controller = new AbortController();
          uploadControllers[i] = controller;
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('path', currentPath.value);
          
          if (file.lastModified) {
            formData.append('time', Math.floor(file.lastModified / 1000).toString());
          }
          
          const xhr = new XMLHttpRequest();
          uploadItem.xhr = xhr; // 保存xhr引用
          
          // 添加withCredentials
          xhr.withCredentials = true;
          
          // 进度事件
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              const now = Date.now();
              const timeDiff = (now - uploadItem.lastTime) / 1000;
              
              if (timeDiff > 0) {
                const loadedDiff = e.loaded - uploadItem.lastLoaded;
                uploadItem.speed = loadedDiff / timeDiff;
                
                if (uploadItem.speed > 0) {
                  uploadItem.remainingTime = (e.total - e.loaded) / uploadItem.speed;
                }
              }
              
              uploadItem.progress = progress;
              uploadItem.lastLoaded = e.loaded;
              uploadItem.lastTime = now;
              
              // 强制更新视图
              uploadList.value = [...uploadList.value];
            }
          });
          
          // 加载完成事件
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              uploadItem.completed = true;
              uploadItem.progress = 100;
              uploadItem.speed = 0;
              uploadItem.remainingTime = 0;
              
              // 强制更新视图
              uploadList.value = [...uploadList.value];
              
              ElMessage.success(`${file.name} 上传成功`);
              
              // 上传成功后刷新文件列表
              fetchFileList(currentPath.value);
            } else {
              handleUploadError(uploadItem, xhr.responseText || '上传失败');
            }
          });
          
          // 错误事件
          xhr.addEventListener('error', () => {
            handleUploadError(uploadItem, '网络错误');
          });
          
          // 中止事件
          xhr.addEventListener('abort', () => {
            if (!uploadItem.completed && !uploadItem.error) {
              handleUploadError(uploadItem, '上传已取消');
            }
          });
          
          xhr.open('POST', `${API_BASE_URL}/upload`, true);
          
          // 添加授权头
          const token = localStorage.getItem('token');
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
          
          xhr.send(formData);
          
        } catch (error) {
          handleUploadError(uploadItem, error.message);
        }
      }
      
      event.target.value = '';
    };

    // 触发文件夹选择
    const triggerFolderUpload = () => {
      folderInput.value.click();
    };

    // 处理文件夹上传
    const handleFolderUpload = async (event) => {
      const entries = event.target.files;
      if (!entries.length) return;

      // 创建上传列表
      uploadList.value = [];
      uploadControllers = [];
      showUploadList.value = true;

      // 递归处理文件夹中的所有文件
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const relativePath = entry.webkitRelativePath || '';
        const folderPath = relativePath.split('/').slice(0, -1).join('/');

        await processFileEntry(entry, folderPath);
      }

      event.target.value = '';
    };

    // 递归处理文件/文件夹
    const processFileEntry = async (file, folderPath = '') => {
      const uploadId = generateId();
      
      const uploadItem = {
        id: uploadId,
        file: file,
        folderPath: folderPath, // 保存相对路径
        progress: 0,
        speed: 0,
        remainingTime: 0,
        completed: false,
        error: false,
        errorMessage: '',
        startTime: Date.now(),
        lastLoaded: 0,
        lastTime: Date.now(),
        xhr: null
      };
      
      uploadList.value.push(uploadItem);
      
      try {
        const controller = new AbortController();
        uploadControllers.push(controller);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', currentPath.value);
        // formData.append('folderPath', folderPath); // 添加文件夹相对路径
        
        if (file.lastModified) {
          formData.append('time', Math.floor(file.lastModified / 1000).toString());
        }
        
        const xhr = new XMLHttpRequest();
        uploadItem.xhr = xhr;
        xhr.withCredentials = true;
        
        // 进度事件
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            updateUploadProgress(uploadItem, e.loaded, e.total);
          }
        });
        
        // 加载完成事件
        xhr.addEventListener('load', () => {
          handleUploadComplete(uploadItem, xhr);
        });
        
        // 错误事件
        xhr.addEventListener('error', () => {
          handleUploadError(uploadItem, '网络错误');
        });
        
        // 中止事件
        xhr.addEventListener('abort', () => {
          if (!uploadItem.completed && !uploadItem.error) {
            handleUploadError(uploadItem, '上传已取消');
          }
        });
        
        xhr.open('POST', `${API_BASE_URL}/upload-folder`, true);
        
        const token = localStorage.getItem('token');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.send(formData);
        
      } catch (error) {
        handleUploadError(uploadItem, error.message);
      }
    };

    // 更新上传进度
    const updateUploadProgress = (uploadItem, loaded, total) => {
      const progress = Math.round((loaded / total) * 100);
      const now = Date.now();
      const timeDiff = (now - uploadItem.lastTime) / 1000;
      
      if (timeDiff > 0) {
        const loadedDiff = loaded - uploadItem.lastLoaded;
        uploadItem.speed = loadedDiff / timeDiff;
        
        if (uploadItem.speed > 0) {
          uploadItem.remainingTime = (total - loaded) / uploadItem.speed;
        }
      }
      
      uploadItem.progress = progress;
      uploadItem.lastLoaded = loaded;
      uploadItem.lastTime = now;
      
      // 强制更新视图
      uploadList.value = [...uploadList.value];
    };

    // 处理上传完成
    const handleUploadComplete = (uploadItem, xhr) => {
      if (xhr.status >= 200 && xhr.status < 300) {
        uploadItem.completed = true;
        uploadItem.progress = 100;
        uploadItem.speed = 0;
        uploadItem.remainingTime = 0;
        
        uploadList.value = [...uploadList.value];
        
        ElMessage.success(`${uploadItem.file.name} 上传成功`);
        
        // 上传成功后刷新文件列表
        fetchFileList(currentPath.value);
      } else {
        handleUploadError(uploadItem, xhr.responseText || '上传失败');
      }
    };

    // 键盘事件处理
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      const keyCombination = `${e.ctrlKey ? 'Ctrl+' : ''}${e.key.toUpperCase()}`;

      console.log("------------keyCombination:", keyCombination);
      
      switch (keyCombination) {
        case 'Delete', 'DELETE':
          if (selectedItem.value && !topDir.value) deleteItem();
          break;
        case 'F5':
          refreshCurrentPath();
          break;
        case 'Ctrl+ENTER':
          if (selectedItem.value) handleItemDblClick(selectedItem.value);
          break;
        case 'Ctrl+X':
          if (selectedItem.value && !topDir.value) cutItem();
          break;
        case 'Ctrl+C':
          if (selectedItem.value && !topDir.value) copyItem();
          break;
        case 'Ctrl+V':
          if (clipboardItem.value && !topDir.value) pasteItem();
          break;
      }
    };

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown);
    });

    // 初始化
    onMounted(() => {
      window.addEventListener('keydown', handleKeyDown);
      fetchFileList(currentPath.value);
    });

    // 搜索状态文本
    const searchStatusText = computed(() => {
      if (!isSearchMode.value) return '';
      if (searchComplete.value) {
        return `搜索结果：总共 ${searchResultCount.value} 个对象`;
      } else {
        return `搜索结果：超过 100 个对象，只显示前 100 个对象，请缩小搜索范围`;
      }
    });
    
    // 执行搜索
    const performSearch = async () => {
      if (!searchKeyword.value.trim()) {
        ElMessage.warning('请输入搜索关键词');
        return;
      }
      
      try {
        isSearching.value = true;
        isSearchMode.value = true;
        
        // 保存原始文件列表
        if (!originalFileList.value.length) {
          originalFileList.value = [...fileList.value];
        }
        
        const response = await fetch(
          `${API_BASE_URL}/find-files?path=${encodeURIComponent(currentPath.value)}&keyword=${encodeURIComponent(searchKeyword.value)}`,
          {
            method: 'GET',
            credentials: 'include'
          }
        );
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.errMsg || '搜索失败');
        }
        
        if (data.errCode === 1000) {
          ElMessage.error('请先登录系统');
          router.push('/user-login?callback=file-list');
          return;
        }
        
        // 更新文件列表和搜索状态
        fileList.value = data.file || [];
        searchResultCount.value = data.count || 0;
        searchComplete.value = data.searchComplete !== false;
        selectedItem.value = null;
        
        // 显示搜索结果提示
        if (searchComplete.value) {
          ElMessage.success(`找到 ${searchResultCount.value} 个匹配项`);
        } else {
          ElMessage.warning(`找到超过 100 个匹配项，只显示前 100 个`);
        }
      } catch (error) {
        ElMessage.error(`搜索失败: ${error.message}`);
        cancelSearch();
      } finally {
        isSearching.value = false;
      }
    };
    
    // 取消搜索
    const cancelSearch = () => {
      if (isSearchMode.value) {
        // 恢复原始文件列表
        if (originalFileList.value.length) {
          fileList.value = [...originalFileList.value];
        }
        
        searchKeyword.value = '';
        isSearchMode.value = false;
        originalFileList.value = [];
        ElMessage.info('已取消搜索');
      }
    };

    const contextMenu = reactive({
      visible: false,
      position: { x: 0, y: 0 },
      items: []
    });

    // 获取右键菜单项
    const getContextMenuItems = (item) => {
      // const isDir = item?.IsDir;
      const isSelected = !!item;
      const isTopDir = topDir.value;
      const hasClipboard = !!clipboardItem.value;

      console.log("--------------item:", item);
      
      if (isSelected) {
        return [
          {
            label: '打开',
            icon: '📂',
            command: 'open',
            disabled: !isSelected,
            shortcut: 'Ctrl+ENTER'
          },
          {
            label: '下载',
            icon: '⤓',
            command: 'download',
            disabled: !isSelected
          },
          {
            label: '剪切',
            icon: '✂️',
            command: 'cut',
            disabled: !isSelected || isTopDir,
            shortcut: 'Ctrl+X'
          },
          {
            label: '复制',
            icon: '📋',
            command: 'copy',
            disabled: !isSelected || isTopDir,
            shortcut: 'Ctrl+C'
          },
          {
            label: '粘贴',
            icon: '📌',
            command: 'paste',
            disabled: !hasClipboard || isTopDir,
            shortcut: 'Ctrl+V'
          },
          {
            label: '重命名',
            icon: '✏️',
            command: 'rename',
            disabled: !isSelected || isTopDir
          },
          {
            label: '删除',
            icon: '🗑️',
            command: 'delete',
            disabled: !isSelected || isTopDir,
            shortcut: 'Del'
          },
          {
            label: '收藏',
            icon: '⭐',
            command: 'collect',
            disabled: !isSelected
          },
          {
            label: '分享',
            icon: '↗️',
            command: 'share',
            disabled: !isSelected
          },
          {
            label: '新建文件',
            icon: '📄',
            command: 'newFile',
            disabled: isTopDir
          },
          {
            label: '新建文件夹',
            icon: '📁',
            command: 'newFolder',
            disabled: isTopDir
          },
          {
            label: '刷新',
            icon: '🔄',
            command: 'refresh',
            shortcut: 'F5'
          },
          {
            label: '属性',
            icon: 'ℹ️',
            command: 'properties',
            disabled: !isSelected
          }
        ];
      } else {
          return [
          {
            label: '新建文件',
            icon: '📄',
            command: 'newFile',
            disabled: isTopDir
          },
          {
            label: '新建文件夹',
            icon: '📁',
            command: 'newFolder',
            disabled: isTopDir
          },
          {
            label: '刷新',
            icon: '🔄',
            command: 'refresh',
            shortcut: 'F5'
          }
        ];
      }
    };

    // 处理文件项右键点击
    const handleItemRightClick = (event, item) => {
    //  console.log('文件项右键点击:', item);

      event.stopPropagation(); // 彻底阻止冒泡
      event.preventDefault();
      
      rightClickSource.value = 'item';
      selectItem(item);
      showContextMenu(event, item);
    };

    // 处理背景右键点击
    const handleBackgroundRightClick = (event) => {
     // console.log('背景项右键点击');

      // 只有当不是从文件项冒泡上来时才处理
      if (rightClickSource.value !== 'item') {
        selectedItem.value = null; // 取消当前选择
        event.preventDefault();
        rightClickSource.value = 'background';
        showContextMenu(event, null);
      }
      rightClickSource.value = null; // 重置状态
    };

    // 修改容器点击事件处理
    const handleContainerClick = () => {
     // console.log("-------------------handleContainerClick")

      // 检查点击是否发生在文件项之外
      const clickedOnFileItem = event.target.closest('.file-item');
      
      if (!clickedOnFileItem && !event.target.closest('.context-menu')) {
        // 点击的是空白处且不是右键菜单
        selectedItem.value = null;
      }
      
      // 关闭右键菜单
      if (contextMenu.visible) {
        closeContextMenu(true);
      }
    };

    // 显示右键菜单
    const showContextMenu = (event, item) => {
      contextMenu.visible = true;
      contextMenu.position = {
        x: event.clientX,
        y: event.clientY
      };
      contextMenu.items = getContextMenuItems(item);
    };

    // 关闭右键菜单
    const closeContextMenu = (immediate = false) => {
      if (immediate) {
        contextMenu.visible = false;
      } else {
        // 延迟关闭以避免与点击事件冲突
        setTimeout(() => {
          contextMenu.visible = false;
        }, 200);
      }
      rightClickSource.value = null;
    };

    // 处理右键菜单命令
    const handleContextMenuCommand = (command) => {
      closeContextMenu();
      
      switch (command) {
        case 'open':
          if (selectedItem.value) {
            handleItemDblClick(selectedItem.value);
          }
          break;
        case 'download':
          downloadItem();
          break;
        case 'cut':
          cutItem();
          break;
        case 'copy':
          copyItem();
          break;
        case 'paste':
          pasteItem();
          break;
        case 'rename':
          renameItem();
          break;
        case 'delete':
          deleteItem();
          break;
        case 'newFile':
          createFile();
          break;
        case 'collect':
          collectItem();
          break;
        case 'share':
          shareItem();
          break;
        case 'newFolder':
          createFolder();
          break;
        case 'refresh':
          refreshCurrentPath();
          break;
        case 'properties':
          showProperties();
          break;
      }
    };

    // 显示属性对话框
    const showProperties = () => {
      if (!selectedItem.value) return;
      
      ElMessageBox.alert(
        `名称: ${selectedItem.value.Name}<br>
        类型: ${getFileType(selectedItem.value)}<br>
        大小: ${formatSize(selectedItem.value.RealSize)}<br>
        修改时间: ${formatDate(selectedItem.value.ModTime)}<br>
        路径: ${selectedItem.value.Path}`,
        '文件属性',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '确定'
        }
      );
    };
    
    return {
      currentPath,
      fileList,
      topDir,
      selectedItem,
      clipboardItem,
      showCreateDialog,
      isCreatingFile,
      sortField,
      sortOrder,
      sortedFileList,
      breadcrumbParts,
      canGoBack,
      canGoForward,
      canGoUp,
      
      fetchFileList,
      navigateTo,
      navigateToBreadcrumb,
      refreshCurrentPath,
      goBack,
      goForward,
      goUp,
      selectItem,
      handleItemDblClick,
      sortBy,
      getFileIcon,
      getFileType,
      formatDate,
      formatSize,
      createFile,
      createFolder,
      confirmCreate,
      cancelCreate,
      renameItem,
      deleteItem,
      collectItem,
      shareItem,
      showShareDialog,
      shareForm,
      confirmShare,
      cutItem,
      copyItem,
      pasteItem,
      downloadItem,
      fileInput,
      folderInput,
      showUploadList,
      uploadList,
      triggerFileUpload,
      handleFileUpload,
      closeUploadList,
      cancelUpload,
      handleUploadError,
      formatSpeed,
      formatTime,
      getProgressStatus,
      handleBeforeClose,
      cancelAllUploads,

      triggerFolderUpload,
      handleFolderUpload,

      searchKeyword,
      isSearching,
      isSearchMode,
      searchComplete,
      searchResultCount,
      searchStatusText,
      performSearch,
      cancelSearch,

      ContextMenu,
      contextMenu,
      handleItemRightClick,
      handleBackgroundRightClick,
      handleContextMenuCommand,
      closeContextMenu,
      showProperties,
      handleContainerClick,

      showImagePreview,
      previewImageUrl,
      previewImageName,
      previewImage,
      downloadCurrentImage

    };
  }
};
</script>

<style scoped>
.upload-list-container {
  max-height: 60vh;
  overflow-y: auto;
  padding: 10px;
}

.upload-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.file-info {
  display: flex;
  align-items: center;
  width: 30%;
  min-width: 200px;
}

.file-icon {
  font-size: 24px;
  margin-right: 10px;
  color: #409EFF;
}

.file-details {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

.file-path {
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-progress {
  flex: 1;
  padding: 0 20px;
  min-width: 200px;
}

.upload-speed {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  text-align: center;
}

.upload-actions {
  width: 100px;
  display: flex;
  justify-content: center;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .upload-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .file-info {
    width: 100%;
    margin-bottom: 10px;
  }
  
  .upload-progress {
    width: 100%;
    padding: 0;
    margin-bottom: 10px;
  }
  
  .upload-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

.upload-error {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
}

.file-manager-container {
  font-family: 'Segoe UI', Arial, sans-serif;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  color: #333;
}

.toolbar {
  display: flex;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-right: 12px;
}

.toolbar button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 3px;
  background-color: white;
  cursor: pointer;
  font-size: 13px;
}

.toolbar button:hover {
  background-color: #e5f3ff;
  border-color: #cce0ff;
}

.toolbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar button .icon {
  font-size: 16px;
}

/* 面包屑导航样式 */
.breadcrumb-bar {
  display: flex;
  padding: 8px 12px;
  background-color: #f9f9f9;
  border-bottom: 1px solid #ddd;
  align-items: center;
}

.breadcrumb-items {
  flex: 1;
  display: flex;
  align-items: center;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none; /* Firefox */
}

.breadcrumb-items::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 3px;
}

.breadcrumb-item.clickable {
  cursor: pointer;
}

.breadcrumb-item.clickable:hover {
  background-color: #e5e5e5;
}

.breadcrumb-icon {
  margin-right: 4px;
  font-size: 14px;
}

.breadcrumb-text {
  font-size: 13px;
}

.breadcrumb-separator {
  margin: 0 4px;
  color: #999;
}

.breadcrumb-actions {
  margin-left: 8px;
}

.refresh-button {
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 3px;
}

.refresh-button:hover {
  background-color: #e5e5e5;
}

.refresh-button .icon {
  font-size: 16px;
}

/* 文件列表样式 */
.file-list-header {
  display: flex;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
  font-weight: bold;
  font-size: 13px;
  user-select: none;
}

.file-list-header > div {
  padding: 0 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.file-list-header > div:hover {
  background-color: #e5e5e5;
}

.header-name {
  width: 35%;
}

.header-size {
  width: 15%;
  justify-content: flex-end;
}

.header-type {
  width: 15%;
}

.header-modified {
  width: 20%;
}

.header-path {
  width: 15%;
}

.sort-indicator {
  margin-left: 4px;
  font-size: 12px;
}

.file-list {
  flex: 1;
  overflow-y: auto;
}

.file-item {
  display: flex;
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
  font-size: 13px;
  align-items: center;
}

.file-item:hover {
  background-color: #f5f5f5;
}

.file-item.selected {
  background-color: #e5f3ff;
}

.item-name {
  width: 35%;
  display: flex;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-size {
  width: 15%;
  text-align: right;
  padding-right: 8px;
}

.item-type {
  width: 15%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-modified {
  width: 20%;
}

.item-path {
  width: 15%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #666;
}

.file-icon {
  margin-right: 8px;
  font-size: 16px;
}

.folder .file-icon {
  color: #1a73e8;
}

.status-bar {
  padding: 6px 12px;
  background-color: #f5f5f5;
  border-top: 1px solid #ddd;
  display: flex;
  font-size: 12px;
  color: #555;
}

.status-item {
  margin-right: 20px;
}

/* 搜索组样式 */
.search-group {
  flex-grow: 1;
  max-width: 400px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: auto;
}

.search-group :deep(.el-input-group__append) {
  padding: 0 10px;
  background-color: var(--el-color-primary);
  color: white;
  cursor: pointer;
}

.search-group :deep(.el-input-group__append:hover) {
  opacity: 0.8;
}

/* 搜索状态提示 */
.search-status {
  margin: 10px 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .search-group {
    max-width: 100%;
    margin-right: 0;
    margin-bottom: 10px;
  }
}

.context-menu {
  user-select: none; /* 防止右键菜单内容被选中 */
}

.file-manager-container {
  user-select: none; /* 防止文件列表中的文本被选中 */
}

.file-item {
  user-select: none; /* 防止单个文件项被选中 */
}

.file-item.selected {
  background-color: #e5f3ff;
  outline: 2px solid #409EFF;
}

/* 新增图片预览相关样式 */
.image-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.image-error, .image-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #909399;
}

.image-error i, .image-loading i {
  font-size: 50px;
  margin-bottom: 10px;
}

/* 移动端适配 - 隐藏路径列并调整布局 */
@media (max-width: 768px) {
  /* 表头部分 - 隐藏路径列 */
  .file-list-header .header-path {
    display: none;
  }
  
  /* 文件项 - 隐藏路径列 */
  .file-list .item-path {
    display: none;
  }
  
  /* 调整各列宽度 */
  .file-list-header > div,
  .file-item > div {
    width: 25%; /* 现在只有4列 */
  }
  
  /* 名称列可以稍微宽一些 */
  .file-list-header .header-name,
  .file-item .item-name {
    width: 40%;
  }
  
  /* 大小、类型、日期列窄一些 */
  .file-list-header .header-size,
  .file-list-header .header-type,
  .file-list-header .header-modified,
  .file-item .item-size,
  .file-item .item-type,
  .file-item .item-modified {
    width: 20%;
  }
  
  /* 文件图标调整 */
  .file-icon {
    margin-right: 4px;
    font-size: 16px;
  }
  
  /* 文件名过长时省略显示 */
  .item-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

</style>