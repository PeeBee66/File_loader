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
                throw new Error(result.error || 'Upload failed');
            }

            return result;
        } catch (error) {
            if (error.name === 'AbortError') {
                await cancellationHandler.cancelUpload();
                throw error;
            }
            throw error;
        }
    }
};