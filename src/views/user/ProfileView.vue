<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { userApi } from '@/api/user'
import { message } from 'ant-design-vue'
import { RightOutlined } from '@ant-design/icons-vue'
import type { UserUpdateRequest, PasswordChangeRequest } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('info')

// 编辑弹窗
const modalVisible = ref(false)
const modalTitle = ref('')
type EditableField = 'username' | 'real_name' | 'department' | 'phone' | 'email'
const editingField = ref<EditableField>('real_name')
const editValue = ref('')
const saving = ref(false)

// 修改密码表单
const pwdForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
})
const changingPwd = ref(false)

// 可编辑字段配置
interface FieldConfig {
  key: EditableField
  label: string
  value: string
  placeholder: string
}
const editableFields = computed<FieldConfig[]>(() => [
  { key: 'username',   label: '用户名', value: authStore.user?.username ?? '', placeholder: '请输入用户名' },
  { key: 'real_name',  label: '姓名',   value: authStore.user?.real_name ?? '', placeholder: '请输入姓名' },
  { key: 'department', label: '学院',   value: authStore.user?.department ?? '-', placeholder: '请输入学院' },
  { key: 'phone',      label: '手机',   value: authStore.user?.phone ?? '-', placeholder: '请输入手机号' },
  { key: 'email',      label: '邮箱',   value: authStore.user?.email ?? '-', placeholder: '请输入邮箱' },
])

// 不可编辑字段
const readonlyFields = computed(() => [
  { label: '角色',  value: '' /* 用 tag 渲染 */ },
  ...(authStore.user?.student_id ? [{ label: '学号', value: authStore.user.student_id }] : []),
  { label: '注册时间', value: authStore.user?.created_at ? new Date(authStore.user.created_at).toLocaleString('zh-CN') : '-' },
])

function openEdit(field: EditableField) {
  editingField.value = field
  editValue.value = authStore.user?.[field] ?? ''
  const cfg = editableFields.value.find(f => f.key === field)
  modalTitle.value = `修改${cfg?.label ?? field}`
  modalVisible.value = true
}

async function saveEdit() {
  saving.value = true
  try {
    const payload: UserUpdateRequest = { [editingField.value]: editValue.value || undefined }
    const res = await userApi.updateProfile(payload)
    authStore.user = res.data
    localStorage.setItem('user', JSON.stringify(res.data))
    message.success('已更新')
    modalVisible.value = false
  } catch {
    // error handled by interceptor
  } finally {
    saving.value = false
  }
}

async function changePassword() {
  if (!pwdForm.old_password || !pwdForm.new_password || !pwdForm.confirm_password) {
    message.warning('请填写完整')
    return
  }
  if (pwdForm.new_password !== pwdForm.confirm_password) {
    message.warning('两次输入的新密码不一致')
    return
  }
  if (pwdForm.new_password.length < 6) {
    message.warning('新密码长度不能少于 6 位')
    return
  }
  if (pwdForm.old_password === pwdForm.new_password) {
    message.warning('新密码不能与旧密码相同')
    return
  }

  changingPwd.value = true
  try {
    const data: PasswordChangeRequest = {
      old_password: pwdForm.old_password,
      new_password: pwdForm.new_password,
    }
    const res = await userApi.changePassword(data)
    message.success(res.data.message || '密码修改成功')
    pwdForm.old_password = ''
    pwdForm.new_password = ''
    pwdForm.confirm_password = ''
  } catch {
    // error handled by interceptor
  } finally {
    changingPwd.value = false
  }
}

const roleLabels: Record<string, string> = {
  student: '学生',
  teacher: '教师',
  admin: '管理员',
}
const roleColors: Record<string, string> = {
  student: 'blue',
  teacher: 'green',
  admin: 'red',
}
</script>

<template>
  <div class="profile-page">
    <h2 style="margin-bottom: 24px;">个人中心</h2>

    <a-tabs v-model:activeKey="activeTab" tabPosition="top">
      <!-- Tab 1: 个人信息（设置列表风格） -->
      <a-tab-pane key="info" tab="个人信息">
        <a-card :bordered="false" style="max-width: 640px;">

          <!-- 只读字段 -->
          <div class="setting-row" v-for="field in readonlyFields" :key="field.label">
            <span class="setting-label">{{ field.label }}</span>
            <span class="setting-value" v-if="field.label === '角色'">
              <a-tag :color="roleColors[authStore.user?.role ?? '']">
                {{ roleLabels[authStore.user?.role ?? ''] || authStore.user?.role }}
              </a-tag>
            </span>
            <span class="setting-value" v-else>{{ field.value }}</span>
          </div>

          <div class="setting-divider"></div>

          <!-- 可编辑字段（带 > 按钮） -->
          <div
            class="setting-row clickable"
            v-for="field in editableFields"
            :key="field.key"
            @click="openEdit(field.key)"
          >
            <span class="setting-label">{{ field.label }}</span>
            <span class="setting-value">{{ field.value }}</span>
            <RightOutlined class="setting-arrow" />
          </div>

        </a-card>
      </a-tab-pane>

      <!-- Tab 2: 修改密码 -->
      <a-tab-pane key="password" tab="修改密码">
        <a-card :bordered="false" style="max-width: 440px;">
          <a-form layout="vertical">
            <a-form-item label="旧密码" required>
              <a-input-password
                v-model:value="pwdForm.old_password"
                placeholder="请输入旧密码"
              />
            </a-form-item>
            <a-form-item label="新密码" required>
              <a-input-password
                v-model:value="pwdForm.new_password"
                placeholder="请输入新密码（至少 6 位）"
              />
            </a-form-item>
            <a-form-item label="确认新密码" required>
              <a-input-password
                v-model:value="pwdForm.confirm_password"
                placeholder="请再次输入新密码"
              />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" :loading="changingPwd" @click="changePassword">
                修改密码
              </a-button>
            </a-form-item>
          </a-form>
        </a-card>
      </a-tab-pane>

      <!-- Tab 3: 我的预约 -->
      <a-tab-pane key="reservations" tab="我的预约">
        <a-card :bordered="false">
          <p>点击下方按钮查看您的所有预约记录。</p>
          <a-button type="primary" @click="router.push('/reservations')">
            前往我的预约
          </a-button>
        </a-card>
      </a-tab-pane>
    </a-tabs>

    <!-- 编辑弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      :confirm-loading="saving"
      @ok="saveEdit"
      @cancel="modalVisible = false"
      ok-text="保存"
      cancel-text="取消"
    >
      <a-input
        v-model:value="editValue"
        :placeholder="editableFields.find(f => f.key === editingField)?.placeholder ?? ''"
        style="width: 100%;"
      />
    </a-modal>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 800px;
  margin: 0 auto;
}

.setting-row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  min-height: 48px;
}

.setting-row.clickable {
  cursor: pointer;
  transition: background 0.2s;
}

.setting-row.clickable:hover {
  background: #fafafa;
}

.setting-label {
  width: 80px;
  flex-shrink: 0;
  color: #999;
  font-size: 14px;
}

.setting-value {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.setting-arrow {
  color: #ccc;
  font-size: 14px;
  margin-left: 8px;
}

.setting-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 4px 16px;
}
</style>
