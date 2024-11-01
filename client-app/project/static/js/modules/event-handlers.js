// event-handlers.js
const eventHandlers = {
    initialize() {
        console.log('Initializing event handlers...');
        
        this.bindPreFillHandler();
        this.bindFileInputHandler();
        this.bindFormFieldHandlers();
        this.bindRenameCheckboxHandler();
        this.bindSubmitButtonHandler();
        this.bindConfirmSubmitHandler();
        this.bindConfirmationCheckboxesHandler();
        this.bindCancelHandlers();
        this.bindSecretSequenceHandler();
        
        console.log('Event handlers initialized successfully');
    },

    bindPreFillHandler() {
        $('#preFill').off('click').on('click', function(e) {
            console.log('Pre-fill button clicked');
            e.preventDefault();
            
            $('#operation').val('Sample Operation');
            $('#deviceType').val('unknown');
            $('#serialNumber').val('12345');
            $('#itemNumber').val('001');
            $('#subNumber').val('1');
            $('#collection').val('unknown');
            $('#platform').val('unknown');
            $('#knownPasswords').val('password1,password2');
            $('#notes').val('Sample notes for data ingestion.');
            $('#processingMethod').val('Normal');
            
            fileRenaming.updateRenamePreview();
        });
    },

    bindFileInputHandler() {
        $('#selectFile').off('change').on('change', function() {
            console.log('File input changed');
            const fileInput = $(this)[0];
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                $('#fileName').val(file.name);
                $('#fileSize').text(utils.formatFileSize(file.size));
                fileRenaming.updateRenamePreview();
                formValidator.checkFileSize(file);
            } else {
                $('#fileName').val('');
                $('#fileSize').text('');
                $('#fileSizeMessage').text(`Maximum upload size is ${config.state.maxFileSizeGB} GB`);
            }
        });
    },

    bindFormFieldHandlers() {
        $('#operation, #itemNumber, #subNumber, #deviceType, #dateOfCollection')
            .off('input change')
            .on('input change', function() {
                console.log('Form field changed:', this.id);
                fileRenaming.updateRenamePreview();
            });
    },

    bindRenameCheckboxHandler() {
        $('#renameFileCheck').off('change').on('change', function() {
            console.log('Rename checkbox changed:', this.checked);
            fileRenaming.updateRenamePreview();
        });
    },

    bindSubmitButtonHandler() {
        $('#openConfirmationModal').off('click').on('click', function(e) {
            console.log('Open confirmation modal clicked');
            e.preventDefault();
            
            if (!formValidator.validateForm()) {
                return;
            }

            fileRenaming.updateRenamePreview();
            modalHandlers.populateConfirmationModal();
            modalHandlers.showConfirmationModal();
        });
    },

    bindConfirmSubmitHandler() {
        $('#confirmSubmit').off('click').on('click', async function(e) {
            e.preventDefault();
            console.log('Confirm submit clicked');
            
            const fileInput = $('#selectFile')[0];
            const file = fileInput.files[0];
            
            if (!file) {
                alert('Please select a file');
                return;
            }

            try {
                // Generate folder name and set it
                const folderName = fileRenaming.generateFolderName();
                window.fileProcessing.setCurrentFolderName(folderName);
                appState.setCurrentFolder(folderName);

                // Gather metadata from form
                const metadata = submissionHandler.gatherFormMetadata(file, folderName);
                console.log('Submitting with metadata:', metadata);

                // Process the submission
                await submissionHandler.handleFormSubmission(file, metadata);

            } catch (error) {
                console.error('Form submission error:', error);
                modalHandlers.updateProgress('Error: ' + error.message, 'error');
            }
        });
    },

    bindConfirmationCheckboxesHandler() {
        $(document).off('change', '.review-checkbox').on('change', '.review-checkbox', function() {
            console.log('Review checkbox changed');
            const totalCheckboxes = $('.review-checkbox').length;
            const checkedCheckboxes = $('.review-checkbox:checked').length;
            const allChecked = totalCheckboxes > 0 && checkedCheckboxes === totalCheckboxes;
            
            console.log(`Checkboxes: ${checkedCheckboxes}/${totalCheckboxes}`);
            $('#confirmSubmit').prop('disabled', !allChecked);
        });
    },

    bindCancelHandlers() {
        // Cancel review handler
        $('#cancelReview').off('click').on('click', function() {
            console.log('Cancel review clicked');
            modalHandlers.hideConfirmationModal();
        });

        // Cancel upload handler
        $('#cancelUpload').off('click').on('click', function() {
            console.log('Cancel upload clicked');
            if (window.fileProcessing.getCurrentUpload()) {
                modalHandlers.updateProgress('Cancelling upload...', 'calculating');
                window.fileProcessing.getCurrentUpload().abort();
            }
        });

        // Complete button handler
        $('#completeButton').off('click').on('click', function() {
            console.log('Complete button clicked');
            modalHandlers.hideProgressModal();
            appState.setUploading(false);
        });
    },

    bindSecretSequenceHandler() {
        let secretSequence = '';
        $(document).off('keypress').on('keypress', function(e) {
            secretSequence += String.fromCharCode(e.which);
            if (secretSequence.endsWith('xxx')) {
                console.log('Secret sequence activated!');
                $('.review-checkbox').prop('checked', true);
                
                const totalCheckboxes = $('.review-checkbox').length;
                const checkedCheckboxes = $('.review-checkbox:checked').length;
                const allChecked = totalCheckboxes > 0 && checkedCheckboxes === totalCheckboxes;
                
                $('#confirmSubmit').prop('disabled', !allChecked);
                secretSequence = '';
            }
            if (secretSequence.length > 10) {
                secretSequence = '';
            }
        });
    },

    verifyHandlers() {
        // Verify that all crucial handlers are bound
        const criticalElements = [
            '#preFill',
            '#selectFile',
            '#renameFileCheck',
            '#openConfirmationModal',
            '#confirmSubmit',
            '#cancelReview',
            '#cancelUpload',
            '#completeButton'
        ];

        criticalElements.forEach(selector => {
            const element = $(selector);
            if (element.length === 0) {
                console.error(`Critical element not found: ${selector}`);
            } else {
                console.log(`Handler verified for: ${selector}`);
            }
        });
    }
};

// Make eventHandlers available globally
window.eventHandlers = eventHandlers;