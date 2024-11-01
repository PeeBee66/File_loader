// submission-handler.js
const submissionHandler = {
    async handleFormSubmission(file, metadata) {
        try {
            modalHandlers.hideConfirmationModal();
            modalHandlers.showProgressModal();
            appState.setUploading(true);
            
            const result = await window.fileProcessing.processFile(file, metadata);
            
            if (!result.success) {
                throw new Error(result.error || 'Processing failed');
            }
            
            appState.setUploading(false);
            return result;
        } catch (error) {
            console.error('Processing error:', error);
            this.handleProcessingError(error);
            throw error;
        }
    },

    async handleProcessingError(error) {
        appState.setError(error);
        appState.setUploading(false);

        if (error.name === 'AbortError') {
            console.log('Upload was cancelled by user');
            modalHandlers.updateProgress('Upload cancelled', 'cancelled');
            
            setTimeout(() => {
                modalHandlers.hideProgressModal();
                window.location.href = '/';
            }, 1000);
        } else {
            console.error('Processing error:', error);
            modalHandlers.updateProgress(`Error: ${error.message}`, 'error');
            
            setTimeout(() => {
                modalHandlers.hideProgressModal();
                window.location.href = '/';
            }, 3000);
        }
    },

    gatherFormMetadata(file, folderName) {
        const renameFileChecked = $('#renameFileCheck').is(':checked');
        const newFilename = renameFileChecked ? $('#renamePreview').val() : file.name;

        return {
            original_filename: file.name,
            new_filename: renameFileChecked ? newFilename : "",
            rename_file: renameFileChecked,
            operation: $('#operation').val(),
            deviceType: $('#deviceType').val(),
            serialNumber: $('#serialNumber').val(),
            itemNumber: $('#itemNumber').val(),
            subNumber: $('#subNumber').val(),
            collection: $('#collection').val(),
            platform: $('#platform').val(),
            dateOfCollection: $('#dateOfCollection').val(),
            knownPasswords: $('#knownPasswords').val(),
            notes: $('#notes').val(),
            processingMethod: $('#processingMethod').val(),
            approved: 'No',
            system: config.state.systemName,
            folder_name: folderName
        };
    }
};