// file-processing/processor.js
const fileProcessor = {
    async processFile(file, metadata) {
        try {
            // Reset state for new processing
            fileProcessingState.resetState();
            fileProcessingState.state.metadata = metadata;
            fileProcessingState.state.processingStatus = 'initializing';
            fileProcessingState.state.abortController = new AbortController();

            // Helper function to check for cancellation
            const checkCancellation = () => {
                if (fileProcessingState.state.isCancelled) {
                    throw new DOMException('Upload cancelled by user', 'AbortError');
                }
            };
            
            // Step 1: Create initial metadata file
            modalHandlers.updateProgress('Creating metadata file...', 'calculating');
            checkCancellation();
            fileProcessingState.state.metadata.createdAt = new Date().toISOString();
            fileProcessingState.state.metadata.processingStarted = new Date().toISOString();

            // Step 2: Calculate original file hash
            checkCancellation();
            modalHandlers.updateProgress('Calculating original file hash...', 'calculating');
            try {
                const fileHash = await hashCalculator.calculateFileHash(file);
                if (!fileHash) {
                    modalHandlers.updateProgress('Failed to calculate file hash', 'error');
                    return { success: false, error: 'Hash calculation failed' };
                }
                fileProcessingState.state.originalHash = fileHash;
            } catch (error) {
                if (error.name === 'AbortError') {
                    throw error;
                }
                modalHandlers.updateProgress(`Hash calculation failed: ${error.message}`, 'error');
                return { success: false, error: `Hash calculation failed: ${error.message}` };
            }

            // Step 3: Update metadata with original hash
            checkCancellation();
            modalHandlers.updateProgress('Updating metadata...', 'processing');
            fileProcessingState.state.metadata.originalFileHash = fileProcessingState.state.originalHash;
            fileProcessingState.state.metadata.originalFileName = file.name;
            fileProcessingState.state.metadata.fileSize = file.size;

            // Step 4: Create upload folder
            checkCancellation();
            modalHandlers.updateProgress('Creating upload folder...', 'processing');
            const folderName = fileProcessingState.state.metadata.folder_name;
            fileProcessingState.state.currentFolderName = folderName;

            // Step 5: Upload file in chunks
            checkCancellation();
            modalHandlers.updateProgress('Starting file transfer...', 0);
            let uploadResult;
            try {
                uploadResult = await window.uploadFile(
                    file,
                    fileProcessingState.state.metadata,  // Pass the metadata here
                    (progress) => modalHandlers.updateProgress('Uploading...', progress),
                    fileProcessingState.state.abortController.signal
                );

                if (!uploadResult.success) {
                    modalHandlers.updateProgress(uploadResult.error || 'Upload failed', 'error');
                    return { success: false, error: uploadResult.error || 'Upload failed' };
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    throw error;
                }
                modalHandlers.updateProgress(`Upload failed: ${error.message}`, 'error');
                return { success: false, error: `Upload failed: ${error.message}` };
            }

            // Step 6: Verify uploaded file
            checkCancellation();
            modalHandlers.updateProgress('Verifying uploaded file...', 'verifying');
            if (!uploadResult.verified) {
                const verifyError = 'File verification failed - hashes do not match';
                modalHandlers.updateProgress(verifyError, 'error');
                return { success: false, error: verifyError };
            }

            // Success - show completion info
            modalHandlers.updateProgress('Upload completed successfully!', 'success');
            modalHandlers.showCompletionInfo({
                originalFilename: file.name,
                newFilename: uploadResult.newFilename,
                filePath: uploadResult.filePath,
                originalHash: fileProcessingState.state.originalHash,
                newHash: uploadResult.newHash,
                fileSize: file.size,
                verified: uploadResult.verified,
                processingErrors: fileProcessingState.state.processingErrors
            });

            return {
                success: true,
                ...uploadResult
            };

        } catch (error) {
            console.error('File processing error:', error);
            fileProcessingState.state.processingErrors.push(error.message);
            
            if (error.name === 'AbortError') {
                modalHandlers.updateProgress('Upload cancelled by user', 'cancelled');
                return await cancellationHandler.cancelUpload();
            }
            
            modalHandlers.updateProgress(`Processing failed: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message
            };
        }
    }
};

// Export the processor
window.fileProcessor = fileProcessor;