import { ref } from 'vue'

export function useModal() {
  const isVisible = ref(false)
  const modalData = ref<{
    url?: string
    linkTitle?: string
    type?: string
    title?: string
    message?: string
  }>({})

  const openModal = (data: {
    url?: string
    linkTitle?: string
    type?: string
    title?: string
    message?: string
  } = {}) => {
    modalData.value = data
    isVisible.value = true
  }

  const closeModal = () => {
    isVisible.value = false
    setTimeout(() => {
      modalData.value = {}
    }, 300)
  }

  const openLinkModal = (url: string, linkTitle?: string) => {
    openModal({ url, linkTitle })
  }

  return {
    isVisible,
    modalData,
    openModal,
    closeModal,
    openLinkModal
  }
}
