<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { instrumentApi } from '@/api'
import { message, Modal } from 'ant-design-vue'
import type { Instrument, InstrumentCreateRequest, InstrumentUpdateRequest, Category } from '@/types'

const loading = ref(false)
const instruments = ref<Instrument[]>([])
const categories = ref<Category[]>([])
const modalVisible = ref(false)
const modalTitle = ref('新增仪器')
const editingId = ref<number | null>(null)
const form = ref<InstrumentCreateRequest & { status?: string }>({
  name: '',
  model: '',
  category_id: undefined as unknown as number,
  location: '',
  description: '',
})
const submitLoading = ref(false)
const mostReservedActive = ref(false)

// 分类管理弹窗
const catModalVisible = ref(false)
const catNewName = ref('')
const catEditId = ref<number | null>(null)
const catEditName = ref('')

function openCategoryModal() {
  catModalVisible.value = true
  catNewName.value = ''
  catEditId.value = null
  catEditName.value = ''
}

async function handleAddCategory() {
  if (!catNewName.value.trim()) {
    message.warning('请输入分类名称')
    return
  }
  try {
    await instrumentApi.createCategory(catNewName.value.trim())
    message.success('添加成功')
    catNewName.value = ''
    const res = await instrumentApi.getCategories()
    categories.value = res.data
  } catch (err: any) {
    message.error(err?.response?.data?.detail || '添加失败')
  }
}

async function handleEditCategory(cat: Category) {
  if (!catEditName.value.trim()) {
    message.warning('请输入分类名称')
    return
  }
  try {
    await instrumentApi.updateCategory(cat.category_id, catEditName.value.trim())
    message.success('更新成功')
    catEditId.value = null
    catEditName.value = ''
    const res = await instrumentApi.getCategories()
    categories.value = res.data
  } catch (err: any) {
    message.error(err?.response?.data?.detail || '更新失败')
  }
}

function startEdit(cat: Category) {
  catEditId.value = cat.category_id
  catEditName.value = cat.name
}

function cancelEdit() {
  catEditId.value = null
  catEditName.value = ''
}

async function handleDeleteCategory(cat: Category) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除分类「${cat.name}」吗？（该分类下有仪器则无法删除）`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await instrumentApi.deleteCategory(cat.category_id)
        message.success('已删除')
        const res = await instrumentApi.getCategories()
        categories.value = res.data
      } catch (err: any) {
        message.error(err?.response?.data?.detail || '删除失败')
      }
    },
  })
}

const columns = [
  { title: 'ID', dataIndex: 'instrument_id', sorter: (a: Instrument, b: Instrument) => a.instrument_id - b.instrument_id },
  { title: '名称', dataIndex: 'name' },
  { title: '型号', dataIndex: 'model' },
  { title: '资产编号', dataIndex: 'asset_tag' },
  { title: '分类', dataIndex: 'category_id' },
  { title: '存放地点', dataIndex: 'location' },
  {
    title: '状态',
    dataIndex: 'status',
  },
  {
    title: '操作',
    key: 'action',
  },
]

onMounted(async () => {
  await loadData()
})

async function loadData(mostReserved?: boolean) {
  loading.value = true
  try {
    const catRes = await instrumentApi.getCategories()
    categories.value = catRes.data
    const params = mostReserved ? { most_reserved: true } : undefined
    const instRes = await instrumentApi.getInstruments(params)
    instruments.value = instRes.data
  } catch {
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

function toggleMostReserved() {
  mostReservedActive.value = !mostReservedActive.value
  loadData(mostReservedActive.value || undefined)
}

function clearMostReserved() {
  mostReservedActive.value = false
  loadData()
}

function openCreate() {
  editingId.value = null
  modalTitle.value = '新增仪器'
  form.value = {
    name: '',
    model: '',
    category_id: undefined as unknown as number,
    location: '',
    description: '',
  }
  modalVisible.value = true
}

function openEdit(record: Instrument) {
  editingId.value = record.instrument_id
  modalTitle.value = '编辑仪器'
  form.value = {
    name: record.name,
    model: record.model || '',
    category_id: record.category_id,
    location: record.location || '',
    description: record.description || '',
    status: record.status,
  }
  modalVisible.value = true
}

async function handleSubmit() {
  if (!form.value.name || !form.value.category_id) {
    message.warning('请填写名称和分类')
    return
  }
  submitLoading.value = true
  try {
    if (editingId.value) {
      await instrumentApi.updateInstrument(editingId.value, form.value as InstrumentUpdateRequest)
      message.success('更新成功')
    } else {
      await instrumentApi.createInstrument(form.value as InstrumentCreateRequest)
      message.success('添加成功')
    }
    modalVisible.value = false
    await loadData()
  } catch (err: any) {
    message.error(err?.response?.data?.detail || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

function handleDelete(record: Instrument) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除仪器「${record.name}」吗？此操作不可恢复。`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await instrumentApi.deleteInstrument(record.instrument_id)
        message.success('已删除')
        await loadData()
      } catch (err: any) {
        message.error(err?.response?.data?.detail || '删除失败')
      }
    },
  })
}
</script>

<template>
  <div class="admin-instrument-page">
    <a-card :bordered="false">
      <template #title>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 18px; font-weight: 600;">仪器管理</span>
          <div>
            <a-button style="margin-right: 8px;" @click="openCategoryModal">
              管理分类
            </a-button>
            <a-button
              :type="mostReservedActive ? 'primary' : 'default'"
              style="margin-right: 8px;"
              @click="toggleMostReserved"
            >
              📊 预约次数最多
            </a-button>
            <a-button type="primary" @click="openCreate">
              + 新增仪器
            </a-button>
          </div>
        </div>
      </template>

      <a-alert
        v-if="mostReservedActive"
        type="info"
        show-icon
        closable
        :after-close="clearMostReserved"
        message="仅显示预约次数最多的仪器"
        style="margin-bottom: 16px;"
      />

      <a-table
        :dataSource="instruments"
        :columns="columns"
        :loading="loading"
        rowKey="instrument_id"
        :pagination="{ pageSize: 15 }"
      >
        <template #bodyCell="{ column, record }: { column: any; record: Instrument }">
          <template v-if="column.key === 'action'">
            <a-button type="link" @click="openEdit(record)">编辑</a-button>
            <a-button type="link" danger @click="handleDelete(record)">删除</a-button>
          </template>
          <template v-else-if="column.dataIndex === 'category_id'">
            {{ categories.find(c => c.category_id === record.category_id)?.name || record.category_id }}
          </template>
          <template v-else-if="column.dataIndex === 'status'">
            <a-tag
              :color="record.status === 'available' ? 'green' : record.status === 'in_use' ? 'red' : 'orange'"
            >
              {{ record.status === 'available' ? '空闲' : record.status === 'in_use' ? '使用中' : '维修中' }}
            </a-tag>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- Create / Edit Modal -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      :confirm-loading="submitLoading"
      @ok="handleSubmit"
      @cancel="modalVisible = false"
    >
      <a-form layout="vertical">
        <a-form-item label="名称" required>
          <a-input v-model:value="form.name" placeholder="仪器名称" />
        </a-form-item>
        <a-form-item label="型号">
          <a-input v-model:value="form.model" placeholder="型号（选填）" />
        </a-form-item>
        <a-form-item label="分类" required>
          <a-select
            v-model:value="form.category_id"
            :options="categories.map(c => ({ value: c.category_id, label: c.name }))"
            placeholder="选择分类"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="存放地点">
          <a-input v-model:value="form.location" placeholder="存放地点（选填）" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="form.description" placeholder="描述（选填）" :rows="3" />
        </a-form-item>
        <a-form-item v-if="editingId" label="状态">
          <a-select
            v-model:value="form.status"
            :options="[
              { value: 'available', label: '空闲' },
              { value: 'in_use', label: '使用中' },
              { value: 'maintenance', label: '维修中' },
            ]"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 分类管理弹窗 -->
    <a-modal
      v-model:visible="catModalVisible"
      title="分类管理"
      :footer="null"
      @cancel="cancelEdit"
    >
      <div style="display: flex; gap: 8px; margin-bottom: 16px;">
        <a-input
          v-model:value="catNewName"
          placeholder="输入新分类名称"
          @press-enter="handleAddCategory"
          style="flex: 1"
        />
        <a-button type="primary" @click="handleAddCategory">添加</a-button>
      </div>

      <div v-for="cat in categories" :key="cat.category_id" style="display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
        <template v-if="catEditId === cat.category_id">
          <a-input v-model:value="catEditName" style="flex: 1; margin-right: 8px;" @press-enter="handleEditCategory(cat)" />
          <a-button type="link" @click="handleEditCategory(cat)">保存</a-button>
          <a-button type="link" @click="cancelEdit">取消</a-button>
        </template>
        <template v-else>
          <span style="flex: 1">{{ cat.name }}</span>
          <a-button type="link" @click="startEdit(cat)">编辑</a-button>
          <a-button type="link" danger @click="handleDeleteCategory(cat)">删除</a-button>
        </template>
      </div>
    </a-modal>
  </div>
</template>
