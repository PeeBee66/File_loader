// modal-handlers/progress-modal.js

const progressModalHandler = {
    showProgressModal(initialMessage = 'Initializing...') {
        console.log('Showing progress modal with message:', initialMessage);
        
        try {
            const progressModal = new bootstrap.Modal(document.getElementById('progressModal'), {
                backdrop: 'static',
                keyboard: false
            });

            // Reset the progress bar state
            $('#progressBar')
                .css('width', '0%')
                .attr('aria-valuenow', 0)
                .removeClass('progress-bar-striped progress-bar-animated bg-danger bg-success')
                .addClass('bg-primary');
            
            // Reset text displays
            $('#progressText').text(initialMessage);
            $('#progressDetails').text('');
            
            // Reset completion info and buttons
            $('#completionInfo').addClass('d-none');
            $('#cancelUpload')
                .removeClass('d-none')
                .prop('disabled', false)
                .show();
            $('#completeButton').addClass('d-none');
            
            // Show the modal
            progressModal.show();
            modalState.state.isProgressModalShown = true;
            modalState.state.isUploading = true;

            // Bind cancel button event handler
            this.bindCancelHandler();

        } catch (error) {
            console.error('Error showing progress modal:', error);
            alert('Error initializing progress display. Please try again.');
        }
    },

    hideProgressModal() {
        console.log('Hiding progress modal');
        try {
            const progressModal = bootstrap.Modal.getInstance(document.getElementById('progressModal'));
            if (progressModal) {
                progressModal.hide();
                modalState.state.isProgressModalShown = false;
                modalState.state.isUploading = false;
            }
        } catch (error) {
            console.error('Error hiding progress modal:', error);
        }
    },

    handleError(error, message) {
        console.error('Error:', error);
        const progressBar = $('#progressBar');
        const cancelButton = $('#cancelUpload');
        const completeButton = $('#completeButton');
        const progressText = $('#progressText');
        const progressDetails = $('#progressDetails');

        // Update UI to show error state
        progressBar
            .removeClass('progress-bar-striped progress-bar-animated bg-primary')
            .addClass('bg-danger')
            .css('width', '100%')
            .attr('aria-valuenow', 100);

        // Show error message
        progressText.text(message || 'An error occurred');
        progressDetails.html(`
            <div class="alert alert-danger">
                <strong>Error Details:</strong><br>
                ${error.message || 'Unknown error occurred'}
            </div>
        `);

        // Update button states
        cancelButton.addClass('d-none');
        completeButton
            .removeClass('d-none')
            .prop('disabled', false)
            .text('Return to Home')
            .off('click')
            .on('click', () => {
                if (confirm('Are you sure you want to return to home?')) {
                    this.hideProgressModal();
                    window.location.href = '/';
                }
            });

        modalState.state.processingStatus = 'error';
        modalState.state.isUploading = false;
    },

    updateProgress(message, progress) {
        console.log('Updating progress:', message, progress);
        
        try {
            const progressBar = $('#progressBar');
            const progressText = $('#progressText');
            const progressDetails = $('#progressDetails');
            const cancelButton = $('#cancelUpload');
            const completeButton = $('#completeButton');

            // Reset classes first
            progressBar.removeClass('progress-bar-striped progress-bar-animated bg-danger bg-success bg-primary');

            switch(progress) {
                case 'calculating':
                case 'verifying':
                case 'processing':
                    progressBar
                        .addClass('progress-bar-striped progress-bar-animated bg-primary')
                        .css('width', '100%')
                        .attr('aria-valuenow', 100);
                    progressDetails.text('');
                    cancelButton.prop('disabled', false).show();
                    break;

                case 'cancelled':
                    // Don't automatically hide modal or redirect
                    progressBar
                        .addClass('bg-warning')
                        .css('width', '100%')
                        .attr('aria-valuenow', 100);
                    progressText.text('Upload cancelled');
                    progressDetails.html(`
                        <div class="alert alert-warning">
                            Upload cancelled by user. Click "Return to Home" when ready.
                        </div>
                    `);
                    cancelButton.addClass('d-none');
                    completeButton
                        .removeClass('d-none')
                        .text('Return to Home')
                        .off('click')
                        .on('click', () => {
                            if (confirm('Are you sure you want to return to home?')) {
                                this.hideProgressModal();
                                window.location.href = '/';
                            }
                        });
                    modalState.state.processingStatus = 'cancelled';
                    modalState.state.isUploading = false;
                    break;

                case 'failed':
                case 'error':
                    this.handleError(new Error(message), message);
                    break;

                default:
                    if (typeof progress === 'number') {
                        modalState.state.currentProgress = progress;
                        progressBar
                            .addClass('bg-primary')
                            .css('width', `${Math.round(progress)}%`)
                            .attr('aria-valuenow', Math.round(progress));
                        progressText.text(`${message} ${Math.round(progress)}%`);
                        progressDetails.text('');
                        cancelButton.prop('disabled', false).show();
                    }
            }
        } catch (error) {
            console.error('Error updating progress display:', error);
            this.handleError(error, 'Error updating progress display');
        }
    },

    bindCancelHandler() {
        $('#cancelUpload').off('click').on('click', async (e) => {
            e.preventDefault();
            console.log('Cancel button clicked');
            
            if (!confirm('Are you sure you want to cancel the upload?')) {
                return;
            }
            
            const button = $('#cancelUpload');
            button.prop('disabled', true);
            
            try {
                if (!modalState.state.isUploading) {
                    console.log('No active upload to cancel');
                    return;
                }

                this.updateProgress('Cancelling upload...', 'calculating');
                
                if (!window.fileProcessing) {
                    throw new Error('File processing system not initialized');
                }

                await window.fileProcessing.cancelUpload();
                console.log('Upload cancelled successfully');
                
                this.updateProgress('Upload cancelled', 'cancelled');
                modalState.state.isUploading = false;
                
            } catch (error) {
                console.error('Error cancelling upload:', error);
                this.handleError(error, 'Error cancelling upload: ' + error.message);
            } finally {
                button.prop('disabled', false);
            }
        });
    },

    showCompletionInfo(info) {
        console.log('Showing completion info:', info);
        try {
            $('#completionInfo').removeClass('d-none');
            
            const content = `
                <div class="completion-details p-3">
                    <h4 class="text-center mb-3">Processing Complete</h4>
                    
                    <div class="mb-2">
                        <strong>Original Filename:</strong> ${info.originalFilename}
                    </div>
                    
                    <div class="mb-2">
                        <strong>New Filename:</strong> ${info.newFilename}
                    </div>
                    
                    <div class="mb-2">
                        <strong>File Path:</strong> ${info.filePath || 'N/A'}
                    </div>
                    
                    <div class="mb-2">
                        <strong>Original Hash:</strong> 
                        <span class="font-monospace">${info.originalHash}</span>
                    </div>
                    
                    <div class="mb-2">
                        <strong>New Hash:</strong> 
                        <span class="font-monospace">${info.newHash}</span>
                    </div>

                    <div class="mb-2">
                        <strong>File Size:</strong> ${utils.formatFileSize(info.fileSize)}
                    </div>
                    
                    <div class="text-center mt-3">
                        <span class="badge ${info.verified ? 'bg-success' : 'bg-danger'} p-2">
                            ${info.verified ? 'Verification Successful' : 'Verification Failed'}
                        </span>
                    </div>

                    ${info.processingErrors.length > 0 ? `
                        <div class="mt-3 text-danger">
                            <strong>Errors:</strong>
                            <ul>
                                ${info.processingErrors.map(error => `<li>${error}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <div class="text-center mt-3">
                        <button type="button" class="btn btn-primary" id="modalCompleteButton">
                            Return to Home
                        </button>
                    </div>
                </div>
            `;
            
            $('#completionInfo').html(content);
            
            const progressBar = $('#progressBar');
            progressBar
                .removeClass('bg-primary progress-bar-striped progress-bar-animated')
                .addClass(info.verified ? 'bg-success' : 'bg-danger')
                .css('width', '100%');
            
            $('#cancelUpload').addClass('d-none');
            $('#completeButton').addClass('d-none');
            
            // Add click handler for the complete button
            $('#modalCompleteButton').off('click').on('click', () => {
                if (confirm('Are you sure you want to return to home?')) {
                    this.hideProgressModal();
                    window.location.href = '/';
                }
            });
            
        } catch (error) {
            console.error('Error showing completion info:', error);
            this.handleError(error, 'Error displaying completion information');
        }
    }
};

// Export the handler
window.progressModalHandler = progressModalHandler;