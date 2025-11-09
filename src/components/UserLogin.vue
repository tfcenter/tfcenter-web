<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>用户登录</h2>
      </div>
      
      <el-form 
        ref="loginForm" 
        :model="loginForm" 
        :rules="loginRules" 
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名或邮箱"
            prefix-icon="el-icon-user"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="el-icon-lock"
            show-password
            clearable
          />
        </el-form-item>
        
        <!--
        <el-form-item prop="captcha" v-if="!autoLogin">
          <div class="captcha-input">
            <el-input
              v-model="loginForm.captcha"
              placeholder="请输入验证码"
              prefix-icon="el-icon-key"
              clearable
            />
            <div class="captcha-image" @click="refreshCaptcha">
              <img :src="captchaImage" alt="验证码">
            </div>
          </div>
        </el-form-item>
        -->
        
        <el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <div class="remember-options">
          <el-checkbox v-model="rememberMe" @change="handleRememberMeChange">记住密码</el-checkbox>
          <el-checkbox v-model="autoLogin" @change="handleAutoLoginChange">自动登录</el-checkbox>
        </div>
        <el-link type="primary" @click="showForgetDialog">忘记密码?</el-link>
      </div>
    </div>
  </div>
</template>

<script>
import CryptoJS from "crypto-js";
import { API_BASE_URL } from "@/config";
import { ElMessage } from 'element-plus';
import eventBus from '@/utils/eventBus'; // 导入事件总线

export default {
  name: 'LoginPage',
  data() {
    return {
      loginForm: {
        username: '',
        password: '',
        captcha: ''
      },
      loginRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
        ],
        captcha: [
          { required: true, trigger: 'blur' }
        ]
      },
      rememberMe: false,
      autoLogin: false,
      loading: false,
      captchaImage: '',
      captchaCode: '',
    }
  },
  created() {
    this.refreshCaptcha()
    // 从本地存储加载记住的用户名和密码
    const rememberUsername = localStorage.getItem('rememberUsername')
    const rememberPassword = localStorage.getItem('rememberPassword')
    const autoLoginFlag = localStorage.getItem('autoLogin') === 'true'
    
    if (rememberUsername) {
      this.loginForm.username = rememberUsername
      this.loginForm.password = rememberPassword
      this.rememberMe = true
      this.autoLogin = autoLoginFlag

      // 获取URL中的查询字符串
      const queryString = window.location.search; 
      const urlParams = new URLSearchParams(queryString); 
      const autoValue = urlParams.get('auto'); 
      if (autoValue != null && autoValue == "n") {  
        // 取消本次自动登陆
      } else {
        // 如果启用了自动登录，尝试自动登录
        if (this.autoLogin) {
          this.handleLogin("auto")
        }
      }
    }
    this.getCurrentUser()
  },
  methods: {
    generateCaptcha() {
      const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
      let code = ''
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      this.captchaCode = code
      
      const canvas = document.createElement('canvas')
      canvas.width = 100
      canvas.height = 40
      const ctx = canvas.getContext('2d')
      
      ctx.fillStyle = '#f5f7fa'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = this.getRandomColor()
        ctx.beginPath()
        ctx.moveTo(
          Math.random() * canvas.width,
          Math.random() * canvas.height
        )
        ctx.lineTo(
          Math.random() * canvas.width,
          Math.random() * canvas.height
        )
        ctx.stroke()
      }
      
      for (let i = 0; i < code.length; i++) {
        ctx.fillStyle = this.getRandomColor()
        ctx.font = '24px Arial'
        ctx.fillText(
          code[i],
          20 + i * 20,
          30
        )
      }
      
      this.captchaImage = canvas.toDataURL('image/png')
    },
    
    getRandomColor() {
      const r = Math.floor(Math.random() * 128) + 64
      const g = Math.floor(Math.random() * 128) + 64
      const b = Math.floor(Math.random() * 128) + 64
      return `rgb(${r}, ${g}, ${b})`
    },
    
    handleRememberMeChange(val) {
      if (val) {
        localStorage.setItem('rememberUsername', this.loginForm.username)
        localStorage.setItem('rememberPassword', this.loginForm.password)
      } else {
        localStorage.removeItem("rememberUsername")
        localStorage.removeItem("rememberPassword")
        // 取消记住密码时也取消自动登录
        this.autoLogin = false
        localStorage.removeItem("autoLogin")
      }
    },
    
    handleAutoLoginChange(val) {
      if (val) {
        // 启用自动登录时自动启用记住密码
        this.rememberMe = true
        localStorage.setItem('rememberUsername', this.loginForm.username)
        localStorage.setItem('rememberPassword', this.loginForm.password)
        localStorage.setItem('autoLogin', 'true')
      } else {
        localStorage.setItem('autoLogin', 'false')
      }
    },

    refreshCaptcha() {
      this.generateCaptcha()
      this.loginForm.captcha = ''
    },
    
    async getCurrentUser() {
      // 尝试获取用户信息
      try {
        const response = await fetch(`${API_BASE_URL}/get-currentUser`, {
          credentials: 'include'
        })
        const data = await response.json()
        if (data.errCode && data.errCode !== 0) {
          throw new Error(data.errMsg || '获取用户信息失败')
        } else {
          localStorage.setItem('userInfo', JSON.stringify({
            username: data.username,
            loadCompo: data.loadCompo,
            productName: data.productName
          }))
          eventBus.emit('login', { username: data.username, loadCompo: data.loadCompo, productName: data.productName });
        }
      } catch (error) {
        localStorage.removeItem('userInfo')
        eventBus.emit('login', { username: '' });
        console.error('获取用户信息2失败:', error)
      }
    },
    
    async handleLogin(status) {
      try {
        this.loading = true;

        // 验证表单
        if (this.loginForm.username == '') {
          ElMessage.error('用户名为空');
          return;
        }

        if (this.loginForm.password == '') {
          ElMessage.error('密码为空');
          return
        }

        // 自动登录时跳过验证码验证
        // if (!this.autoLogin && this.captchaCode.toLowerCase() != this.loginForm.captcha.toLowerCase()) {
        //   ElMessage.error('验证码错误');
        //   this.refreshCaptcha();
        //   return;
        // }

        const encryptedPassword = CryptoJS.MD5(this.loginForm.password).toString();

        // 保存记住密码和自动登录状态
        if (this.rememberMe) {
          localStorage.setItem('rememberUsername', this.loginForm.username)
          localStorage.setItem('rememberPassword', this.loginForm.password)
          localStorage.setItem('autoLogin', this.autoLogin ? 'true' : 'false')
        } else {
          localStorage.removeItem('rememberUsername')
          localStorage.removeItem('rememberPassword')
          localStorage.removeItem('autoLogin')
        }  

        const formData = new URLSearchParams();
        formData.append("username", this.loginForm.username);
        formData.append("password", encryptedPassword);
        formData.append("securePath", this.$route.params.id);

        const response = await fetch(`${API_BASE_URL}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
          credentials: "include",
        });

        const result = await response.json();
        
        // 处理响应
        if (result.errCode === 0) {
          this.getCurrentUser()

          const queryString = window.location.search;
          const urlParams = new URLSearchParams(queryString);

          if (status == "auto") {
            ElMessage.success('自动登陆成功')
          } else {
            ElMessage.success('登陆成功')
          }


          const loginPage = result.loginPage;
          let callback = urlParams.get('callback');
   
          if (result.isAdmin == false) {  // 判断为普通用户
            callback = "/file-list";
          } else {
            if (callback === undefined || callback === null) {
              if (loginPage == undefined || loginPage == '') {
                callback = "/sys-home"; 
              } else {
                callback = '/' + loginPage;
              }
            }
          }

          if (this.$route.path !== callback) {
            this.$router.push({ path: callback }); // 跳转callback
          }

        } else {
          // 自动登录失败时关闭自动登录选项
          if (this.autoLogin) {
            this.autoLogin = false
            localStorage.setItem('autoLogin', 'false')
          }
          
          ElMessage.error(result.errMsg || '登录失败')
          this.refreshCaptcha() // 登录失败刷新验证码
        }
      } catch (error) {
        console.error('登录错误:', error)
        if (error.response) {
          ElMessage.error(error.response.data.errMsg || `登录失败: ${error.response.status}`)
        } else if (error.request) {
          ElMessage.error('网络错误，请检查网络连接')
        } else {
          ElMessage.error('请求配置错误')
        }
        this.refreshCaptcha()
      } finally {
        this.loading = false
      }
    },
    
    showForgetDialog() {
      this.$alert('请联系系统管理员重置密码', '忘记密码', {
        confirmButtonText: '确定'
      })
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
  background-size: cover;
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 420px;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.login-header {
  margin-bottom: 25px;
  text-align: center;
}

.login-header h2 {
  color: #333;
  font-size: 24px;
  font-weight: 500;
}

.login-form {
  margin-bottom: 20px;
}

.el-form-item {
  margin-bottom: 22px;
}

.el-input {
  height: 42px;
  font-size: 14px;
}

.captcha-input {
  display: flex;
  gap: 10px;
}

.captcha-image {
  width: 100px;
  height: 40px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.captcha-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.login-btn {
  width: 100%;
  height: 42px;
  margin-top: 10px;
  font-size: 16px;
}

.login-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  font-size: 14px;
}

.remember-options {
  display: flex;
  gap: 15px;
}

.el-checkbox {
  color: #606266;
}

.el-link {
  font-size: 14px;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .login-box {
    padding: 25px 20px;
  }
  
  .captcha-input {
    flex-direction: column;
  }
  
  .captcha-image {
    width: 100%;
    margin-top: 10px;
  }
  
  .login-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .remember-options {
    flex-direction: column;
    gap: 5px;
  }
}
</style>