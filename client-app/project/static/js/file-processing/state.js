// file-processing/state.js
const fileProcessingState = {
    state: {
        currentUpload: null,
        currentFolderName: null,
        metadata: null,
        processingStatus: null,
        currentFilePath: null,
        originalHash: null,
        processingErrors: [],
        isCancelled: false,
        abortController: null
    },

    resetState() {
        console.log('FileProcessing: Resetting state');
        this.state = {
            currentUpload: null,
            currentFolderName: null,
            metadata: null,
            processingStatus: null,
            currentFilePath: null,
            originalHash: null,
            processingErrors: [],
            isCancelled: false,
            abortController: new AbortController()
        };
        console.log('FileProcessing: State reset complete');
    },

    getCurrentUpload() {
        return this.state.currentUpload;
    },

    getCurrentFolderName() {
        return this.state.currentFolderName;
    },

    setCurrentUpload(upload) {
        this.state.currentUpload = upload;
    },

    setCurrentFolderName(name) {
        this.state.currentFolderName = name;
    }
};