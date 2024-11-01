// file-processing/cancellation-handler.js
const cancellationHandler = {
    async cancelUpload() {
        console.log('FileProcessing: Starting cancellation process');
        
        try {
            fileProcessingState.state.isCancelled = true;
            
            // Abort any ongoing requests
            if (fileProcessingState.state.abortController) {
                fileProcessingState.state.abortController.abort();
            }
    
            // Clean up server-side if we have a folder name
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
        
                    const result = await response.json();
                    console.log('FileProcessing: Cleanup successful:', result);
                } catch (cleanupError) {
                    console.warn('FileProcessing: Cleanup warning:', cleanupError);
                }
            }
    
            // Reset state
            fileProcessingState.resetState();
            console.log('FileProcessing: Cancellation complete');
            
            // Update UI and redirect
            modalHandlers.updateProgress('Upload cancelled', 'cancelled');
            setTimeout(() => {
                modalHandlers.hideProgressModal();
                window.location.href = '/';
            }, 1000);

            return { success: true, message: 'Upload cancelled successfully' };
            
        } catch (error) {
            console.error('FileProcessing: Error during cancellation:', error);
            fileProcessingState.resetState();
            setTimeout(() => {
                modalHandlers.hideProgressModal();
                window.location.href = '/';
            }, 1000);
            return { success: false, error: error.message };
        }
    }
};