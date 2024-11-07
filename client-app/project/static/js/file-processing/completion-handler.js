// file-processing/completion-handler.js
const completionHandler = {
    showCompletionStats(stats) {
        modalHandlers.showCompletionInfo({
            originalFile: stats.originalFile,
            newFile: stats.newFile,
            originalHash: stats.originalHash,
            newHash: stats.newHash,
            fileSize: stats.fileSize,
            verified: stats.verified,
            processingErrors: fileProcessingState.state.processingErrors
        });
    }
};
