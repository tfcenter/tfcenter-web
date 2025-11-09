<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <h1>404</h1>
      <h2>页面未找到</h2>
      <p>您访问的页面不存在或已被移除</p>
      <div class="action-buttons">
        <router-link to="/sys-home" class="home-button">返回首页</router-link>
        <button @click="goBack" class="back-button">返回上一页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.go(-1) // 返回上一页
}
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
  text-align: center;
}

.not-found-content {
  max-width: 500px;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 5rem;
  margin: 0;
  color: #e74c3c;
}

h2 {
  font-size: 1.5rem;
  margin: 0.5rem 0;
  color: #333;
}

p {
  color: #666;
  margin-bottom: 2rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.home-button, .back-button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.home-button {
  background-color: #3498db;
  color: white;
  text-decoration: none;
  border: none;
}

.back-button {
  background-color: #ecf0f1;
  color: #333;
  border: 1px solid #ddd;
}

.home-button:hover {
  background-color: #2980b9;
}

.back-button:hover {
  background-color: #ddd;
}
</style>