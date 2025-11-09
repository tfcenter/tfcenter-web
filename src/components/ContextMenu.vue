<template>
  <div 
    v-if="visible"
    class="context-menu"
    :style="menuStyle"
    @click.stop="handleMenuClick"
  >
    <div 
      v-for="item in menuItems" 
      :key="item.label"
      class="menu-item"
      :class="{ 'disabled': item.disabled }"
      @click="handleClick(item)"
    >
      <span class="menu-icon">{{ item.icon }}</span>
      <span class="menu-label">{{ item.label }}</span>
      <span class="shortcut" v-if="item.shortcut">{{ item.shortcut }}</span>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    visible: Boolean,
    position: {
      type: Object,
      required: true,
      validator: (value) => ['x', 'y'].every(k => k in value) // 使用 k 作为参数
    },
    menuItems: {
      type: Array,
      default: () => []
    },
    selectedItem: {
      type: Object,
      default: null
    }
  },
  emits: ['command'],
  computed: {
    menuStyle() {
      const menuHeight = 400;
      const windowHeight = window.innerHeight;
      const shouldOpenUp = this.position.y > windowHeight - menuHeight;
      
      return {
        position: 'fixed',
        left: `${Math.min(this.position.x, window.innerWidth - 220)}px`, // 防止右侧溢出
        top: shouldOpenUp ? 'auto' : `${this.position.y}px`,
        bottom: shouldOpenUp ? `${windowHeight - this.position.y}px` : 'auto',
        'z-index': 9999
      };
    }
  },
  methods: {
    handleMenuClick(e) {
      e.stopPropagation(); // 阻止事件冒泡
      e.preventDefault(); // 阻止默认行为
    },
    handleClick(item) {
      if (item.disabled) return;
      this.$emit('command', item.command);
      this.$emit('close');
    }
  }
});
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 9999;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  min-width: 200px;
  padding: 5px 0;
  font-size: 13px;
}

.menu-item {
  padding: 6px 12px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.menu-item:hover {
  background-color: #f0f0f0;
}

.menu-item.disabled {
  color: #999;
  cursor: not-allowed;
}

.menu-icon {
  margin-right: 8px;
  width: 20px;
  text-align: center;
}

.menu-label {
  flex-grow: 1;
}

.shortcut {
  color: #999;
  font-size: 12px;
  margin-left: 20px;
}
</style>