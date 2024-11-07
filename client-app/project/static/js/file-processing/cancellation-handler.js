// file-processing/cancellation-handler.js
const cancellationHandler = {
    async cancelUpload() {
        console.log('FileProcessing: Starting cancellation process');
        
        try {
            fileProcessingState.state.isCancelled = true;
            
            if (fileProcessingState.state.abortController) {
                fileProcessingState.state.abortController.abort();
            }
    
            if (fileProcessingState.state.currentFolderName) {
                console.log('FileProcessing: Cleaning up folder:', fileProcessingState.state.currentFolderName);
                
                try {
                    const response = await fetch('/cancel-upload', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            folder_name: fileProcessingState.state.currentFolderName
                        })
                    });
        
                    if (!response.ok) {
                        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                    }
                } catch (cleanupError) {
                    console.warn('FileProcessing: Cleanup warning:', cleanupError);
                    // Don't throw - continue with cancellation
                }
            }
    
            fileProcessingState.resetState();
            console.log('FileProcessing: Cancellation complete');
            
            modalHandlers.updateProgress('Upload cancelled', 'cancelled');
            return { success: true, message: 'Upload cancelled successfully' };
            
        } catch (error) {
            console.error('FileProcessing: Error during cancellation:', error);
            fileProcessingState.resetState();
            modalHandlers.updateProgress('Error during cancellation: ' + error.message, 'error');
            return { success: false, error: error.message };
        }
    }
};