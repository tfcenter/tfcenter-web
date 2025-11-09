<template>
  <div class="dialog-overlay">
    <div class="dialog">
      <h3>{{ isFile ? '新建文件' : '新建文件夹' }}</h3>
      <el-input 
        v-model="name" 
        @keyup.enter="handleConfirm"
        ref="inputRef"
        :placeholder="isFile ? '输入文件名（包含扩展名）' : '输入文件夹名称'"
      />
      <div class="dialog-buttons">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  props: {
    isFile: Boolean
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    const name = ref(props.isFile ? '新建文件.txt' : '新建文件夹');
    const inputRef = ref(null);
    
    onMounted(() => {
      inputRef.value.focus();
      // 选中名称部分（不含扩展名）
      if (props.isFile) {
        const dotIndex = name.value.lastIndexOf('.');
        if (dotIndex > 0) {
          inputRef.value.select(0, dotIndex);
        }
      } else {
        inputRef.value.select();
      }
    });
    
    const handleConfirm = () => {
      if (name.value.trim()) {
        emit('confirm', name.value);
      }
    };
    
    const handleCancel = () => {
      emit('cancel');
    };
    
    return {
      name,
      inputRef,
      handleConfirm,
      handleCancel
    };
  }
};
</script>

<style scoped>
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

.dialog {
  background: white;
  padding: 20px;
  border-radius: 5px;
  min-width: 300px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.dialog h3 {
  margin-top: 0;
  margin-bottom: 15px;
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
  gap: 10px;
}
</style>