// file-processing/error-handler.js
const errorHandler = {
    async handleError(error) {
        console.error('FileProcessing: Error occurred:', error);

        if (error.name !== 'AbortError' && fileProcessingState.state.currentFolderName) {
            try {
                await fetch('/cancel-upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        folder_name: fileProcessingState.state.currentFolderName
                    })
                });
            } catch (cleanupError) {
                console.warn('FileProcessing: Cleanup after error failed:', cleanupError);
            }
        }

        fileProcessingState.resetState();
        
        if (error.name === 'AbortError') {
            throw error;
        }
        
        return {
            success: false,
            error: error.message
        };
    }
};