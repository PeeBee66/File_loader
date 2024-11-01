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
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Step 2: Calculate original file hash
            checkCancellation();
            modalHandlers.updateProgress('Calculating original file hash...', 'calculating');
            try {
                fileProcessingState.state.originalHash = await hashCalculator.calculateHash(file);
                if (!fileProcessingState.state.originalHash) {
                    throw new Error('Failed to calculate original file hash');
                }
            } catch (error) {
                if (error.name === 'AbortError') throw error;
                console.error('Hash calculation error:', error);
                throw new Error(`Hash calculation failed: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Step 3: Update metadata with original hash
            checkCancellation();
            modalHandlers.updateProgress('Updating metadata with original hash...', 'calculating');
            fileProcessingState.state.metadata.originalFileHash = fileProcessingState.state.originalHash;
            fileProcessingState.state.metadata.originalFileName = file.name;
            fileProcessingState.state.metadata.fileSize = file.size;
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Step 4: Create upload folder
            checkCancellation();
            modalHandlers.updateProgress('Creating upload folder...', 'processing');
            const folderName = fileProcessingState.state.metadata.folder_name;
            fileProcessingState.state.currentFolderName = folderName;
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Step 5: Upload file in chunks
            checkCancellation();
            modalHandlers.updateProgress('Starting file transfer...', 0);
            let uploadResult;
            try {
                uploadResult = await fileUploader.uploadFileInChunks(file);
                if (!uploadResult.success) {
                    throw new Error(uploadResult.error || 'Upload failed');
                }
                await new Promise(resolve => setTimeout(resolve, 10000));
            } catch (error) {
                if (error.name === 'AbortError') throw error;
                console.error('Upload error:', error);
                throw new Error(`File upload failed: ${error.message}`);
            }

            // Step 6: Verify uploaded file
            checkCancellation();
            modalHandlers.updateProgress('Verifying uploaded file...', 'verifying');
            if (uploadResult.verified) {
                modalHandlers.updateProgress('Verification successful!', 'success');
                
                // Show completion statistics
                this.showCompletionStats({
                    originalFile: uploadResult.originalFilename,
                    newFile: uploadResult.newFilename,
                    originalHash: fileProcessingState.state.originalHash,
                    newHash: uploadResult.newHash,
                    fileSize: uploadResult.fileSize,
                    verified: uploadResult.verified
                });

                return uploadResult;
            } else {
                throw new Error('File verification failed - hashes do not match');
            }

        } catch (error) {
            console.error('File processing error:', error);
            fileProcessingState.state.processingErrors.push(error.message);
            
            if (error.name === 'AbortError') {
                modalHandlers.updateProgress('Upload cancelled by user', 'error');
                return await cancellationHandler.cancelUpload();
            } else {
                modalHandlers.updateProgress(`Processing failed: ${error.message}`, 'error');
                return await errorHandler.handleError(error);
            }
        }
    }
};
