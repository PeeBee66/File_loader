// file-processing/uploader.js
const fileUploader = {
    async uploadFileInChunks(file) {
        try {
            fileProcessingState.state.metadata.originalFileHash = fileProcessingState.state.originalHash;
            
            const result = await window.uploadFile(
                file,
                fileProcessingState.state.metadata,
                progress => modalHandlers.updateProgress('Uploading...', progress),
                fileProcessingState.state.abortController.signal
            );

            if (!result.success) {
                modalHandlers.updateProgress(result.error || 'Upload failed', 'error');
                return result;
            }

            return result;
        } catch (error) {
            if (error.name === 'AbortError') {
                modalHandlers.updateProgress('Upload cancelled', 'cancelled');
                throw error;
            }
            modalHandlers.updateProgress('Upload error: ' + error.message, 'error');
            return { success: false, error: error.message };
        }
    }
};