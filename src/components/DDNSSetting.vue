<template>
  <div class="basic-settings-container">

    <div class="container">
      <div class="settings-card">
        <div class="card-header">
          <h3 class="card-title">基础设置</h3>
        </div>
        <div class="card-body">
          <el-table :data="[settingsData]" border style="width: 100%">
            <el-table-column prop="checkIPTime" label="公网地址检测周期(秒)" width="180">
              <template #default="{ row }">
                <span>{{ row.checkIPTime }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="row.switch ? 'success' : 'danger'">
                  {{ row.switch ? '运行中' : '已停止' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作">
              <template #default="{ row }">
                <el-button 
                  v-if="row.switch" 
                  type="warning" 
                  size="small"
                  @click="stopDnStatus"
                >
                  停止
                </el-button>
                <el-button 
                  v-else 
                  type="success" 
                  size="small"
                  @click="startDnStatus(row)"
                >
                  启动
                </el-button>
                <el-button 
                  v-if="!row.switch" 
                  type="primary" 
                  size="small"
                  @click="showEditDialog"
                >
                  更新
                </el-button>

              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <!-- 编辑设置对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="修改检测周期"
      width="500px"
    >
      <el-form :model="editForm" :rules="formRules" ref="editFormRef">
        <el-form-item label="公网地址检测周期(秒)" prop="checkIPTime">
          <el-input 
            v-model.number="editForm.checkIPTime" 
            type="number"
            placeholder="请输入1-99999之间的整数"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="updateDnStatus">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { API_BASE_URL } from "@/config"

export default {
  name: 'BasicSettings',
  setup() {
    // 数据状态
    const settingsData = ref({
      switch: false,
      checkIPTime: 60
    })
    
    // 编辑表单
    const editForm = ref({
      checkIPTime: 60
    })
    
    const editFormRef = ref(null)
    const editDialogVisible = ref(false)
    
    // 表单验证规则
    const formRules = {
      checkIPTime: [
        { required: true, message: '请输入检测周期', trigger: 'blur' },
        { type: 'number', min: 1, max: 99999, message: '请输入1-99999之间的整数', trigger: 'blur' }
      ]
    }
    
    // 获取DNS状态
    const fetchDnsStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/get-dns-status`, {
          method: 'GET',
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error('获取数据失败')
        }
        
        const result = await response.json()
        
        if (result.errCode === 1000) {
          ElMessage.error('请先登录系统')
          return
        }

        if (result.errCode != 0) {
          ElMessage.error(result.errMsg)
          return
        }
        
        settingsData.value = {
          switch: result.data.switch,
          checkIPTime: result.data.checkIPTime
        }
        
      } catch (error) {
        ElMessage.error(error.message || '获取设置失败')
      }
    }
    
    // 显示编辑对话框
    const showEditDialog = () => {
      editForm.value = {
        checkIPTime: settingsData.value.checkIPTime
      }
      editDialogVisible.value = true
    }
    
    // 更新DNS配置（不启动服务）
    const updateDnStatus = async () => {
      try {
        await editFormRef.value.validate()
        
        const params = new URLSearchParams()
        params.append('checkIPTime', editForm.value.checkIPTime)
        
        const response = await fetch(`${API_BASE_URL}/update-dns-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        })
        
        if (!response.ok) {
          throw new Error('更新失败')
        }
        
        const data = await response.json()
        ElMessage.success(data.errMsg || '更新成功')
        editDialogVisible.value = false
        fetchDnsStatus()
      } catch (error) {
        ElMessage.error(error.message || '更新失败')
      }
    }
    
    // 启动DNS服务
    const startDnStatus = async (row) => {
      try {
        await ElMessageBox.confirm('确定要启动检测服务吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        const params = new URLSearchParams()
        params.append('checkIPTime', row.checkIPTime)
        
        const response = await fetch(`${API_BASE_URL}/update-dns-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: params
        })
        
        if (!response.ok) {
          throw new Error('启动失败')
        }
        
        const data = await response.json()
        ElMessage.success(data.errMsg || '检测服务已启动')
        fetchDnsStatus()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error(error.message || '启动失败')
        }
      }
    }
    
    // 停止DNS服务
    const stopDnStatus = async () => {
      try {
        await ElMessageBox.confirm('确定要停止检测服务吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        const response = await fetch(`${API_BASE_URL}/stop-dns-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: ''
        })
        
        if (!response.ok) {
          throw new Error('停止失败')
        }
        
        const data = await response.json()
        ElMessage.success(data.errMsg || '检测服务已停止')
        fetchDnsStatus()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error(error.message || '停止失败')
        }
      }
    }
    
    // 初始化
    onMounted(() => {
      fetchDnsStatus()
    })
    
    return {
      settingsData,
      editForm,
      editFormRef,
      editDialogVisible,
      formRules,
      showEditDialog,
      updateDnStatus,
      startDnStatus,
      stopDnStatus
    }
  }
}
</script>

<style scoped lang="scss">
.basic-settings-container {
  padding: 20px;
  min-height: 100vh;
}

.top-nav {
  height: 60px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  
  .nav-container {
    display: flex;
    align-items: center;
    height: 100%;
    max-width: 100%;
    margin: 0 auto;
    padding: 0 20px;
    
    .nav-title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }
}

.settings-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-top: 20px;
  
  .card-header {
    padding: 20px;
    border-bottom: 1px solid #ebeef5;
    
    .card-title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }
  }
  
  .card-body {
    padding: 20px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>