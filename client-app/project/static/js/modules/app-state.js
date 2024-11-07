// app-state.js
const appState = {
    isUploading: false,
    currentUpload: null,
    currentFolder: null,
    lastError: null,
    initialized: false,

    setUploading(status) {
        this.isUploading = status;
    },

    setCurrentUpload(upload) {
        this.currentUpload = upload;
    },

    setCurrentFolder(folder) {
        this.currentFolder = folder;
    },

    setError(error) {
        this.lastError = error;
    },

    setInitialized(status) {
        this.initialized = status;
    },

    reset() {
        this.isUploading = false;
        this.currentUpload = null;
        this.currentFolder = null;
        this.lastError = null;
    }
};