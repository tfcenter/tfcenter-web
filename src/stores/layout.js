import { defineStore } from 'pinia'

export const useLayoutStore = defineStore('layout', {
    state: () => ({
        navPosition: localStorage.getItem('navPosition') || 'left',
        isMobile: window.innerWidth <= 768
    }),
    actions: {
        setNavPosition(position) {
            if (this.isMobile) return // 移动端禁止切换
            this.navPosition = position
            localStorage.setItem('navPosition', position)
        },
        checkMobile() {
            this.isMobile = window.innerWidth <= 768
            if (this.isMobile) {
                this.navPosition = 'top' // 移动端强制顶部导航
            }
        }
    },
    getters: {
        effectivePosition: (state) => {
            return state.isMobile ? 'top' : state.navPosition
        }
    }
})