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
                    modalState.state.processingStatus = 'cancelled';
                    modalState.state.isUploading = false;
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
                    modalState.state.processingStatus = 'error';
                    modalState.state.isUploading = false;
                    break;

                default:
                    if (typeof progress === 'number') {
                        modalState.state.currentProgress = progress;
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

    bindCancelHandler() {
        $('#cancelUpload').off('click').on('click', async (e) => {
            e.preventDefault();
            console.log('Cancel button clicked');
            
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
    }
};