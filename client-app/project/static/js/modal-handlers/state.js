// modal-handlers/state.js
const modalState = {
    state: {
        isProgressModalShown: false,
        isConfirmationModalShown: false,
        currentProgress: 0,
        processingStatus: null,
        isUploading: false
    },

    resetState() {
        this.state = {
            isProgressModalShown: false,
            isConfirmationModalShown: false,
            currentProgress: 0,
            processingStatus: null,
            isUploading: false
        };
    }
};