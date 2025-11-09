<template>
  <div class="user-management">
    <div class="header">
      <h2>用户管理</h2>
      <div class="actions">
        <button class="btn-add" @click="addUserDialogVisible = true" v-show="isAdmin">
          新增用户
        </button>
        <button class="btn-refresh" @click="toggleAutoRefresh">刷新数据</button>
      </div>
    </div>
    
    <!-- 新增用户对话框 -->
    <el-dialog
      v-model="addUserDialogVisible"
      title="新增用户"
      width="500px"
      @closed="resetAddUserForm"
    >
      <el-form
        ref="addUserFormRef"
        :model="addUserForm"
        :rules="addUserRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="addUserForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="addUserForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="addUserForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="addUserForm.role" placeholder="请选择角色">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="addUserForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="addUserForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="addUserForm.telephone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="addUserForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addUserDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="submitAddUser"
            :loading="addUserLoading"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 新增：修改超级管理员用户名对话框 -->
    <el-dialog
      v-model="renameSuperDialogVisible"
      title="修改超级管理员用户名"
      width="500px"
      @closed="resetRenameForm"
    >
      <el-form
        ref="renameFormRef"
        :model="renameForm"
        :rules="renameRules"
        label-width="120px"
      >
        <el-form-item label="当前用户名">
          <el-input v-model="renameForm.currentUsername" disabled />
        </el-form-item>
        <el-form-item label="新用户名" prop="newUsername">
          <el-input 
            v-model="renameForm.newUsername" 
            placeholder="请输入新用户名"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renameSuperDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="submitRenameSuperUser"
          :loading="renaming"
        >
          确认修改
        </el-button>
      </template>
    </el-dialog>

     <!-- 编辑用户对话框 -->
    <el-dialog
      v-model="editUserDialogVisible"
      title="编辑用户"
      width="500px"
      @closed="resetEditUserForm"
    >
      <el-form
        ref="editUserFormRef"
        :model="editUserForm"
        :rules="editUserRules"
        label-width="100px"
      >
        <el-form-item label="用户名">
          <el-input v-model="editUserForm.username" disabled />
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="editUserForm.password"
            type="password"
            placeholder="留空表示不修改密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="editUserForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="editUserForm.role" placeholder="请选择角色" :disabled="editUserForm.isSuperAdmin || !isAdmin">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="editUserForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editUserForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="editUserForm.telephone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="editUserForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editUserDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="submitEditUser"
            :loading="editUserLoading"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <div class="table-container">
      <table class="user-table">
        <thead>
          <tr>
            <th>用户名</th>
            <th>角色</th>
            <th>昵称</th>
            <th>邮箱</th>
            <th>号码</th>
            <th>状态</th>
            <th>最后登录</th>
            <th>注册时间</th>
            <th>备注</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.Username">
            <td data-label="用户名">{{ user.Username }}</td>
            <td data-label="角色">
                <span class="role-tag" :class="{
                  'super-admin': user.IsSuperAdmin,
                  'admin': !user.IsSuperAdmin && user.IsAdmin,
                  'user': !user.IsAdmin
                }">
                  {{ user.Role || '普通用户' }}
                </span>
            </td>
            <td data-label="昵称">{{ user.Nickname || '-' }}</td>
            <td data-label="邮箱">{{ user.Email || '-' }}</td>
            <td data-label="号码">{{ user.Telephone || '-' }}</td>
            <td data-label="状态">
              <span class="status-badge" :class="{'active': user.RoleStatus === '激活', 'inactive': user.RoleStatus !== '激活'}">
                {{ user.RoleStatus || '激活' }}
              </span>
            </td>
            <td data-label="最后登陆">{{ formatDateTime(user.LoginTime) }}</td>
            <td data-label="注册时间">{{ formatDateTime(user.CreateTime) }}</td>
            <td data-label="备注" class="note-cell">{{ user.Remark || '-' }}</td>
            <td class="action-cell">
              <button v-if="!user.IsSuperAdmin && isAdmin" class="btn-delete" @click="deleteUser(user.Username)">删除</button>
              <button v-if="user.IsSuperAdmin" class="btn-edit" @click="changeSuperName(user.Username)">改用户名</button>
              <button class="btn-edit" @click="openEditDialog(user)">编辑</button>
              <button 
                v-if="!user.IsSuperAdmin && isAdmin" 
                :class="(user.RoleStatus === '激活' || !user.RoleStatus) ? 'btn-deactivate' : 'btn-activate'" 
                @click="toggleUserStatus(user)"
              >
                {{ (user.RoleStatus === '激活' || !user.RoleStatus) ? '停用' : '激活' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import CryptoJS from "crypto-js";
import { API_BASE_URL } from '@/config';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  data() {
      // 验证确认密码是否与密码一致
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== this.addUserForm.password) {
        callback(new Error('两次输入的密码不一致'));
      } else {
        callback();
      }
    };

    // 验证确认密码是否与密码一致（编辑时可为空）
    const validateEditConfirmPassword = (rule, value, callback) => {
      if (this.editUserForm.password && value !== this.editUserForm.password) {
        callback(new Error('两次输入的密码不一致'));
      } else {
        callback();
      }
    };

    // 新用户名验证规则
    const validateNewUsername = (rule, value, callback) => {
      if (!value) {
        return callback(new Error('请输入新用户名'));
      }
      if (value === this.renameForm.currentUsername) {
        return callback(new Error('新用户名不能与原用户名相同'));
      }
      if (value.length < 3 || value.length > 20) {
        return callback(new Error('用户名长度需在3-20个字符之间'));
      }
      callback();
    };

    return {
      // 新增用户对话框相关数据
      addUserDialogVisible: false,
      addUserLoading: false,
      addUserForm: {
        username: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        nickname: '',
        email: '',
        telephone: '',
        remark: ''
      },
      addUserRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请确认密码', trigger: 'blur' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ],
        role: [
          { required: true, message: '请选择角色', trigger: 'change' }
        ]
      },

      // 编辑用户对话框相关数据
      editUserDialogVisible: false,
      editUserLoading: false,
      editUserForm: {
        username: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        nickname: '',
        email: '',
        telephone: '',
        remark: '',
        isSuperAdmin: false
      },
      editUserRules: {
        password: [
          { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
        ],
        confirmPassword: [
          { validator: validateEditConfirmPassword, trigger: 'blur' }
        ],
        role: [
          { required: true, message: '请选择角色', trigger: 'change' }
        ]
      },
      // 新增：超级管理员重命名相关数据
      renameSuperDialogVisible: false,
      renaming: false,
      renameForm: {
        currentUsername: '',
        newUsername: ''
      },
      renameRules: {
        newUsername: [
          { validator: validateNewUsername, trigger: 'blur' }
        ]
      },
      isAdmin: false,
      users: [],
      loading: false
    }
  },
  created() {
    this.fetchUserData();
  },
  methods: {
    // 刷新数据
    async toggleAutoRefresh() {
      this.fetchUserData()
      ElMessage.success("刷新成功")
    },
    async fetchUserData() {
      this.loading = true;
      try {
        const response = await fetch(`${API_BASE_URL}/list-userInfo`, {
          credentials: 'include' // 确保携带cookie
        });
        
        const data = await response.json();
        
        if (data.errCode === 1000) {
          // 未登录状态，跳转到登录页
          ElMessage.warning('请先登录');
          this.$router.push('/user-login?callback=user-mgmt');
          return;
        }
        
        if (data.errCode !== 0) {
          throw new Error(data.errMsg || '获取用户数据失败');
        }
        
        this.isAdmin = data.isAdmin; // 当前用户角色

        // 处理API返回的用户数据
        this.users = data.user.map(user => ({
          ...user,
          RoleStatus: user.RoleStatus || '激活' // 默认状态为激活
        }));
        
      } catch (error) {
        console.error('获取用户数据失败:', error);
        ElMessage.error(error.message || '获取用户数据失败');
      } finally {
        this.loading = false;
      }
    },
    formatDateTime(datetime) {
      if (!datetime || datetime === '1970-01-01 08:00') return '-';
      return datetime.replace(' ', '  ');
    },
    formatDate(date) {
      if (!date || date === '1970-01-01 08:00') return '-';
      return date.split(' ')[0];
    },
    // 提交新增用户表单
    async submitAddUser() {
      try {
        this.addUserLoading = true;
        
        // 验证表单
        await this.$refs.addUserFormRef.validate();
        
        // 准备表单数据
        const formData = new URLSearchParams();
        formData.append('username', this.addUserForm.username);

        const encryptedPassword = CryptoJS.MD5(this.addUserForm.password).toString();
        formData.append('password', encryptedPassword);

        if (this.addUserForm.role == 'admin') {
          formData.append('isAdmin', 'yes');
        }
        formData.append('nickname', this.addUserForm.nickname);
        formData.append('email', this.addUserForm.email);
        formData.append('telephone', this.addUserForm.telephone);
        formData.append('remark', this.addUserForm.remark);
        
        // 调用API添加用户
        const response = await fetch(`${API_BASE_URL}/add-userInfo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
          credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.errCode !== 0) {
          throw new Error(result.errMsg || '添加用户失败');
        }
        
        ElMessage.success('添加用户成功');
        this.addUserDialogVisible = false;
        this.fetchUserData(); // 刷新用户列表
      } catch (error) {
        console.error('添加用户失败:', error);
        ElMessage.error(error.message || '添加用户失败');
      } finally {
        this.addUserLoading = false;
      }
    },
    // 重置新增用户表单
    resetAddUserForm() {
      this.$refs.addUserFormRef?.resetFields();
    },
    // 打开编辑对话框
    openEditDialog(user) {
      this.editUserForm = {
        username: user.Username,
        password: '',
        confirmPassword: '',
        role: user.IsAdmin ? 'admin' : 'user',
        nickname: user.Nickname || '',
        email: user.Email || '',
        telephone: user.Telephone || '',
        remark: user.Remark || '',
        isSuperAdmin: user.IsSuperAdmin
      };
      this.editUserDialogVisible = true;
    },
    // 提交编辑用户表单
    async submitEditUser() {
      try {
        this.editUserLoading = true;
        
        // 验证表单
        await this.$refs.editUserFormRef.validate();
        
        // 准备表单数据
        const formData = new URLSearchParams();
        formData.append('username', this.editUserForm.username);
        
        // 只有密码不为空时才添加密码字段
        if (this.editUserForm.password) {
          const encryptedPassword = CryptoJS.MD5(this.editUserForm.password).toString();
          formData.append('password', encryptedPassword);
        }
        
        // 超级管理员角色不可修改
        if (!this.editUserForm.isSuperAdmin) {
           if (this.editUserForm.role == 'admin') {
            formData.append('isAdmin', 'yes');
          }
        }
        
        formData.append('nickname', this.editUserForm.nickname);
        formData.append('email', this.editUserForm.email);
        formData.append('telephone', this.editUserForm.telephone);
        formData.append('remark', this.editUserForm.remark);
        
        // 调用API更新用户信息
        const response = await fetch(`${API_BASE_URL}/update-userInfo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
          credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.errCode !== 0) {
          throw new Error(result.errMsg || '更新用户信息失败');
        }
        
        ElMessage.success('用户信息更新成功');
        this.editUserDialogVisible = false;
        this.fetchUserData(); // 刷新用户列表
      } catch (error) {
        console.error('更新用户信息失败:', error);
        ElMessage.error(error.message || '更新用户信息失败');
      } finally {
        this.editUserLoading = false;
      }
    },
    
    // 重置编辑用户表单
    resetEditUserForm() {
      this.$refs.editUserFormRef?.resetFields();
    },
    async toggleUserStatus(user) {
      try {
        // 请求POST接口
        const formData = new URLSearchParams();
        formData.append('username', user.Username);

        if (user.RoleStatus === '激活') {
          // 调用API更新用户信息
          const response = await fetch(`${API_BASE_URL}/disable-userInfo`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
            credentials: 'include'
          });
          
          const result = await response.json();
          if (result.errCode !== 0) {
            throw new Error(result.errMsg || '停用用户失败');
          }
          
          ElMessage.success(`已停用用户 ${user.Username}`);
          this.fetchUserData(); // 刷新用户列表
        } else {
          const response = await fetch(`${API_BASE_URL}/enable-userInfo`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
            credentials: 'include'
          });
          
          const result = await response.json();
          if (result.errCode !== 0) {
            throw new Error(result.errMsg || '激活用户失败');
          }
          
          ElMessage.success(`已激活用户 ${user.Username}`);
          this.fetchUserData(); // 刷新用户列表
        }


        // const newStatus = (user.RoleStatus === '激活' || !user.RoleStatus) ? '停用' : '激活';
        // 模拟API调用成功
        // user.RoleStatus = newStatus;
        // ElMessage.success(`已${newStatus === '激活' ? '启用' : '停用'}用户 ${user.Username}`);
      } catch (error) {
        console.error('更新用户状态失败:', error);
        ElMessage.error(error.message || '更新用户状态失败');
      }
    },
    
    
changeSuperName(username) {
      this.renameForm.currentUsername = username;
      this.renameForm.newUsername = '';
      this.renameSuperDialogVisible = true;
    },
    
    // 新增：提交超级管理员用户名修改
    async submitRenameSuperUser() {
      try {
        await this.$refs.renameFormRef.validate();
        this.renaming = true;
        
        const formData = new URLSearchParams();
        formData.append('username', this.renameForm.newUsername);

        const response = await fetch(`${API_BASE_URL}/update-superUser`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData,
          credentials: 'include'
        });

        const result = await response.json();
        
        if (result.errCode !== 0) {
          throw new Error(result.errMsg || '更新用户名失败');
        }
        
        ElMessage.success('用户名修改成功，请重新登录');
        
        // 执行登出
        await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          credentials: 'include',
        });
        
        // 清除用户信息
        localStorage.removeItem('userInfo');
        this.renameSuperDialogVisible = false;
        
        // 跳转到登录页
        this.$router.push('/user-login?callback=user-mgmt');
        
      } catch (error) {
        console.error('修改用户名失败:', error);
        ElMessage.error(error.message || '修改用户名失败');
      } finally {
        this.renaming = false;
      }
    },
    
    // 新增：重置重命名表单
    resetRenameForm() {
      this.$refs.renameFormRef?.resetFields();
    },

    // 删除用户方法
    async deleteUser(username) {
      try {
        // 二次确认弹窗
        await ElMessageBox.confirm(
          `确定要删除用户 "${username}" 吗？此操作不可撤销！`,
          '警告',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
            center: true,
            beforeClose: async (action, instance, done) => {
              if (action === 'confirm') {
                instance.confirmButtonLoading = true;
                try {
                  // 调用删除API
                  const response = await fetch(
                    `${API_BASE_URL}/delete-userInfo?name=${encodeURIComponent(username)}`,
                    {
                      method: 'DELETE',
                      credentials: 'include'
                    }
                  );
                  
                  const result = await response.json();
                  
                  if (result.errCode !== 0) {
                    throw new Error(result.errMsg || '删除用户失败');
                  }
                  
                  ElMessage.success('用户删除成功');
                  this.fetchUserData(); // 刷新用户列表
                  done();
                } catch (error) {
                  console.error('删除用户失败:', error);
                  ElMessage.error(error.message || '删除用户失败');
                  instance.confirmButtonLoading = false;
                }
              } else {
                done();
              }
            }
          }
        );
      } catch (error) {
        // 用户点击取消或关闭弹窗
        if (error !== 'cancel' && error !== 'close') {
          console.error('删除操作异常:', error);
        }
      }
    }
  }
}
</script>

<style scoped>
/* 原有的样式保持不变 */
.user-management {
  background-color: #ffffff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h2 {
  color: #303133;
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.table-container {
  overflow-x: auto;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.user-table th, .user-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  text-align: left;
}

.user-table th {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 500;
}

.user-table tbody tr:hover {
  background-color: #f5f7fa;
}

/* 按钮样式 */
button {
  padding: 6px 12px;
  margin: 0 4px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.btn-add {
  background-color: #67c23a;
  color: white;
}

.btn-add:hover {
  background-color: #5daf34;
}

.btn-refresh {
  background-color: #909399;
  color: white;
}

.btn-refresh:hover {
  background-color: #82848a;
}

.btn-edit {
  background-color: #409eff;
  color: white;
}

.btn-edit:hover {
  background-color: #3a8ee6;
}

.btn-delete {
  background-color: #f56c6c;
  color: white;
}

.btn-delete:hover {
  background-color: #e05e5e;
}

.btn-activate {
  background-color: #67c23a;
  color: white;
}

.btn-activate:hover {
  background-color: #5daf34;
}

.btn-deactivate {
  background-color: #e6a23c;
  color: white;
}

.btn-deactivate:hover {
  background-color: #d1922c;
}

/* 标签样式 */
.role-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
}

.role-tag.super-admin {
  background-color: #f56c6c;
}

.role-tag.admin {
  background-color: #409eff;
}

.role-tag.user {
  background-color: #67c23a;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.status-badge.active {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.status-badge.inactive {
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
}

.note-cell {
  color: #909399;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-cell {
  white-space: nowrap;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .actions {
    width: 100%;
    display: flex;
    justify-content: space-between;
  }
  
  button {
    padding: 8px 12px;
    flex: 1;
    margin: 0 4px;
  }
}

/* 响应式表格 - 移动端适配 */
@media (max-width: 768px) {
  .user-table {
    width: 100%;
    border: 0;
  }
  
  .user-table thead {
    display: none;
  }
  
  .user-table tr {
    display: block;
    margin-bottom: 16px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 12px;
    background: #fff;
  }
  
  .user-table td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid #f0f0f0;
    text-align: right;
  }
  
  .user-table td:last-child {
    border-bottom: none;
  }
  
  .user-table td::before {
    content: attr(data-label);
    font-weight: 500;
    color: #909399;
    margin-right: 12px;
    text-align: left;
  }
  
  /* 操作按钮适配 */
  .action-cell {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
  }
  
  .action-cell button {
    flex: 1;
    min-width: 60px;
    padding: 6px 8px;
    font-size: 12px;
  }
  
  /* 角色标签调整 */
  .role-tag {
    margin-left: auto;
  }
  
  /* 状态标签调整 */
  .status-badge {
    margin-left: auto;
  }
  
  /* 对话框响应式调整 */
  .el-dialog {
    width: 90% !important;
    max-width: 100%;
  }
  
  .el-form-item__label {
    width: 100% !important;
    text-align: left;
    margin-bottom: 4px;
  }
  
  .el-form-item__content {
    margin-left: 0 !important;
  }
  
  .dialog-footer {
    flex-direction: column;
    gap: 8px;
  }
  
  .dialog-footer .el-button {
    width: 100%;
  }
  
  /* 头部按钮调整 */
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .actions {
    width: 100%;
    display: flex;
    justify-content: space-between;
  }
  
  .actions button {
    padding: 8px 12px;
    flex: 1;
    margin: 0 4px;
  }
}

</style>