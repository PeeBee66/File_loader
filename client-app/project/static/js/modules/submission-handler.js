// modules/submission-handler.js
const submissionHandler = {
    async handleFormSubmission(file, metadata) {
        try {
            // Hide confirmation modal and show progress modal
            modalHandlers.hideConfirmationModal();
            modalHandlers.showProgressModal('Initializing upload...');
            appState.setUploading(true);
            
            // Validate file and metadata
            if (!file || !metadata) {
                modalHandlers.updateProgress('Invalid file or metadata provided', 'error');
                return;
            }

            // Start file processing
            const result = await window.fileProcessing.processFile(file, metadata);
            
            // Handle processing result
            if (!result || !result.success) {
                const errorMessage = result?.error || 'Unknown processing error occurred';
                console.error('Processing failed:', errorMessage);
                modalHandlers.updateProgress(errorMessage, 'error');
                return;
            }
            
            // Successfully completed
            modalHandlers.updateProgress('Processing complete', 'success');
            appState.setUploading(false);
            
            // Show completion info if available
            if (result.filePath && result.originalFilename) {
                modalHandlers.showCompletionInfo({
                    originalFilename: result.originalFilename,
                    newFilename: result.newFilename || result.originalFilename,
                    filePath: result.filePath,
                    originalHash: result.originalHash,
                    newHash: result.newHash,
                    fileSize: file.size,
                    verified: result.verified,
                    processingErrors: []
                });
            }

            return result;
        } catch (error) {
            console.error('Submission error:', error);
            this.handleProcessingError(error);
        }
    },

    handleProcessingError(error) {
        console.error('Processing error details:', error);
        
        // Update application state
        appState.setError(error);
        appState.setUploading(false);

        // Handle different error types
        if (error.name === 'AbortError') {
            console.log('Upload was cancelled by user');
            modalHandlers.updateProgress('Upload cancelled by user', 'cancelled');
        } else {
            // Determine error message
            let errorMessage = 'An error occurred during processing';
            if (error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            // Update modal with error
            modalHandlers.updateProgress(errorMessage, 'error');
        }
    },

    gatherFormMetadata(file, folderName) {
        return {
            original_filename: file.name,
            new_filename: $('#renameFileCheck').is(':checked') ? $('#renamePreview').val() : "",
            rename_file: $('#renameFileCheck').is(':checked'),
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
            folder_name: folderName,
            timestamp: new Date().toISOString(),
            fileSize: file.size
        };
    },

    validateSubmission(file, metadata) {
        const errors = [];

        if (!file) {
            errors.push('No file selected');
        }

        if (!metadata.operation) {
            errors.push('Operation name is required');
        }

        if (!metadata.dateOfCollection) {
            errors.push('Date of collection is required');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
};

// Make submissionHandler available globally
window.submissionHandler = submissionHandler;