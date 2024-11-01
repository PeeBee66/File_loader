// file-processing/index.js
const fileProcessing = {
    ...fileProcessingState,
    processFile: fileProcessor.processFile,
    calculateHash: hashCalculator.calculateHash,
    cancelUpload: cancellationHandler.cancelUpload,
    showCompletionStats: completionHandler.showCompletionStats
};

// Initialize the file processing module when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    if (!window.fileProcessing) {
        window.fileProcessing = fileProcessing;
    }
    window.fileProcessing.resetState();
});

// Make fileProcessing available globally
window.fileProcessing = fileProcessing;