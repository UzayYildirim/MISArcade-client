import { ref } from 'vue';
export function useModal() {
    const isVisible = ref(false);
    const modalData = ref({});
    const openModal = (data = {}) => {
        modalData.value = data;
        isVisible.value = true;
    };
    const closeModal = () => {
        isVisible.value = false;
        // Clear data after a short delay to allow for smooth transitions
        setTimeout(() => {
            modalData.value = {};
        }, 300);
    };
    const openLinkModal = (url, linkTitle) => {
        openModal({ url, linkTitle });
    };
    return {
        isVisible,
        modalData,
        openModal,
        closeModal,
        openLinkModal
    };
}
