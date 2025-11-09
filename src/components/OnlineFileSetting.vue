<template>
  <div class="settings-page">
    <div class="container">
      <!-- 在线文件编辑设置卡片 -->
      <div class="setting-card">
        <div class="card-header">
          <h2><i class="fas fa-file-edit"></i> 在线文件编辑设置</h2>
        </div>
        <div class="card-content">
          <!-- 第一行：Office地址和IP设置 -->
          <el-table :data="[officeSettings]" border style="width: 100%; margin-bottom: 20px;">
            <el-table-column prop="officeUrl" label="在线Office地址" width="450">
              <template #default="{ row }">
                <el-input 
                  v-model="row.officeUrl" 
                  size="small"
                  placeholder="http://[ip:port]/web-apps/apps/api/documents/api.js"
                  :disabled="!onlineEdit"
                />
              </template>
            </el-table-column>
            <el-table-column prop="officeAccessIP" label="Office连接IP" width="150">
              <template #default="{ row }">
                <el-input 
                  v-model="row.officeAccessIP" 
                  size="small"
                  :disabled="!onlineEdit"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default>
                <el-button 
                  v-if="onlineEdit"
                  type="primary" 
                  size="small" 
                  @click="updateFileSetting('off')"
                  :loading="fileSettingLoading"
                >
                  关闭
                </el-button>
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="updateFileSetting('on')"
                  :loading="fileSettingLoading"
                >
                  {{ onlineEdit ? '更新' : '开启' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 第二行：文件扩展名设置 -->
          <el-table :data="[officeSettings]" border style="width: 100%">
            <el-table-column label="可编辑文件扩展名" width="300">
              <template #default="{ row }">
                <el-select
                  v-model="row.officeWriteSelected"
                  multiple
                  filterable
                  allow-create
                  size="small"
                  style="width: 100%"
                  placeholder="请选择或输入扩展名"
                >
                  <el-option
                    v-for="ext in defaultExtensions"
                    :key="'write-'+ext"
                    :label="ext"
                    :value="ext"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="只读文件扩展名" width="300">
              <template #default="{ row }">
                <el-select
                  v-model="row.officeReadSelected"
                  multiple
                  filterable
                  allow-create
                  size="small"
                  style="width: 100%"
                  placeholder="请选择或输入扩展名"
                >
                  <el-option
                    v-for="ext in defaultExtensions"
                    :key="'read-'+ext"
                    :label="ext"
                    :value="ext"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default>
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="updateOfficeAttr"
                  :loading="officeAttrLoading"
                >
                  更新
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>



    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { API_BASE_URL } from '@/config';
import { HOME_BASE_URL } from '@/config';

export default {
  name: 'SettingsPage',
  setup() {
    const router = useRouter();
    
    // 加载状态
    const loading = ref(true);
    const webLoading = ref(false);
    const authLoading = ref(false);
    const cacheLoading = ref(false);
    const securityLoading = ref(false);
    const backupLoading = ref(false);
    const uploadLoading = ref(false);
    const restartLoading = ref(false);
    const loadCompo = ref('')

    // 新增：登录后页面配置相关状态
    const loginPageSettings = ref({
      loginPage: 'filemgmt' // 默认值
    });
    const loginPageLoading = ref(false);

    // Web设置
    const webSettings = ref({
      httpPort: '8866',
      httpStatus: 'on',
      httpsPort: '8886',
      httpsStatus: 'off'
    });

    // 免密登录设置
    const authSettings = ref({
      status: '已关闭'
    });

    // 缓存文件设置
    const cacheSettings = ref({
      path: '/system/bin/tmpStorage',
      time: '43200',
      recycle: 'off'
    });

    // 安全入口路径
    const securitySettings = ref({
      path: ''
    });

    // 文件上传
    const uploadFile = ref(null);

    // 检查登录状态
    const checkSysStatus = () => {
      // 这里可以根据实际情况从localStorage、cookie或vuex中获取登录状态
      const userInfo = localStorage.getItem('userInfo')
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo)
          loadCompo.value = user.loadCompo || ''
        } catch (e) {
          console.error('解析用户信息失败', e)
        }
      }
    };

    // 获取设置信息
    const fetchSettings = async () => {
      try {
        loading.value = true;
        const response = await fetch(`${API_BASE_URL}/get-settingInfo`, {
          credentials: 'include'
        });
        const data = await response.json();

        if (data.errCode === 1000) {
          ElMessage.warning('请先登录');
          router.push('/user-login?callback=sys-setting');
          return;
        }

        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '获取设置信息失败');
        }

        // 更新Web设置
        webSettings.value = {
          httpPort: data.webport.toString(),
          httpStatus: data.webSwitch ? 'on' : 'off',
          httpsPort: data.httpsWebPort.toString(),
          httpsStatus: data.httpsWebSwitch ? 'on' : 'off'
        };

        // 更新免密登录设置
        authSettings.value.status = data.loAuthLogin ? '已开启' : '已关闭';

        // 更新缓存设置
        cacheSettings.value = {
          path: data.tmpStorage,
          time: data.tmpStorageTime.toString(),
          recycle: data.recycleFlag ? 'on' : 'off'
        };

        // 更新安全路径
        securitySettings.value.path = data.securePath;

        // 更新日志设置
        logSettings.value.level = data.logData.level
        logSettings.value.ouput = data.logData.ouput
        logSettings.value.day = data.logData.day
        logSettings.value.userLogDay = data.logData.userLogDay

        // 更新在线office设置
        onlineEdit.value = data.onlineEdit
        officeSettings.value.officeUrl = data.officeUrl
        officeSettings.value.officeAccessIP = data.officeAccessIP

        officeSettings.value.officeWriteSelected = data.officeWrite 
        ? data.officeWrite.split(',').filter(item => item.trim() !== '') 
        : [],
        officeSettings.value.officeReadSelected = data.officeRead 
        ? data.officeRead.split(',').filter(item => item.trim() !== '') 
        : []


        // 端口映射设置相关状态
        portConfig.value.validPort = data.ServerConfig.validPort
        portConfig.value.firstAutoPort = data.ServerConfig.firstAutoPort
        // const portLoading = ref(false);

        // 连接服务器设置相关状态
        connectionServer.value.dcServerIP = data.DCServerIP
        connectionServer.value.dcServerPort = data.DCServerPort
        connectionServer.value.dcServerToken = data.DCServerToken
        connectionStatus.value = data.selectSrvStatus
        // const connectionLoading = ref(false);

        // 分发服务器设置相关状态
        distributionServer.value.port = data.BRServer.port
        distributionServer.value.token = data.BRServer.token
        distributionStatus.value = data.BRServerStatus; // true表示运行中
        // const distributionLoading = ref(false);

        if (data.loginPage) {
          loginPageSettings.value.loginPage = data.loginPage;
        }

      } catch (error) {
        console.error('获取设置信息失败:', error);
        ElMessage.error(error.message || '获取设置信息失败');
      } finally {
        loading.value = false;
      }
    };

    // 新增：更新登录后页面配置
    const updateLoginPage = async () => {
      try {
        loginPageLoading.value = true;
        const params = new URLSearchParams();
        params.append('loginPage', loginPageSettings.value.loginPage);
        
        const response = await fetch(`${API_BASE_URL}/update-login-page`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '更新登录后页面配置失败');
        }
        
        ElMessage.success('登录后页面配置已更新');
      } catch (error) {
        console.error('更新登录后页面配置失败:', error);
        ElMessage.error(error.message || '更新登录后页面配置失败');
      } finally {
        loginPageLoading.value = false;
      }
    };

    // 更新Web配置
    const updateWebConfig = async () => {
      try {
        webLoading.value = true;
        const params = new URLSearchParams();
        params.append('webPort', parseInt(webSettings.value.httpPort));
        params.append('webSwitch', webSettings.value.httpStatus);
        params.append('httpsWebPort', parseInt(webSettings.value.httpsPort));
        params.append('httpsWebSwitch', webSettings.value.httpsStatus);
        
        const response = await fetch(`${API_BASE_URL}/update-web-config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '更新Web配置失败');
        }
        
        ElMessage.success('Web配置已更新');

        restartSoftware()

      } catch (error) {
        console.error('更新Web配置失败:', error);
        ElMessage.error(error.message || '更新Web配置失败');
      } finally {
        webLoading.value = false;
      }
    };

    // 切换免密登录
    const toggleAuthLogin = async () => {
      try {
        authLoading.value = true;

        const authStatus = !(authSettings.value.status === '已开启');
        const url = authStatus
          ? `${API_BASE_URL}/start-loAuthLogin`
          : `${API_BASE_URL}/stop-loAuthLogin`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '更新免密登录设置失败');
        }

        fetchSettings();
        
        authSettings.value.status = authStatus ? '已开启' : '已关闭';
        ElMessage.success(`免密登录已${authStatus ? '开启' : '关闭'}`);
      } catch (error) {
        console.error('更新免密登录设置失败:', error);
        ElMessage.error(error.message || '更新免密登录设置失败');
      } finally {
        authLoading.value = false;
      }
    };

    // 日志设置相关状态
    const logSettings = ref({
      level: 'debug',
      day: 0,
      userLogDay: 30,
      output: 'tfcenter-service.txt'
    });

    const logLoading = ref(false);

    // 更新日志配置
    const updateLogConfig = async () => {
      try {
        logLoading.value = true;
        
        // 验证输入
        if (!logSettings.value.level) {
          ElMessage.warning('请选择系统日志级别');
          return;
        }
        
        if (logSettings.value.day < 0 || logSettings.value.day > 30) {
          ElMessage.warning('系统日志天数必须在0-30之间');
          return;
        }
        
        if (logSettings.value.userLogDay < 0 || logSettings.value.userLogDay > 365) {
          ElMessage.warning('用户日志天数必须在0-365之间');
          return;
        }

        const params = new URLSearchParams();
        params.append('level', logSettings.value.level);
        params.append('day', logSettings.value.day);
        params.append('userlogday', logSettings.value.userLogDay);
        
        const response = await fetch(`${API_BASE_URL}/update-logConfig`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '更新日志配置失败');
        }
        
        ElMessage.success('日志配置已更新');
      } catch (error) {
        console.error('更新日志配置失败:', error);
        ElMessage.error(error.message || '更新日志配置失败');
      } finally {
        logLoading.value = false;
      }
    };


    // 在线文件编辑设置相关状态
    const onlineEdit = ref(false);
    const officeSettings = ref({
      officeUrl: '',
      officeAccessIP: '',
      officeWriteSelected: [], // 可编辑扩展名数组
      officeReadSelected: []  // 只读扩展名数组
    });

    const defaultExtensions = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];
    const fileSettingLoading = ref(false);
    const officeAttrLoading = ref(false);

    // 更新文件设置（开启/关闭）
    const updateFileSetting = async (flag) => {
      try {
        fileSettingLoading.value = true;
        
        const params = new URLSearchParams();
        params.append('officeUrl', officeSettings.value.officeUrl);
        params.append('officeAccessIP', officeSettings.value.officeAccessIP);
        params.append('onlineEdit', flag);
        
        const response = await fetch(`${API_BASE_URL}/update-fileSetting`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '更新文件设置失败');
        }
        
        ElMessage.success(data.errMsg || '文件设置已更新');
        onlineEdit.value = flag === 'on';
      } catch (error) {
        console.error('更新文件设置失败:', error);
        ElMessage.error(error.message || '更新文件设置失败');
      } finally {
        fileSettingLoading.value = false;
      }
    };

    // 更新文件属性（扩展名设置）
    const updateOfficeAttr = async () => {
      try {
        officeAttrLoading.value = true;
        
        // 验证至少有一个扩展名
        if (officeSettings.value.officeWriteSelected.length === 0 && 
            officeSettings.value.officeReadSelected.length === 0) {
          ElMessage.warning('可编辑和只读扩展名不能同时为空');
          return;
        }

        const params = new URLSearchParams();
        // 将数组转换为逗号分隔的字符串
        params.append('officeWrite', officeSettings.value.officeWriteSelected.join(','));
        params.append('officeRead', officeSettings.value.officeReadSelected.join(','));
        
        const response = await fetch(`${API_BASE_URL}/update-officeAttr`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '更新文件属性失败');
        }
        
        ElMessage.success('文件属性已更新');
      } catch (error) {
        console.error('更新文件属性失败:', error);
        ElMessage.error(error.message || '更新文件属性失败');
      } finally {
        officeAttrLoading.value = false;
      }
    };

    // 端口映射设置相关状态
    const portConfig = ref({
      validPort: '',
      firstAutoPort: 10000
    });

    const portLoading = ref(false);

    // 连接服务器设置相关状态
    const connectionServer = ref({
      dcServerIP: '',
      dcServerPort: 0,
      dcServerToken: ''
    });
    const connectionStatus = ref(false); // true表示已开启
    const connectionLoading = ref(false);

    // 分发服务器设置相关状态
    const distributionServer = ref({
      port: 0,
      token: ''
    });
    const distributionStatus = ref(false); // true表示运行中
    const distributionLoading = ref(false);

    
    // 更新端口映射配置
    const updatePortConfig = async () => {
      try {
        portLoading.value = true;
        
        // 验证输入
        if (!portConfig.value.validPort) {
          ElMessage.warning('有效端口号不能为空');
          return;
        }
        
        if (!portConfig.value.firstAutoPort || portConfig.value.firstAutoPort < 1 || portConfig.value.firstAutoPort > 65535) {
          ElMessage.warning('起始端口号取值范围是1-65535');
          return;
        }

        const params = new URLSearchParams();
        params.append('firstAutoPort', portConfig.value.firstAutoPort);
        params.append('validPort', portConfig.value.validPort);
        
        const response = await fetch(`${API_BASE_URL}/update-portConfig`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '更新端口映射配置失败');
        }
        
        ElMessage.success(data.errMsg || '端口映射配置已更新');
      } catch (error) {
        console.error('更新端口映射配置失败:', error);
        ElMessage.error(error.message || '更新端口映射配置失败');
      } finally {
        portLoading.value = false;
      }
    };

    // 更新连接服务器配置
    const updateBrServer = async () => {
      try {
        connectionLoading.value = true;
        
        // 验证输入
        if (!connectionServer.value.dcServerIP) {
          ElMessage.warning('IP地址不能为空');
          return;
        }
        
        if (!connectionServer.value.dcServerPort || connectionServer.value.dcServerPort < 1 || connectionServer.value.dcServerPort > 65535) {
          ElMessage.warning('端口取值范围是1-65535');
          return;
        }
        
        if (!connectionServer.value.dcServerToken || connectionServer.value.dcServerToken.length < 10 || connectionServer.value.dcServerToken.length > 20) {
          ElMessage.warning('token长度为10-20位');
          return;
        }

        const params = new URLSearchParams();
        params.append('DCServerIP', connectionServer.value.dcServerIP);
        params.append('DCServerPort', connectionServer.value.dcServerPort);
        params.append('DCServerToken', connectionServer.value.dcServerToken);
        
        const response = await fetch(`${API_BASE_URL}/update-brServer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '更新连接服务器配置失败');
        }
        
        ElMessage.success(data.errMsg || '连接服务器配置已更新');
        connectionStatus.value = true;
      } catch (error) {
        console.error('更新连接服务器配置失败:', error);
        ElMessage.error(error.message || '更新连接服务器配置失败');
      } finally {
        connectionLoading.value = false;
      }
    };

    // 恢复默认连接服务器配置
    const updateDefaultBrServer = async () => {
      try {
        connectionLoading.value = true;
        
        const response = await fetch(`${API_BASE_URL}/update-defaultBrServer`, {
          method: 'POST',
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '恢复默认连接服务器配置失败');
        }

        await fetchSettings();        
        ElMessage.success(data.errMsg || '已恢复默认连接服务器配置');
      } catch (error) {
        console.error('恢复默认连接服务器配置失败:', error);
        ElMessage.error(error.message || '恢复默认连接服务器配置失败');
      } finally {
        connectionLoading.value = false;
      }
    };

    // 关闭连接服务器
    const closeBrServer = async () => {
      try {
        connectionLoading.value = true;
        
        const response = await fetch(`${API_BASE_URL}/close-brServer`, {
          method: 'POST',
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '关闭连接服务器失败');
        }
        
        ElMessage.success(data.errMsg || '连接服务器已关闭');
        connectionStatus.value = false;
      } catch (error) {
        console.error('关闭连接服务器失败:', error);
        ElMessage.error(error.message || '关闭连接服务器失败');
      } finally {
        connectionLoading.value = false;
      }
    };

    // 更新分发服务器配置
    const updateBrServerService = async () => {
      try {
        distributionLoading.value = true;
        
        // 验证输入
        if (!distributionServer.value.port || distributionServer.value.port < 1 || distributionServer.value.port > 65535) {
          ElMessage.warning('端口取值范围是1-65535');
          return;
        }
        
        if (!distributionServer.value.token || distributionServer.value.token.length < 10 || distributionServer.value.token.length > 20) {
          ElMessage.warning('token长度为10-20位');
          return;
        }

        const params = new URLSearchParams();
        params.append('BrServerServicePort', distributionServer.value.port);
        params.append('BrServerServiceToken', distributionServer.value.token);
        
        const response = await fetch(`${API_BASE_URL}/update-brServerService`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '更新分发服务器配置失败');
        }
        
        ElMessage.success(data.errMsg || '分发服务器配置已更新');
        distributionStatus.value = true;
      } catch (error) {
        console.error('更新分发服务器配置失败:', error);
        ElMessage.error(error.message || '更新分发服务器配置失败');
      } finally {
        distributionLoading.value = false;
      }
    };

    // 停止分发服务器
    const stopBrServerService = async () => {
      try {
        distributionLoading.value = true;
        
        const response = await fetch(`${API_BASE_URL}/stop-brServerService`, {
          method: 'POST',
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '停止分发服务器失败');
        }
        
        ElMessage.success(data.errMsg || '分发服务器已停止');
        distributionStatus.value = false;
      } catch (error) {
        console.error('停止分发服务器失败:', error);
        ElMessage.error(error.message || '停止分发服务器失败');
      } finally {
        distributionLoading.value = false;
      }
    };


    // 更新缓存设置
    const updateCacheSettings = async () => {
      try {
        cacheLoading.value = true;
        const params = new URLSearchParams();
        params.append('tmpStorage', cacheSettings.value.path);
        params.append('tmpStorageTime', parseInt(cacheSettings.value.time));
        params.append('recycleFlag', cacheSettings.value.recycle);
        
        const response = await fetch(`${API_BASE_URL}/update-tmpStorage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '更新缓存设置失败');
        }
        
        ElMessage.success('缓存设置已更新');
      } catch (error) {
        console.error('更新缓存设置失败:', error);
        ElMessage.error(error.message || '更新缓存设置失败');
      } finally {
        cacheLoading.value = false;
      }
    };

    // 重置缓存设置
    const resetCacheSettings = async () => {
      try {
        cacheLoading.value = true;
        const params = new URLSearchParams();
        params.append('tmpStorage', '000');
        params.append('tmpStorageTime', '000');
        params.append('recycleFlag', cacheSettings.value.recycle);
        
        const response = await fetch(`${API_BASE_URL}/update-tmpStorage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '重置缓存设置失败');
        }
        
        await fetchSettings();
        ElMessage.success('已恢复默认缓存设置');
      } catch (error) {
        console.error('重置缓存设置失败:', error);
        ElMessage.error(error.message || '重置缓存设置失败');
      } finally {
        cacheLoading.value = false;
      }
    };

    // 更新安全路径
    const updateSecurityPath = async () => {
      try {
        securityLoading.value = true;
        const params = new URLSearchParams();
        params.append('securePath', securitySettings.value.path);
        
        const response = await fetch(`${API_BASE_URL}/update-securePath`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '更新安全路径失败');
        }
        
        ElMessage.success('安全路径已更新');
      } catch (error) {
        console.error('更新安全路径失败:', error);
        ElMessage.error(error.message || '更新安全路径失败');
      } finally {
        securityLoading.value = false;
      }
    };

    // 备份所有配置
    const backupAllConfig = async () => {
      let url = HOME_BASE_URL + '/download-config-file';
      window.open(url);
    };

    // 备份cfg配置
    const backupCfgConfig = async () => {
      let url = HOME_BASE_URL + '/download-cfg-config-file';
      window.open(url);
      /*
      try {
        backupLoading.value = true;
        const response = await fetch(`${API_BASE_URL}/download-cfg-config-file`, {
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '备份cfg配置失败');
        }
        
        // 创建下载链接
        const downloadUrl = `${API_BASE_URL}${data.filePath}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = data.fileName || 'cfg_config_backup.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        ElMessage.success('cfg配置备份成功');
      } catch (error) {
        console.error('备份cfg配置失败:', error);
        ElMessage.error(error.message || '备份cfg配置失败');
      } finally {
        backupLoading.value = false;
      }
      */
    };

    // 文件上传处理
    const handleFileChange = (file) => {
      uploadFile.value = file.raw;
    };

    // 提交上传
    const submitUpload = async () => {
      if (!uploadFile.value) return;
      
      try {
        uploadLoading.value = true;
        const formData = new FormData();
        formData.append('file', uploadFile.value);
        
        const response = await fetch(`${API_BASE_URL}/upload-cfg-config-file`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '配置文件上传失败');
        }
        
        ElMessage.success('配置文件上传成功');
        uploadFile.value = null;
        // 上传成功后刷新设置
        fetchSettings();
      } catch (error) {
        console.error('配置文件上传失败:', error);
        ElMessage.error(error.message || '配置文件上传失败');
      } finally {
        uploadLoading.value = false;
      }
    };

    // 重启软件
    const restartSoftware = async () => {
      try {
        await ElMessageBox.confirm('确定要重启软件吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        
        restartLoading.value = true;
        const response = await fetch(`${API_BASE_URL}/restart-proccess`, {
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '重启软件失败');
        }
        
        ElMessage.success('软件将在3秒后重启');
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } catch (error) {
        if (error !== 'cancel' && error !== 'close') {
          console.error('重启软件失败:', error);
          ElMessage.error('当前连接断开，请刷新页面:'  +  error.message);
        }
      } finally {
        restartLoading.value = false;
      }
    };

    onMounted(() => {
      fetchSettings();
      checkSysStatus();
    });

    return {
      loadCompo,
      webSettings,
      authSettings,
      authLoading,
      cacheSettings,
      securitySettings,
      loginPageSettings,
      loginPageLoading,
      updateLoginPage,
      uploadFile,
      webLoading,
      cacheLoading,
      securityLoading,
      backupLoading,
      uploadLoading,
      restartLoading,
      updateWebConfig,
      toggleAuthLogin,
      updateCacheSettings,
      resetCacheSettings,
      updateSecurityPath,

      logSettings,
      logLoading,
      updateLogConfig,

      onlineEdit,
      officeSettings,
      defaultExtensions,
      fileSettingLoading,
      officeAttrLoading,
      updateFileSetting,
      updateOfficeAttr,

      portConfig,
      portLoading,
      connectionServer,
      connectionStatus,
      connectionLoading,
      distributionServer,
      distributionStatus,
      distributionLoading,
      updatePortConfig,
      updateBrServer,
      updateDefaultBrServer,
      closeBrServer,
      updateBrServerService,
      stopBrServerService,

      backupAllConfig,
      backupCfgConfig,
      handleFileChange,
      submitUpload,
      restartSoftware
    };
  }
};
</script>

<style scoped>
.settings-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 40px);
}

.container {
  margin: 0 auto;
}

.setting-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.card-header {
  background-color: #f0f2f5;
  padding: 16px 20px;
  border-bottom: 1px solid #e6e6e6;
}

.card-header h2 {
  margin: 0;
  font-size: 16px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-header i {
  font-size: 18px;
}

.card-content {
  padding: 20px;
}

.backup-actions {
  display: flex;
  gap: 10px;
}

.file-name {
  margin-left: 10px;
  color: #666;
}

.upload-demo {
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .card-content {
    padding: 15px;
  }
  
  .backup-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .upload-demo {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .file-name {
    margin-left: 0;
    margin-top: 5px;
  }
}
</style>