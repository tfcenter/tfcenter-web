import { createRouter, createWebHistory } from 'vue-router'

import HomePage from '@/components/HomePage.vue'

import TransferServer from '@/components/TransferServer.vue'
import DistributionServer from '@/components/DistributionServer.vue'
import OfficialClient from '@/components/OfficialClient.vue'
import OfficialServer from '@/components/OfficialServer.vue'

import ServerMapping from '@/components/ServerMapping.vue'

import P2PClient from '@/components/P2PClient.vue'
import P2PSetting from '@/components/P2PSetting.vue'

import ProxyPage from '@/components/ProxyPage.vue'
import ReverseProxy from '@/components/ReverseProxy.vue'

import UserLogin from '@/components/UserLogin.vue'
import UserManagement from '@/components/UserManagement.vue'
import FileManagement from '@/components/FileManagement.vue'
import FileList from '@/components/FileList.vue'
import OnlineFileSetting from '@/components/OnlineFileSetting.vue'
import CollectList from '@/components/CollectPage.vue'
import ShareLinkList from '@/components/ShareLink.vue'

import MountMgmt from '@/components/MountMgmt.vue'

import DDNSSetting from '@/components/DDNSSetting.vue'
import AliyunDDNS from '@/components/AliyunDDns.vue'
import PubyunDDNS from '@/components/PubyunDDns.vue'
import NameyunDDNS from '@/components/NameyunDDns.vue'
import TencentCloudDDNS from '@/components/TencentCloudDDns.vue'
import CloudflareDDNS from '@/components/CloudflareDDns.vue'

import FileSync from '@/components/FileSync.vue'

import SettingPage from '@/components/SettingPage.vue'
import About from '@/components/About.vue'

const routes = [
    {
        path: '/',
        redirect: '/sys-home'
    },
    {
        path: '/sys-home',
        name: '主页',
        component: HomePage,
        meta: { title: '系统主页' }
    },
    {
        path: '/transfer-server',
        name: '中转服务器',
        component: TransferServer,
        meta: { title: '中转服务器' }
    },
    {
        path: '/distribution-server',
        name: '分发服务器',
        component: DistributionServer,
        meta: { title: '分发服务器' }
    },
    {
        path: '/official-client',
        name: '控制服务器',
        component: OfficialClient,
        meta: { title: '控制服务器' }
    },
    {
        path: '/official-server',
        name: '控制服务端',
        component: OfficialServer,
        meta: { title: '控制服务端' }
    },
    {
        path: '/server-mapping',
        name: '端口映射',
        component: ServerMapping,
        meta: { title: '端口映射' }
    },
    {
        path: '/p2p-setting',
        name: 'P2P设置',
        component: P2PSetting,
        meta: { title: 'P2P设置' }
    },
    {
        path: '/p2p-client',
        name: 'P2P客户端',
        component: P2PClient,
        meta: { title: 'P2P客户端' }
    },
    {
        path: '/user-login/:id(.*)*',
        name: '用户登陆',
        component: UserLogin,
        meta: { title: '用户登录' }
    },
    {
        path: '/user-mgmt',
        name: '用户设置',
        component: UserManagement,
        meta: { requiresAuth: true, title: '用户管理' }
    },
    {
        path: '/file-setting',
        name: '文件配置',
        component: FileManagement,
        meta: { requiresAuth: true, title: '文件配置' }
    },
    {
        path: '/file-list',
        name: '文件列表',
        component: FileList,
        meta: { requiresAuth: true, title: '文件列表' }
    },
    {
        path: '/collect-list',
        name: '收藏夹',
        component: CollectList,
        meta: { requiresAuth: true, title: '收藏夹' }
    },
    {
        path: '/shareLink-list',
        name: '分享夹',
        component: ShareLinkList,
        meta: { requiresAuth: true, title: '分享夹' }
    },
    {
        path: '/onlineFile-setting',
        name: '文件编辑设置',
        component: OnlineFileSetting,
        meta: { requiresAuth: true, title: '文件编辑设置' }
    },
    {
        path: '/mount-mgmt',
        name: '挂载设置',
        component: MountMgmt,
        meta: { requiresAuth: true, title: '挂载设置' }
    },
    {
        path: '/ddns-setting',
        name: 'DDNS全局设置',
        component: DDNSSetting,
        meta: { requiresAuth: true, title: 'DDNS全局设置' }
    },
    {
        path: '/aliyun-ddns',
        name: '阿里云DDNS设置',
        component: AliyunDDNS,
        meta: { requiresAuth: true, title: '阿里云DDNS设置' }
    },
    {
        path: '/pubyun-ddns',
        name: 'pubyun DDNS设置',
        component: PubyunDDNS,
        meta: { requiresAuth: true, title: 'pubyun DDNS设置' }
    },
    {
        path: '/nameyun-ddns',
        name: 'nameCom DDNS设置',
        component: NameyunDDNS,
        meta: { requiresAuth: true, title: 'nameCom DDNS设置' }
    },
    {
        path: '/tencentcloud-ddns',
        name: 'tencentcloud DDNS设置',
        component: TencentCloudDDNS,
        meta: { requiresAuth: true, title: 'tencentcloud DDNS设置' }
    },
    {
        path: '/cloudflare-ddns',
        name: 'cloudflare DDNS设置',
        component: CloudflareDDNS,
        meta: { requiresAuth: true, title: 'cloudflare DDNS设置' }
    },
    {
        path: '/proxy-mgmt',
        name: '正向代理',
        component: ProxyPage,
        meta: { requiresAuth: true, title: '正向代理' }
    },
    {
        path: '/reverse-proxy',
        name: '反向代理',
        component: ReverseProxy,
        meta: { requiresAuth: true, title: '反向代理' }
    },
    {
        path: '/file-sync-mgmt',
        name: '文件同步',
        component: FileSync,
        meta: { requiresAuth: true, title: '文件同步' }
    },
    {
        path: '/sys-setting',
        name: '设置',
        component: SettingPage,
        meta: { requiresAuth: true, title: '系统设置' }
    },
    {
        path: '/sys-about',
        name: '关于',
        component: About,
        meta: { title: '关于系统' }
    },
    {
        path: '/error',
        name: 'ErrorPage',
        component: () => import('@/components/ErrPage.vue'),
        meta: { title: '错误页面' }
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: {
            path: '/error',
            query: {
                message: '404页面不存在'
            }
        }
    }
    // // 可以添加一个404页面
    // {
    //     path: '/:pathMatch(.*)*',
    //     name: 'NotFound',
    //     component: () => import('@/components/NotFound.vue')
    // }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 可选：设置页面标题
router.beforeEach((to, from, next) => {
    document.title = to.meta.title || '默认标题'
    next()
})

export default router