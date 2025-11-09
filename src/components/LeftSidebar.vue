<template>
  <aside class="sidebar">
    <div class="logo"><a href="/" class="logo-link">{{ productName }}</a></div>
    <nav>
      <ul>
        <!-- 用户管理 (带子菜单) -->
        <li class="menu-item" :class="{ 'has-submenu': true, 'active': activeMenu === 'user' }">
          <div class="menu-title" @click="toggleMenu('user')">
            <span>用户管理</span>
            <i class="arrow" :class="{ 'down': isMenuOpen('user') }"></i>
          </div>
          <transition name="slide">
            <ul class="submenu" v-show="isMenuOpen('user')">
              <li><router-link to="/user-mgmt">用户配置</router-link></li>
           <!--    <li><router-link to="/user-logs">用户日志</router-link></li>  -->
            </ul>
          </transition>
        </li>

        <!-- 文件管理 (带子菜单) -->
        <li class="menu-item" v-if="loadCompo?.includes('filemgmt')" :class="{ 'has-submenu': true, 'active': activeMenu === 'file' }">
          <div class="menu-title" @click="toggleMenu('file')">
            <span>文件管理</span>
            <i class="arrow" :class="{ 'down': isMenuOpen('file') }"></i>
          </div>
          <transition name="slide">
            <ul class="submenu" v-show="isMenuOpen('file')">
              <li  v-if="loadCompo?.includes('filemgmt')  && loadCompo?.includes('admin')" ><router-link to="/file-setting">文件配置</router-link></li>
              <li><router-link to="/file-list">文件列表</router-link></li>
              <li><router-link to="/collect-list">收藏夹</router-link></li>
              <li><router-link to="/shareLink-list">分享夹</router-link></li>
              <li  v-if="loadCompo?.includes('filemgmt')  && loadCompo?.includes('admin')" ><router-link to="/onlineFile-setting">OnlyOffice配置</router-link></li>
            </ul>
          </transition>
        </li>

        <li class="menu-item" v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')" >
          <router-link to="/file-sync-mgmt">文件同步</router-link>
        </li>

        <li class="menu-item" v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')" :class="{ 'has-submenu': true, 'active': activeMenu === 'server' }">
          <div class="menu-title" @click="toggleMenu('server')">
            <span>服务器管理</span>
            <i class="arrow" :class="{ 'down': isMenuOpen('server') }"></i>
          </div>
          <transition name="slide">
            <ul class="submenu" v-show="isMenuOpen('server')">
              <li  v-if="loadCompo?.includes('filemgmt')  && loadCompo?.includes('admin')" ><router-link to="/transfer-server">中转服务器</router-link></li>
              <li  v-if="loadCompo?.includes('filemgmt')  && loadCompo?.includes('admin')" ><router-link to="/distribution-server">分发服务器</router-link></li>
              <li  v-if="loadCompo?.includes('filemgmt')  && loadCompo?.includes('admin')" > <router-link to="/official-client">控制服务器</router-link></li>
            </ul>
          </transition>
        </li>

        <li class="menu-item"  v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')" >
          <router-link to="/server-mapping">端口映射</router-link>
        </li>

        <li class="menu-item" v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')" :class="{ 'has-submenu': true, 'active': activeMenu === 'p2p' }">
          <div class="menu-title" @click="toggleMenu('p2p')">
            <span>P2P管理</span>
            <i class="arrow" :class="{ 'down': isMenuOpen('p2p') }"></i>
          </div>
          <transition name="slide">
            <ul class="submenu" v-show="isMenuOpen('p2p')">
              <li v-if="loadCompo?.includes('filemgmt')  && loadCompo?.includes('admin')"><router-link to="/p2p-setting">P2P设置</router-link></li>
              <li v-if="loadCompo?.includes('filemgmt')  && loadCompo?.includes('admin')"><router-link to="/p2p-client">P2P客户端</router-link></li>
            </ul>
          </transition>
        </li>

        <li class="menu-item" v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')" :class="{ 'has-submenu': true, 'active': activeMenu === 'proxy' }">
          <div class="menu-title" @click="toggleMenu('proxy')">
            <span>代理管理</span>
            <i class="arrow" :class="{ 'down': isMenuOpen('proxy') }"></i>
          </div>
          <transition name="slide">
            <ul class="submenu" v-show="isMenuOpen('proxy')">
              <li v-if="loadCompo?.includes('filemgmt')  && loadCompo?.includes('admin')"><router-link to="/proxy-mgmt">正向代理</router-link></li>
              <li v-if="loadCompo?.includes('filemgmt')  && loadCompo?.includes('admin')"><router-link to="/reverse-proxy">反向代理</router-link></li>
            </ul>
          </transition>
        </li>


        <li class="menu-item" v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')" :class="{ 'has-submenu': true, 'active': activeMenu === 'ddns' }">
          <div class="menu-title" @click="toggleMenu('ddns')">
            <span>DDNS管理</span>
            <i class="arrow" :class="{ 'down': isMenuOpen('ddns') }"></i>
          </div>
          <transition name="slide">
            <ul class="submenu" v-show="isMenuOpen('ddns')">
              <li v-if="loadCompo?.includes('filemgmt')  && loadCompo?.includes('admin')" ><router-link to="/ddns-setting">DDNS设置</router-link></li>
              <li v-if="loadCompo?.includes('filemgmt')  && loadCompo?.includes('admin')" ><router-link to="/aliyun-ddns">阿里云DDNS</router-link></li>
              <li v-if="loadCompo?.includes('filemgmt')  && loadCompo?.includes('admin')" ><router-link to="/tencentcloud-ddns">腾讯云DDNS</router-link></li>
              <li v-if="loadCompo?.includes('filemgmt')  && loadCompo?.includes('admin')" ><router-link to="/pubyun-ddns">Pubyun DDNS</router-link></li>
              <li v-if="loadCompo?.includes('filemgmt')  && loadCompo?.includes('admin')" ><router-link to="/nameyun-ddns">NameCom DDNS</router-link></li>
              <li v-if="loadCompo?.includes('filemgmt')  && loadCompo?.includes('admin')" ><router-link to="/cloudflare-ddns">Cloudflare DDNS</router-link></li>
            </ul>
          </transition>
        </li>

        <!-- 其他单层菜单项 -->
        <li class="menu-item" v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')" >
          <router-link to="/mount-mgmt">挂载设置</router-link>
        </li>
        
        <li class="menu-item"  v-if="loadCompo?.includes('filemgmt')  && loadCompo?.includes('admin')" >
          <router-link to="/sys-setting">系统设置</router-link>
        </li>

        <li class="menu-item">
          <router-link to="/sys-about">关于</router-link>
        </li>

        <li class="menu-item" v-if="loadCompo?.includes('oldweb')" >
            <a href="#" @click.prevent="goToLegacyHome" class="old-page-link">旧版入口</a>
        </li>

        <!-- 其他菜单项... -->
      </ul>
    </nav>
    <div class="logout" @click="handleLogout">
      <span v-if="isLoggedIn">退出({{ username }})</span>
      <span v-else>未登录</span>
    </div>
  </aside>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import eventBus from '@/utils/eventBus'; // 导入事件总线
import { API_BASE_URL } from "@/config";
import { HOME_BASE_URL } from "@/config";

export default {
  name: 'AppSidebar',
  setup() {
    const activeMenu = ref('')
    const openMenus = ref([])
    const isLoggedIn = ref(false)
    const username = ref('')
    const productName = ref('tfcenter')
    const router = useRouter()
    const loadCompo = ref('')

    // 检查登录状态
    const checkLoginStatus = () => {
      // 这里可以根据实际情况从localStorage、cookie或vuex中获取登录状态
      const userInfo = localStorage.getItem('userInfo')
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo)
          isLoggedIn.value = true
          username.value = user.username || '未知用户'
          loadCompo.value = user.loadCompo || ''
          productName.value = user.productName || 'tfcenter'
        } catch (e) {
          console.error('解析用户信息失败', e)
          isLoggedIn.value = false
        }
      } else {
        isLoggedIn.value = false
      }
    }

    // 登出处理
    const handleLogout = () => {
      if (isLoggedIn.value) {
        fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          credentials: 'include', // 允许携带 Cookie（如 JWT）
        });

        // 清除用户信息
        localStorage.removeItem('userInfo')
        // 更新状态
        isLoggedIn.value = false
        username.value = ''
        
        // 跳转到登录页
        router.push('/user-login?auto=n')
      } else {
        // 未登录状态下点击，跳转到登录页
        router.push('/user-login?auto=n')
      }
    }

    const isMenuOpen = (menu) => {
      return openMenus.value.includes(menu)
    }

    const toggleMenu = (menu) => {
      if (isMenuOpen(menu)) {
        openMenus.value = openMenus.value.filter(m => m !== menu)
      } else {
        openMenus.value.push(menu)
      }
      activeMenu.value = menu
    }

    // 组件挂载时检查登录状态
    onMounted(() => {
      checkLoginStatus()

      // 监听登录事件
      eventBus.on('login', (user) => {
        if (user.username == undefined || user.username == '') {
          isLoggedIn.value = false
        } else {
          isLoggedIn.value = loadCompo
        }
        username.value = user.username;
        loadCompo.value = user.loadCompo
      });
    })

    return {
      activeMenu,
      isMenuOpen,
      toggleMenu,
      isLoggedIn,
      username,
      productName,
      loadCompo,
      handleLogout
    }
  },
  methods: {
    goToLegacyHome() {
      window.location.href = HOME_BASE_URL + '/home';
    }
  }
}


</script>

<style scoped>
.sidebar {
  position: fixed; /* 固定定位 */
  top: 0;
  left: 0;
  width: 220px;
  height: 100vh; /* 高度占满整个视口 */
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1000; /* 确保导航栏在最上层 */
  overflow-y: auto; /* 如果内容过长，允许导航栏自身滚动 */
}

.logo {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin: 0 15px 30px;
}

.logo-link {
  text-decoration: none;   /* 移除下划线 */
  color: #FFFFFF;         /* 使用Element UI的主色调蓝色 */
  font-weight: 600;       /* 中等加粗 */
  font-size: 1.2rem;      /* 稍大的字号 */
  letter-spacing: 1px;    /* 字间距微调 */
  transition: color 0.3s; /* 颜色过渡动画 */
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif; /* 中文字体优化 */
}

.logo-link:hover {
  color: #337ecc;         /* 悬停时加深蓝色 */
  text-decoration: none;  /* 确保悬停时也无下划线 */
}

.old-page-link {
  text-decoration: none;   /* 移除下划线 */
  color: #FFFFFF;         /* 使用Element UI的主色调蓝色 */
  font-size: 1rem;      /* 稍大的字号 */
  letter-spacing: 1px;    /* 字间距微调 */
  transition: color 0.3s; /* 颜色过渡动画 */
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif; /* 中文字体优化 */
}

.old-page-link:hover {
  color: #337ecc;         /* 悬停时加深蓝色 */
  text-decoration: none;  /* 确保悬停时也无下划线 */
}

nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-item {
  position: relative;
}

.menu-item a, .menu-title {
  color: #ecf0f1;
  text-decoration: none;
  display: block;
  padding: 12px 20px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.menu-item a:hover, .menu-title:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.menu-item a.router-link-exact-active {
  background-color: #3498db;
  color: white;
}

.has-submenu.active > .menu-title {
  background-color: rgba(255, 255, 255, 0.1);
}

.submenu {
  background-color: rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.submenu a {
  padding-left: 40px;
  font-size: 14px;
}

.arrow {
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid #ecf0f1;
  transition: transform 0.3s;
}

.arrow.down {
  transform: rotate(180deg);
}

.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from, .slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.slide-enter-to, .slide-leave-from {
  max-height: 200px;
  opacity: 1;
}

.logout {
  margin-top: auto;
  padding: 15px 20px 25px;
  cursor: pointer;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.logout:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>