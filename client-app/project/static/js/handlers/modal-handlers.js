// modal-handlers.js

const modalHandlers = {
    state: {
        isProgressModalShown: false,
        isConfirmationModalShown: false,
        currentProgress: 0,
        processingStatus: null,
        isUploading: false
    },

    showProgressModal: function(initialMessage = 'Initializing...') {
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
            this.state.isProgressModalShown = true;
            this.state.isUploading = true;

            // Bind cancel button event handler
            this.bindCancelHandler();

        } catch (error) {
            console.error('Error showing progress modal:', error);
            alert('Error initializing progress display. Please try again.');
        }
    },

    bindCancelHandler: function() {
        $('#cancelUpload').off('click').on('click', async (e) => {
            e.preventDefault();
            console.log('Cancel button clicked');
            
            const button = $('#cancelUpload');
            button.prop('disabled', true);
            
            try {
                this.updateProgress('Cancelling upload...', 'calculating');
                
                // Call the file processing cancel method
                if (window.fileProcessing) {
                    await window.fileProcessing.cancelUpload();
                    console.log('Cancel request processed');
                }
                
                // Update UI for cancelled state
                this.updateProgress('Upload cancelled', 'cancelled');
                button.addClass('d-none');
                $('#completeButton')
                    .removeClass('d-none')
                    .off('click')
                    .on('click', () => {
                        this.hideProgressModal();
                        window.location.href = '/';
                    });
                
            } catch (error) {
                console.error('Error during cancellation:', error);
                this.updateProgress('Error cancelling upload: ' + error.message, 'error');
            } finally {
                // Ensure button is re-enabled if needed
                button.prop('disabled', false);
            }
        });
    },

    updateProgress: function(message, progress) {
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
                    progressBar
                        .addClass('bg-warning')
                        .css('width', '100%')
                        .attr('aria-valuenow', 100);
                    cancelButton.addClass('d-none');
                    completeButton.removeClass('d-none')
                        .off('click')
                        .on('click', () => {
                            this.hideProgressModal();
                            window.location.href = '/';
                        });
                    progressDetails.text('Operation cancelled by user');
                    this.state.processingStatus = 'cancelled';
                    this.state.isUploading = false;
                    break;

                case 'failed':
                case 'error':
                    progressBar
                        .addClass('bg-danger')
                        .css('width', '100%')
                        .attr('aria-valuenow', 100);
                    cancelButton.addClass('d-none');
                    completeButton.removeClass('d-none');
                    progressDetails.text('An error occurred during processing');
                    this.state.processingStatus = 'error';
                    this.state.isUploading = false;
                    break;

                default:
                    if (typeof progress === 'number') {
                        this.state.currentProgress = progress;
                        progressBar
                            .addClass('bg-primary')
                            .css('width', `${Math.round(progress)}%`)
                            .attr('aria-valuenow', Math.round(progress));
                        message = `${message} ${Math.round(progress)}%`;
                        progressDetails.text('');
                        cancelButton.prop('disabled', false).show();
                    }
            }

            progressText.text(message);

        } catch (error) {
            console.error('Error updating progress display:', error);
        }
    },

    hideProgressModal: function() {
        try {
            const progressModal = bootstrap.Modal.getInstance(document.getElementById('progressModal'));
            if (progressModal) {
                progressModal.hide();
                this.state.isProgressModalShown = false;
                this.state.isUploading = false;
                
                // Redirect after modal is hidden
                setTimeout(() => {
                    window.location.href = '/';
                }, 100);
            }
        } catch (error) {
            console.error('Error hiding progress modal:', error);
            // Fallback redirect
            window.location.href = '/';
        }
    },
    showConfirmationModal: function() {
        console.log('Showing confirmation modal');
        try {
            const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'), {
                backdrop: 'static',
                keyboard: false
            });
            confirmationModal.show();
            this.state.isConfirmationModalShown = true;
            
            // Reset checkbox states
            $('.review-checkbox').prop('checked', false);
            $('#confirmSubmit').prop('disabled', true);

        } catch (error) {
            console.error('Error showing confirmation modal:', error);
            alert('Error showing confirmation dialog. Please try again.');
        }
    },

    hideConfirmationModal: function() {
        console.log('Hiding confirmation modal');
        try {
            const confirmationModal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
            if (confirmationModal) {
                confirmationModal.hide();
                this.state.isConfirmationModalShown = false;
            }
        } catch (error) {
            console.error('Error hiding confirmation modal:', error);
        }
    },

    hideProgressModal: function() {
        console.log('Hiding progress modal');
        try {
            const progressModal = bootstrap.Modal.getInstance(document.getElementById('progressModal'));
            if (progressModal) {
                progressModal.hide();
                this.state.isProgressModalShown = false;
                this.state.isUploading = false;
            }
        } catch (error) {
            console.error('Error hiding progress modal:', error);
        }
    },

    populateConfirmationModal: function() {
        console.log('Populating confirmation modal...');
        try {
            const fileInput = document.getElementById('selectFile');
            const fields = [
                { 
                    name: 'File', 
                    value: fileInput.files.length > 0 ? 
                        `${fileInput.files[0].name} (${utils.formatFileSize(fileInput.files[0].size)})` : 
                        'No file selected' 
                },
                { name: 'Operation', value: $('#operation').val() },
                { name: 'Device Type', value: $('#deviceType').val() },
                { name: 'Serial Number', value: $('#serialNumber').val() },
                { name: 'Item Number', value: $('#itemNumber').val() },
                { name: 'Sub Number', value: $('#subNumber').val() },
                { name: 'Collection', value: $('#collection').val() },
                { name: 'Platform', value: $('#platform').val() },
                { name: 'Date of Collection', value: $('#dateOfCollection').val() },
                { name: 'Known Passwords', value: $('#knownPasswords').val() },
                { name: 'Notes', value: $('#notes').val() },
                { name: 'Rename File', value: $('#renameFileCheck').is(':checked') ? 'Yes' : 'No' },
                { name: 'New File Name', value: $('#renamePreview').val() },
                { name: 'Processing Method', value: $('#processingMethod').val() }
            ];

            const confirmationTableBody = $('#confirmationTableBody');
            confirmationTableBody.empty();

            fields.forEach((field, index) => {
                const row = `<tr>
                    <td>${field.name}</td>
                    <td class="from-value">${field.value}</td>
                    <td class="reviewed-column">
                        <input type="checkbox" class="review-checkbox form-check-input" data-index="${index}">
                    </td>
                </tr>`;
                confirmationTableBody.append(row);
            });

            $('#confirmSubmit').prop('disabled', true);

        } catch (error) {
            console.error('Error populating confirmation modal:', error);
            alert('Error preparing confirmation dialog. Please try again.');
        }
    },

    showCompletionInfo: function(info) {
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
                            Complete
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
                this.hideProgressModal();
                window.location.href = '/';
            });
            
        } catch (error) {
            console.error('Error showing completion info:', error);
            this.updateProgress('Error displaying completion information', 'error');
        }
    },

    bindEventHandlers: function() {
        console.log('Binding modal event handlers...');

        // Cancel upload handler
        $('#cancelUpload').off('click').on('click', async (e) => {
            e.preventDefault();
            console.log('Cancel button clicked');
            
            const button = $('#cancelUpload');
            button.prop('disabled', true);
            
            try {
                if (!this.state.isUploading) {
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
                this.state.isUploading = false;
                
                button.addClass('d-none');
                $('#completeButton').removeClass('d-none')
                    .off('click')
                    .on('click', () => {
                        this.hideProgressModal();
                        window.location.href = '/';
                    });
                
            } catch (error) {
                console.error('Error cancelling upload:', error);
                this.updateProgress('Error cancelling upload: ' + error.message, 'error');
            } finally {
                button.prop('disabled', false);
            }
        });

        // Review checkbox handler
        $(document).off('change', '.review-checkbox').on('change', '.review-checkbox', () => {
            const totalCheckboxes = $('.review-checkbox').length;
            const checkedCheckboxes = $('.review-checkbox:checked').length;
            $('#confirmSubmit').prop('disabled', !(totalCheckboxes > 0 && checkedCheckboxes === totalCheckboxes));
        });

        // Debug check for button existence
        if ($('#cancelUpload').length === 0) {
            console.error('Cancel button not found in DOM');
        } else {
            console.log('Cancel button found and handler attached');
        }
    }
};

// Initialize modal handlers when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing modal handlers');
    modalHandlers.bindEventHandlers();
});

// Make modalHandlers available globally
window.modalHandlers = modalHandlers;