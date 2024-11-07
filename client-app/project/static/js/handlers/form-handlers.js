// handlers/form-handlers.js
const formHandlers = {
    isSubmitting: false,

    initialize() {
        console.log('Initializing form handlers...');
        this.bindEventHandlers();
        this.initializeFormState();
    },

    initializeFormState() {
        console.log('Setting initial form state...');
        $('#processingMethod').val('Normal');
        const today = new Date().toISOString().split('T')[0];
        $('#dateOfCollection').val(today);
    },

    bindEventHandlers() {
        console.log('Binding event handlers...');
        
        // Pre-fill button handler
        $('#preFill').off('click').on('click', (e) => {
            console.log('Pre-fill button clicked');
            e.preventDefault();
            this.handlePreFill();
        });

        // File input handler
        $('#selectFile').off('change').on('change', () => {
            this.handleFileSelect();
        });

        // Form field change handlers
        $('#operation, #itemNumber, #subNumber, #deviceType, #dateOfCollection')
            .off('input change')
            .on('input change', () => {
                this.updateRenamePreview();
            });

        // Rename checkbox handler
        $('#renameFileCheck').off('change').on('change', () => {
            this.updateRenamePreview();
        });

        // Submit button handler
        $('#openConfirmationModal').off('click').on('click', (e) => {
            this.handleOpenConfirmationModal(e);
        });

        // Review checkboxes handler
        $(document).off('change', '.review-checkbox').on('change', '.review-checkbox', () => {
            this.updateSubmitButtonState();
        });

        // Cancel handlers
        $('#cancelReview').off('click').on('click', () => {
            modalHandlers.hideConfirmationModal();
        });

        $('#cancelUpload').off('click').on('click', () => {
            this.handleCancelUpload();
        });

        $('#completeButton').off('click').on('click', () => {
            // Don't auto-hide or redirect
            if (confirm('Are you sure you want to return to home?')) {
                modalHandlers.hideProgressModal();
                window.location.href = '/';
            }
        });

        this.initializeSecretSequence();
    },

    handlePreFill() {
        console.log('Executing pre-fill');
        $('#operation').val('Sample Operation');
        $('#deviceType').val('laptop');
        $('#serialNumber').val('12345');
        $('#itemNumber').val('001');
        $('#subNumber').val('1');
        $('#collection').val('red');
        $('#platform').val('red');
        $('#knownPasswords').val('password1,password2');
        $('#notes').val('Sample notes for data ingestion.');
        $('#processingMethod').val('Normal');
        
        this.updateRenamePreview();
    },

    handleFileSelect() {
        const fileInput = $('#selectFile')[0];
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            $('#fileName').val(file.name);
            $('#fileSize').text(utils.formatFileSize(file.size));
            this.updateRenamePreview();
            this.checkFileSize(file);
        } else {
            $('#fileName').val('');
            $('#fileSize').text('');
            $('#fileSizeMessage').text(`Maximum upload size is ${maxFileSizeGB} GB`);
        }
    },

    checkFileSize(file) {
        const fileSizeInGB = file.size / (1024 * 1024 * 1024);
        const maxFileSizeGB = window.maxFileSizeGB || 200;
        const fileSizeMessage = $('#fileSizeMessage');
        
        if (fileSizeInGB > maxFileSizeGB) {
            fileSizeMessage
                .text(`File is too large. Maximum size is ${maxFileSizeGB} GB. Your file is ${fileSizeInGB.toFixed(2)} GB.`)
                .addClass('text-danger');
            $('#selectFile').val('');
            $('#fileName').val('');
            $('#fileSize').text('');
            return false;
        } else {
            fileSizeMessage
                .text(`File size: ${utils.formatFileSize(file.size)} (Max: ${maxFileSizeGB} GB)`)
                .removeClass('text-danger');
            return true;
        }
    },

    updateRenamePreview() {
        console.log('Updating rename preview');
        const operation = $('#operation').val().replace(/\s+/g, '_');
        const itemNumber = $('#itemNumber').val();
        const subNumber = $('#subNumber').val();
        const deviceType = $('#deviceType').val();
        const collectionDate = $('#dateOfCollection').val();
        const fileInput = $('#selectFile')[0];
        let fileExtension = '';

        if (fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name;
            const lastDotIndex = fileName.lastIndexOf('.');
            if (lastDotIndex !== -1) {
                fileExtension = fileName.substring(lastDotIndex);
            }
        }

        const renamePreview = `${operation}_${itemNumber}-${subNumber}_${deviceType}_${collectionDate}${fileExtension}`;
        console.log('New rename preview:', renamePreview);
        $('#renamePreview').val(renamePreview);
    },

    handleOpenConfirmationModal(e) {
        console.log('Handling confirmation modal open');
        e.preventDefault();
        
        if (!$('#selectFile')[0].files.length) {
            alert('Please select a file first');
            return;
        }

        if (!this.validateForm()) {
            return;
        }

        this.updateRenamePreview();
        modalHandlers.populateConfirmationModal();
        modalHandlers.showConfirmationModal();
    },

    validateForm() {
        const required = ['operation', 'deviceType', 'itemNumber', 'subNumber', 'dateOfCollection'];
        let isValid = true;

        required.forEach(fieldId => {
            const field = $(`#${fieldId}`);
            if (!field.val()) {
                alert(`Please fill in the ${fieldId.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                isValid = false;
            }
        });

        return isValid;
    },

    updateSubmitButtonState() {
        const totalCheckboxes = $('.review-checkbox').length;
        const checkedCheckboxes = $('.review-checkbox:checked').length;
        const allChecked = totalCheckboxes > 0 && checkedCheckboxes === totalCheckboxes;
        $('#confirmSubmit').prop('disabled', !allChecked);
    },

    handleCancelUpload() {
        if (!confirm('Are you sure you want to cancel the upload?')) {
            return;
        }

        const currentUpload = window.fileProcessing.getCurrentUpload();
        if (currentUpload) {
            modalHandlers.updateProgress('Cancelling upload...', 'calculating');
            currentUpload.abort();
        }
    },

    initializeSecretSequence() {
        console.log('Initializing secret sequence handler');
        let secretSequence = '';
        $(document).off('keypress').on('keypress', (e) => {
            secretSequence += String.fromCharCode(e.which);
            if (secretSequence.endsWith('xxx')) {
                console.log('Secret sequence activated!');
                $('.review-checkbox').prop('checked', true);
                this.updateSubmitButtonState();
                secretSequence = '';
            }
            if (secretSequence.length > 10) {
                secretSequence = '';
            }
        });
    },

    resetSubmissionState() {
        this.isSubmitting = false;
    },

    handleSubmissionError(error) {
        console.error('Submission error:', error);
        modalHandlers.updateProgress(error.message || 'Submission failed', 'error');
        this.isSubmitting = false;
    }
};

// Initialize handlers when document is ready
$(document).ready(() => {
    console.log('Document ready - initializing form handlers');
    formHandlers.initialize();
});

// Make formHandlers available globally
window.formHandlers = formHandlers;