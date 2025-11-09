<template>
  <div class="about-page">
    <div class="container">
      <!-- 基本信息卡片 -->
      <div class="info-card">
        <div class="card-header">
          <h2><i class="fas fa-info-circle"></i> 基本信息</h2>
        </div>
        <div class="card-content">
          <div class="info-item">
            <span class="label">使用手册：</span>
            <a href="https://docs.qq.com/doc/DQW14Z1NSb0FSTEhw" target="_blank" class="external-link">点击进入</a>
          </div>
          <div class="info-item">
            <span class="label">APP使用手册：</span>
            <a href="https://docs.qq.com/doc/DQVlKRHBXamh3bnV2" target="_blank" class="external-link">点击进入</a>
          </div>
          <div class="info-item">
            <span class="label">CSDN博客：</span>
            <a href="https://blog.csdn.net/qq_40905836?type=blog" target="_blank" class="external-link">点击进入</a>
          </div>
          <div class="info-item">
            <span class="label">B站视频：</span>
            <a href="https://space.bilibili.com/631384833/video" target="_blank" class="external-link">点击进入</a>
          </div>
          <div class="info-item">
            <span class="label">版本地址：</span>
            <a href="http://www.tfcenter.com.cn" target="_blank" class="external-link">官网下载</a>
            <a href="https://share.weiyun.com/tFAN6x5p" target="_blank" class="external-link">微云下载</a>
          </div>
          <div class="info-item">
            <span class="label">其他访问方式：</span>
            <a href="javascript:void(0)" @click="showAccessModal" class="external-link">点击查看</a>
          </div>
          <div class="info-item">
            <span class="label">联系邮箱：</span>
            <span class="value">tfcenter@126.com</span>
          </div>
          <div class="info-item">
            <span class="label">联系QQ群：</span>
            <span class="value">599362559</span>
            <a target="_blank" href="https://qm.qq.com/q/aSTuXp9rig">
              <img border="0" src="//pub.idqqimg.com/wpa/images/group.png" alt="tfcenter软件交流讨论" title="tfcenter软件交流讨论">
            </a>
          </div>
          <div class="info-item">
            <span class="label">官方网址：</span>
            <a href="http://www.tfcenter.com.cn" target="_blank" class="external-link">点击进入</a>
          </div>
        </div>
      </div>

      <!-- 功能信息卡片 -->
      <div class="info-card">
        <div class="card-header">
          <h2><i class="fas fa-cogs"></i> 功能信息</h2>
        </div>
        <div class="card-content">
          <ol class="feature-list">
            <li>支持用户登陆功能(用户名:admin, 默认密码:tf12345678)，127.0.0.1本地回环访问将免密登陆</li>
            <li>支持Webdav(/tfdav)文件管理功能(https和http两种方式)，随时随地共享本地文件</li>
            <li>支持将windows本地挂载webdav服务，可像访问C盘一样访问远程挂载盘</li>
            <li>支持浏览器管理本地文件管理(https和http两种方式)，支持常见的文件、视频、文档pdf使用浏览器在线预览</li>
            <li>支持文件分享管理功能（可限制有效期、密码和上传等参数）</li>
            <li>支持公网（如阿里云、本地出口ip地址）进行端口映射</li>
            <li>支持P2P端口映射功能（基于TCP协议）</li>
            <li>支持http代理和socks5代理功能(用户名和密码设置可选)</li>
            <li>支持本地文件&文件夹同步到另一台tfcenter设备中</li>
            <li>支持阿里云和Pubyun(3322) DDNS功能</li>
            <li>支持tfcenter APP访问服务端（同步相册、播放视频、分享到微信&QQ等功能）</li>
            <li>支持centos7/8、ubuntu18/20/22、windows7/10/11、ARM系统、树莓派等</li>
            <li>密码重置：
              <ul class="sub-list">
                <li>linux使用参数-reset admin重置超级管理员密码为tf12345678；</li>
                <li>windows修改tfcenter.cfg参数loAuthLogin为true，可开启回环免密登陆。</li>
              </ul>
            </li>
          </ol>
        </div>
      </div>

      <!-- 免责声明卡片 -->
      <div class="info-card">
        <div class="card-header">
          <h2><i class="fas fa-exclamation-triangle"></i> 免责声明</h2>
        </div>
        <div class="card-content">
          <ol class="disclaimer-list">
            <li>使用本软件不收取任何费用。</li>
            <li>本软件完全无害且不含有任何有害代码，但不对任何第三方篡改版本作出保证。</li>
            <li>本软件不会收集用户隐私数据。</li>
          </ol>
        </div>
      </div>

      <!-- 更新日志卡片 -->
      <div class="info-card">
        <div class="card-header">
          <h2><i class="fas fa-history"></i> 更新日志</h2>
        </div>
        <div class="card-content log-content">
          <div class="log-entry" v-for="(log, index) in updateLogs" :key="index">
            <h3 class="log-version">{{ log.version }}</h3>
            <ul class="log-items">
              <li v-for="(item, i) in log.items" :key="i" v-html="item"></li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 访问方式弹窗 -->
      <el-dialog v-model="accessModalVisible" title="其他访问方式" width="600px">
        <div class="access-info">
          <div class="access-item">
            <span class="access-label">操作系统：</span>
            <el-tag size="small">{{ systemInfo.osType || '未知' }}</el-tag>
            <el-tag size="small">{{ systemInfo.platform || '未知' }}</el-tag>
          </div>
          <div class="access-item">
            <span class="access-label">IPv6 HTTP地址：</span>
            <div class="access-url">
              <el-tag v-if="systemInfo.webSwitch" type="success" size="small">已开启</el-tag>
              <el-tag v-else type="danger" size="small">未开启</el-tag>
              <template v-if="systemInfo.webSwitch">
                <el-input v-model="systemInfo.ipv6HttpUrl" readonly v-if="systemInfo.ipv6HttpUrl">
                  <template #append>
                    <el-tooltip content="访问" placement="top">
                      <el-button 
                        type="primary" 
                        @click="openUrl(systemInfo.ipv6HttpUrl)"
                        :icon="Link"
                        size="small"
                        circle
                      />
                    </el-tooltip>
                    <el-tooltip content="复制" placement="top">
                      <el-button 
                        type="primary" 
                        @click="copyToClipboard(systemInfo.ipv6HttpUrl)"
                        :icon="CopyDocument"
                        size="small"
                        circle
                      />
                    </el-tooltip>
                  </template>
                </el-input>
                <el-tag v-else type="warning" size="small">未检测到IPv6地址</el-tag>
              </template>
              <el-tag v-else type="info" size="small">HTTP服务未开启</el-tag>
            </div>
          </div>
          <div class="access-item">
            <span class="access-label">IPv6 HTTPS地址：</span>
            <div class="access-url">
              <el-tag v-if="systemInfo.httpsWebSwitch" type="success" size="small">已开启</el-tag>
              <el-tag v-else type="danger" size="small">未开启</el-tag>
              <template v-if="systemInfo.httpsWebSwitch">
                <el-input v-model="systemInfo.ipv6HttpsUrl" readonly v-if="systemInfo.ipv6HttpsUrl">
                  <template #append>
                    <el-tooltip content="访问" placement="top">
                      <el-button 
                        type="primary" 
                        @click="openUrl(systemInfo.ipv6HttpsUrl)"
                        :icon="Link"
                        size="small"
                        circle
                    />
                    </el-tooltip>
                    <el-tooltip content="复制" placement="top">
                      <el-button 
                        type="primary" 
                        @click="copyToClipboard(systemInfo.ipv6HttpsUrl)"
                        :icon="CopyDocument"
                        size="small"
                        circle
                      />
                    </el-tooltip>
                  </template>
                </el-input>
                <el-tag v-else type="warning" size="small">未检测到IPv6地址</el-tag>
              </template>
              <el-tag v-else type="info" size="small">HTTPS服务未开启</el-tag>
            </div>
          </div>
        </div>
        <template #footer>
          <el-button @click="accessModalVisible = false">关闭</el-button>
        </template>
      </el-dialog>

    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Link, CopyDocument } from '@element-plus/icons-vue';
import { API_BASE_URL } from '@/config';

export default {
  name: 'AboutPage',
  setup() {
    const accessModalVisible = ref(false);
    const systemInfo = ref({
      osType: '',
      platform: '',
      ipv6HttpUrl: '',
      ipv6HttpsUrl: '',
      httpsWebSwitch: false,
      webSwitch: false
    });

    // 更新日志数据
    const updateLogs = ref([
      {
        version: 'v4.0.2',
        items: [
          '(1) 将左侧导航和顶部导航改成可拖拽模式，避免挡住按钮',
          '(2) 修复阿里云DDNS不支持设置@和*前缀的问题',
          '(3) 修复挂载页面匹配不到pid的问题'
        ]
      },
      {
        version: 'v4.0.1',
        items: [
          '(1) 修改windows控制台，新增前台界面，显示操作按钮和对应的启动信息',
          '(2) 修复部分显示问题'
        ]
      },
      {
        version: 'v4.0.0',
        items: [
          '(1) 调整页面风格',
          '(2) 新增反向代理功能',
          '(3) 新增配置文件存放在数据库boltdb中',
          '(4) 新增设置可指定登陆后跳转页面',
          '(5) 新增自动登陆功能',
          '(6) 内嵌windows Webdav服务挂载',
          '(7) 新增控制服务器功能',
          '(8) 新增其他访问方式（可通过关于查看）'
        ]
      },
      {
        version: 'v3.4.2',
        items: [
          '(1) 取消windows守护进程启动，避免某些操作系统产生大量进程的问题',
          '(2) 更新tfcenter-daemon.bat脚本，安装服务时，设置服务退出自动拉起'
        ]
      },
      {
        version: 'v3.4.1',
        items: [
          '(1) 实现程序守护进程启动，移除windows和linux tfcenter-daemon程序',
          '(2) 端口映射服务器异常退出后，客户端只重连一次改成不停重连',
          '(3) 修复端口映射客户端异常退出后，有概率选择服务端失败的问题',
          '(4) 修复部分android手机运行失败的问题（filesync权限问题导致的错误）'
        ]
      },
    ]);

    // 获取系统信息
    const fetchSystemInfo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/get-loginSysInfo`, {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.errCode === 0) {
          systemInfo.value = data;
        } else {
          ElMessage.warning(data.errMsg || '获取系统信息失败');
        }
      } catch (error) {
        console.error('获取系统信息失败:', error);
        ElMessage.error('获取系统信息失败，请检查网络连接');
      }
    };

    // 显示访问方式弹窗
    const showAccessModal = () => {
      accessModalVisible.value = true;
      // 如果还没有获取过系统信息，则获取
      if (!systemInfo.value.osType) {
        fetchSystemInfo();
      }
    };

    // 复制到剪贴板
    const copyToClipboard = (text) => {
      if (!text) {
        ElMessage.warning('没有可复制的内容');
        return;
      }

      console.log("---------text:", text);
      
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
      copy(text);

      ElMessage.success('复制成功');
    };

    // 修改打开URL方法，增加空值检查
    const openUrl = (url) => {
      if (!url) {
        ElMessage.warning('无效的URL地址');
        return;
      }

      window.open(url, '_blank');
    };

    onMounted(() => {
      // 可以在这里添加其他数据获取逻辑
    });

    return {
      updateLogs,
      accessModalVisible,
      systemInfo,
      showAccessModal,
      copyToClipboard,
      openUrl,
      Link,
      CopyDocument
    };
  }
};
</script>

<style scoped>
.about-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.container {
  margin: 0 auto;
}

.info-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  overflow: hidden;
}

.card-header {
  background-color: #f0f2f5;
  padding: 16px 24px;
  border-bottom: 1px solid #e6e6e6;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-header i {
  font-size: 20px;
}

.card-content {
  padding: 20px 24px;
}

.info-item {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
}

.label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.value {
  color: #333;
}

.external-link {
  color: #409eff;
  text-decoration: none;
  margin-right: 15px;
}

.external-link:hover {
  text-decoration: underline;
}

.feature-list, .disclaimer-list {
  padding-left: 20px;
  margin: 0;
}

.feature-list li, .disclaimer-list li {
  margin-bottom: 8px;
  line-height: 1.6;
  color: #333;
}

.sub-list {
  padding-left: 20px;
  margin-top: 5px;
}

.sub-list li {
  margin-bottom: 5px;
}

.log-content {
  max-height: 600px;
  overflow-y: auto;
}

.log-entry {
  margin-bottom: 20px;
}

.log-version {
  font-size: 16px;
  color: #409eff;
  margin: 0 0 10px 0;
  padding-bottom: 5px;
  border-bottom: 1px dashed #e6e6e6;
}

.log-items {
  padding-left: 20px;
  margin: 0;
}

.log-items li {
  margin-bottom: 8px;
  line-height: 1.6;
  color: #666;
}

/* 访问信息弹窗样式 */
.access-info {
  padding: 10px;
}

.access-item {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.access-label {
  font-weight: bold;
  width: 125px;
  flex-shrink: 0;
}

.access-value {
  margin-right: 10px;
}

.access-url {
  flex-grow: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.el-input {
  flex-grow: 1;
}

.access-url .el-tag {
  margin-left: 10px;
}

@media (max-width: 768px) {
  .card-content {
    padding: 15px;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
  }
  
  .label {
    margin-bottom: 2px;
  }

  .access-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .access-url {
    width: 100%;
    margin-top: 8px;
  }
}
</style>