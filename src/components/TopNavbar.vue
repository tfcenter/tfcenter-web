<template>
  <header class="navbar">
    <div class="logo"><a href="/" class="logo-link">{{ productName }}</a></div>
    
    <!-- 汉堡菜单按钮 (移动端显示) -->
    <button class="hamburger" @click="toggleMobileMenu" aria-label="Toggle menu">
      <span></span>
      <span></span>
      <span></span>
    </button>
    
    <nav :class="{ 'mobile-active': mobileMenuOpen }">
      <ul class="main-menu">

        <!-- 用户管理 (带下拉菜单) -->
        <li class="menu-item dropdown" 
            @mouseenter="isDesktop && openMenu('user')" 
            @mouseleave="isDesktop && closeMenu('user')"
            @click="!isDesktop && toggleMenu('user')">
          <span class="menu-title">
            用户管理
            <i class="arrow" :class="{ 'down': isMenuOpen('user') }"></i>
          </span>
          <transition name="fade">
            <ul class="submenu" v-show="isMenuOpen('user')">
              <li><router-link to="/user-mgmt" @click="closeMobileMenu">用户配置</router-link></li>
            </ul>
          </transition>
        </li>

        <!-- 文件管理 (带下拉菜单) -->
        <li class="menu-item dropdown" v-if="loadCompo?.includes('filemgmt')" 
            @mouseenter="isDesktop && openMenu('file')" 
            @mouseleave="isDesktop && closeMenu('file')"
            @click="!isDesktop && toggleMenu('file')">
          <span class="menu-title">
            文件管理
            <i class="arrow" :class="{ 'down': isMenuOpen('file') }"></i>
          </span>
          <transition name="fade">
            <ul class="submenu" v-show="isMenuOpen('file')">
              <li v-if="loadCompo?.includes('filemgmt')"><router-link to="/file-setting" @click="closeMobileMenu">文件配置</router-link></li>
              <li><router-link to="/file-list" @click="closeMobileMenu">文件列表</router-link></li>
              <li><router-link to="/collect-list">收藏夹</router-link></li>
              <li><router-link to="/shareLink-list">分享夹</router-link></li>
              <li v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')"><router-link to="/onlineFile-setting" @click="closeMobileMenu">OnlyOffice配置</router-link></li>
            </ul>
          </transition>
        </li>

        <li class="menu-item" v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')" >
          <router-link to="/file-sync-mgmt">文件同步</router-link>
        </li>

        <li class="menu-item dropdown" v-if="loadCompo?.includes('filemgmt')" 
            @mouseenter="isDesktop && openMenu('server')" 
            @mouseleave="isDesktop && closeMenu('server')"
            @click="!isDesktop && toggleMenu('server')">
          <span class="menu-title">
            服务器管理
            <i class="arrow" :class="{ 'down': isMenuOpen('server') }"></i>
          </span>
          <transition name="fade">
            <ul class="submenu" v-show="isMenuOpen('server')">
              <li v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')"><router-link to="/transfer-server" @click="closeMobileMenu">中转服务器</router-link></li>
              <li v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')"><router-link to="/distribution-server" @click="closeMobileMenu">分发服务器</router-link></li>
              <li v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')"><router-link to="/official-client" @click="closeMobileMenu">控制服务器</router-link></li>
            </ul>
          </transition>
        </li>

        <li class="menu-item" v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')">
          <router-link to="/server-mapping" @click="closeMobileMenu">端口映射</router-link>
        </li>

        <li class="menu-item dropdown"  v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')"
            @mouseenter="isDesktop && openMenu('p2p')" 
            @mouseleave="isDesktop && closeMenu('p2p')"
            @click="!isDesktop && toggleMenu('p2p')">
          <span class="menu-title">
            P2P管理
            <i class="arrow" :class="{ 'down': isMenuOpen('p2p') }"></i>
          </span>
          <transition name="fade">
            <ul class="submenu" v-show="isMenuOpen('p2p')">
              <li v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')"><router-link to="/p2p-setting" @click="closeMobileMenu">P2P设置</router-link></li>
              <li v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')"><router-link to="/p2p-client" @click="closeMobileMenu">P2P客户端</router-link></li>
            </ul>
          </transition>
        </li>

        <li class="menu-item dropdown" v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')"
            @mouseenter="isDesktop && openMenu('proxy')" 
            @mouseleave="isDesktop && closeMenu('proxy')"
            @click="!isDesktop && toggleMenu('proxy')">
          <span class="menu-title">
            代理设置
            <i class="arrow" :class="{ 'down': isMenuOpen('proxy') }"></i>
          </span>
          <transition name="fade">
            <ul class="submenu" v-show="isMenuOpen('proxy')">
              <li v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')"><router-link to="/proxy-mgmt" @click="closeMobileMenu">正向代理</router-link></li>
              <li v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')"><router-link to="/reverse-proxy" @click="closeMobileMenu">反向代理</router-link></li>
            </ul>
          </transition>
        </li>

        <li class="menu-item dropdown" v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')" 
            @mouseenter="isDesktop && openMenu('ddns')" 
            @mouseleave="isDesktop && closeMenu('ddns')"
            @click="!isDesktop && toggleMenu('ddns')">
          <span class="menu-title">
            DDNS管理
            <i class="arrow" :class="{ 'down': isMenuOpen('ddns') }"></i>
          </span>
          <transition name="fade">
            <ul class="submenu" v-show="isMenuOpen('ddns')">
              <li v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')"><router-link to="/ddns-setting">DDNS设置</router-link></li>
              <li v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')"><router-link to="/aliyun-ddns">阿里云DDNS</router-link></li>
              <li v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')"><router-link to="/tencentcloud-ddns">腾讯云DDNS</router-link></li>
              <li v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')"><router-link to="/pubyun-ddns">Pubyun DDNS</router-link></li>
              <li v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')"><router-link to="/nameyun-ddns">NameCom DDNS</router-link></li>
              <li v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')"><router-link to="/cloudflare-ddns">Cloudflare DDNS</router-link></li>
            </ul>
          </transition>
        </li>

        <!-- 其他菜单项 -->
        <li class="menu-item" v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')">
          <router-link to="/mount-mgmt" @click="closeMobileMenu">挂载设置</router-link>
        </li>
        
        <li class="menu-item" v-if="loadCompo?.includes('filemgmt') && loadCompo?.includes('admin')">
          <router-link to="/sys-setting" @click="closeMobileMenu">系统设置</router-link>
        </li>
        
        <li class="menu-item">
          <router-link to="/sys-about" @click="closeMobileMenu">关于</router-link>
        </li>

        <li class="menu-item" v-if="loadCompo?.includes('oldweb')">
          <a href="#" @click.prevent="goToLegacyHome" class="old-page-link">旧版入口</a>
        </li>

      </ul>
      
      <div class="logout" @click="handleLogout">
        <span v-if="isLoggedIn">退出({{ username }})</span>
        <span v-else>未登录</span>
      </div>
    </nav>

  </header>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import eventBus from '@/utils/eventBus';
import { API_BASE_URL } from "@/config";
import { HOME_BASE_URL } from "@/config";

export default {
  name: 'AppSidebar',
  setup() {
    const activeMenu = ref('')
    const openMenus = ref([])
    const isLoggedIn = ref(false)
    const username = ref('')
    const router = useRouter()
    const loadCompo = ref('')
    const productName = ref('tfcenter')
    const mobileMenuOpen = ref(false)
    const isDesktop = ref(window.innerWidth > 768)
    
    // 检查窗口大小并更新isDesktop
    const checkScreenSize = () => {
      isDesktop.value = window.innerWidth > 768
      if (isDesktop.value) {
        mobileMenuOpen.value = false
      }
    }

    // 检查登录状态
    const checkLoginStatus = () => {
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
          credentials: 'include',
        })

        localStorage.removeItem('userInfo')
        isLoggedIn.value = false
        username.value = ''
        closeMobileMenu()
        router.push('/user-login?auto=n')
      } else {
        closeMobileMenu()
        router.push('/user-login?auto=n')
      }
    }

    const isMenuOpen = (menu) => openMenus.value.includes(menu)
    const openMenu = (menu) => {
      if (!openMenus.value.includes(menu)) {
        openMenus.value.push(menu)
      }
    }
    const closeMenu = (menu) => {
      openMenus.value = openMenus.value.filter(m => m !== menu)
    }
    const toggleMenu = (menu) => {
      if (isMenuOpen(menu)) {
        closeMenu(menu)
      } else {
        openMenu(menu)
      }
    }
    
    const toggleMobileMenu = () => {
      mobileMenuOpen.value = !mobileMenuOpen.value
    }
    
    const closeMobileMenu = () => {
      if (!isDesktop.value) {
        mobileMenuOpen.value = false
      }
    }

    // 组件挂载时检查登录状态和窗口大小
    onMounted(() => {
      checkLoginStatus()
      checkScreenSize()
      window.addEventListener('resize', checkScreenSize)

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
    
    // 组件卸载前移除事件监听
    onBeforeUnmount(() => {
      window.removeEventListener('resize', checkScreenSize)
    })

    return {
      activeMenu,
      isMenuOpen,
      openMenu, 
      closeMenu,
      toggleMenu,
      isLoggedIn,
      username,
      productName,
      loadCompo,
      handleLogout,
      mobileMenuOpen,
      toggleMobileMenu,
      closeMobileMenu,
      isDesktop
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
/* 修改导航栏的布局 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

/* 只在移动端添加 space-between */
@media (max-width: 768px) {
  .navbar {
    justify-content: space-between;
  }
}

.logo {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin: 5px 10px 10px 10px;
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
  text-decoration: none;
  color: #FFFFFF;
  font-size: 1rem;
  letter-spacing: 1px;
  transition: color 0.3s;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
}

.old-page-link:hover {
  color: #337ecc;
  text-decoration: none;
}

/* 汉堡菜单样式 */
.hamburger {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  margin-right:15px;
  padding: 10px;
  z-index: 1001;
}

.hamburger span {
  display: block;
  width: 25px;
  height: 3px;
  background: white;
  margin: 5px 0;
  transition: all 0.3s ease;
}

/* 导航菜单样式 */
nav {
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.main-menu {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  height: 100%;
}

.menu-item {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
}

.menu-item a, .menu-title {
  color: #ecf0f1;
  text-decoration: none;
  padding: 0 15px;
  height: 100%;
  display: flex;
  align-items: center;
  transition: background-color 0.3s;
  cursor: pointer;
}

.menu-item a:hover, .menu-title:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.menu-item a.router-link-exact-active {
  background-color: #3498db;
}

.dropdown:hover .submenu {
  display: block;
}

.submenu {
  position: absolute;
  top: 60px;
  left: 0;
  background: #2c3e50;
  min-width: 180px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  border-radius: 0 0 4px 4px;
  overflow: hidden;
  z-index: 1000;
}

.submenu a {
  padding: 10px 15px;
  display: block;
}

.submenu a:hover {
  background-color: #3498db;
}

.arrow {
  display: inline-block;
  margin-left: 5px;
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

.logout {
  margin-left: 30px;
  display: flex;
  cursor: pointer;
  align-items: center;
  gap: 15px;
  color: #ecf0f1;
  padding: 0 15px;
}

.logout:hover {
  color: #3498db;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 移动端样式 */
@media (max-width: 768px) {
  .hamburger {
    display: block;
  }
  
  nav {
    position: fixed;
    top: 60px;
    left: 0;
    width: 100%;
    background: #2c3e50;
    flex-direction: column;
    align-items: flex-start;
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
  }
  
  nav.mobile-active {
    max-height: 100vh;
    overflow-y: auto;
  }
  
  .main-menu {
    flex-direction: column;
    width: 100%;
    height: auto;
  }
  
  .menu-item {
    width: 100%;
    height: auto;
    flex-direction: column;
    align-items: flex-start;
  }
  
  .menu-item a, .menu-title {
    width: 100%;
    padding: 15px 20px;
  }
  
  .submenu {
    position: static;
    width: 100%;
    box-shadow: none;
    display: none;
  }
  
  .submenu a {
    padding-left: 30px;
  }
  
  .logout {
    width: 100%;
    margin: 0;
    padding: 15px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  /* 汉堡菜单动画 */
  .mobile-active + .hamburger span:nth-child(1) {
    transform: translateY(8px) rotate(45deg);
  }
  
  .mobile-active + .hamburger span:nth-child(2) {
    opacity: 0;
  }
  
  .mobile-active + .hamburger span:nth-child(3) {
    transform: translateY(-8px) rotate(-45deg);
  }
}
</style>