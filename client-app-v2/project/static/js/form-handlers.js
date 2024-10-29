// form-handlers.js
let currentUpload = null;
let currentFolderName = null;

const formHandlers = {
    initialize: function() {
        this.bindEventHandlers();
        this.initializeFormState();
    },

    initializeFormState: function() {
        $('#processingMethod').val('Normal');
        const today = new Date().toISOString().split('T')[0];
        $('#dateOfCollection').val(today);
    },

    bindEventHandlers: function() {
        // Pre-fill button handler
        $('#preFill').on('click', this.handlePreFill.bind(this));

        // File input handler
        $('#selectFile').on('change', this.handleFileSelect.bind(this));

        // Form field change handlers
        $('#operation, #itemNumber, #subNumber, #deviceType, #dateOfCollection')
            .on('input change', this.updateRenamePreview.bind(this));

        // Rename checkbox handler
        $('#renameFileCheck').on('change', this.updateRenamePreview.bind(this));

        // Open confirmation modal handler
        $('#openConfirmationModal').on('click', this.handleOpenConfirmationModal.bind(this));

        // Confirmation modal handlers
        $(document).on('change', '.review-checkbox', this.updateSubmitButtonState);
        $('#confirmSubmit').on('click', this.handleConfirmSubmit.bind(this));
        $('#cancelReview').on('click', () => $('#confirmationModal').modal('hide'));

        // Progress modal handlers
        $('#cancelUpload').on('click', this.handleCancelUpload.bind(this));
        $('#completeButton').on('click', () => $('#progressModal').modal('hide'));

        // Secret sequence handler for testing
        this.initializeSecretSequence();
    },

    handlePreFill: function(e) {
        e.preventDefault();
        
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

    handleFileSelect: function() {
        const fileInput = this[0];
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            $('#fileName').val(file.name);
            $('#fileSize').text(utils.formatFileSize(file.size));
            this.updateRenamePreview();
            this.checkFileSize(file);
        }
    },

    checkFileSize: function(file) {
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
        } else {
            fileSizeMessage
                .text(`File size: ${utils.formatFileSize(file.size)} (Max: ${maxFileSizeGB} GB)`)
                .removeClass('text-danger');
        }
    },

    updateRenamePreview: function() {
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
        $('#renamePreview').val(renamePreview);
    },

    handleOpenConfirmationModal: function(e) {
        e.preventDefault();
        
        if (!$('#selectFile')[0].files.length) {
            alert('Please select a file first');
            return;
        }
        
        this.updateRenamePreview();
        this.populateConfirmationModal();
        $('#confirmationModal').modal('show');
    },

    populateConfirmationModal: function() {
        const fileInput = document.getElementById('selectFile');
        const fields = [
            { name: 'File', value: fileInput.files.length > 0 ? `${fileInput.files[0].name} (${utils.formatFileSize(fileInput.files[0].size)})` : 'No file selected' },
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
    },

    updateSubmitButtonState: function() {
        const totalCheckboxes = $('.review-checkbox').length;
        const checkedCheckboxes = $('.review-checkbox:checked').length;
        const allChecked = totalCheckboxes > 0 && checkedCheckboxes === totalCheckboxes;
        $('#confirmSubmit').prop('disabled', !allChecked);
    },

    handleConfirmSubmit: async function(e) {
        e.preventDefault();
        
        const fileInput = $('#selectFile')[0];
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Please select a file');
            return;
        }

        const renameFileChecked = $('#renameFileCheck').is(':checked');
        const newFilename = renameFileChecked ? $('#renamePreview').val() : file.name;
        const currentTime = new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        }).replace(':', '');
        
        const folderName = `${$('#renamePreview').val().split('.')[0]}_${currentTime}`;
        currentFolderName = folderName;

        const metadata = {
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
            system: window.systemName,
            folder_name: folderName
        };

        try {
            $('#confirmationModal').modal('hide');
            modalHandlers.showProgressModal();
            
            currentUpload = new AbortController();
            
            const result = await fileProcessing.processFile(file, metadata);
            
            if (!result.verified) {
                throw new Error('File verification failed');
            }
            
        } catch (error) {
            console.error('Processing error:', error);
            if (error.name === 'AbortError') {
                console.log('Upload was cancelled by user');
                try {
                    await fileProcessing.cancelUploadOnServer(currentFolderName);
                    alert('Upload cancelled and files cleaned up.');
                } catch (cleanupError) {
                    console.error('Error cleaning up cancelled upload:', cleanupError);
                    alert('Upload cancelled but cleanup failed. Please contact administrator.');
                }
            } else {
                alert(`Error processing file: ${error.message}`);
            }
            $('#progressModal').modal('hide');
        } finally {
            currentUpload = null;
            currentFolderName = null;
        }
    },

    handleCancelUpload: async function() {
        if (currentUpload) {
            $('#progressText').text('Cancelling upload...');
            currentUpload.abort();
        }
    },

    initializeSecretSequence: function() {
        let secretSequence = '';
        $(document).on('keypress', function(e) {
            secretSequence += String.fromCharCode(e.which);
            if (secretSequence.endsWith('xxx')) {
                $('.review-checkbox').prop('checked', true);
                formHandlers.updateSubmitButtonState();
                secretSequence = '';
            }
            if (secretSequence.length > 10) {
                secretSequence = '';
            }
        });
    }
};

// Initialize handlers when document is ready
$(document).ready(() => {
    formHandlers.initialize();
});

// Export handlers for global use
window.modalHandlers = modalHandlers;
window.formHandlers = formHandlers;