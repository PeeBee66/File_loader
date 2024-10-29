// project/static/js/script.js

let fileSaveLocation;
let maxFileSizeGB;
let systemName;

// Fetch configuration from the server
fetch('/config')
    .then(response => response.json())
    .then(config => {
        fileSaveLocation = config.UPLOAD_FOLDER;
        maxFileSizeGB = config.MAX_FILE_SIZE / (1024 * 1024 * 1024); // Convert bytes to GB
        systemName = config.SYSTEM_NAME;
        $('#fileSizeMessage').text(`Maximum upload size is ${maxFileSizeGB} GB`);
    })
    .catch(error => console.error('Error fetching config:', error));

// Wait for document to be ready
$(document).ready(function () {
    console.log('Document ready - initializing handlers');
    
    // Initialize default values
    $('#processingMethod').val('Normal');
    
    // Pre-fill button handler
    $('#preFill').on('click', function(e) {
        console.log('Pre-fill button clicked');
        e.preventDefault();
        
        $('#operation').val('Sample Operation');
        $('#deviceType').val('unknown');
        $('#serialNumber').val('12345');
        $('#itemNumber').val('001');
        $('#subNumber').val('1');
        $('#collection').val('unknown');
        $('#platform').val('unknown');
        $('#dateOfCollection').val(new Date().toISOString().split('T')[0]);
        $('#knownPasswords').val('password1,password2');
        $('#notes').val('Sample notes for data ingestion.');
        $('#processingMethod').val('Normal');
        
        // Trigger rename preview update
        updateRenamePreview();
        
        console.log('Pre-fill completed');
    });

    // Submit button handler
    $('#openConfirmationModal').on('click', function(e) {
        console.log('Submit button clicked');
        e.preventDefault();
        
        // Check if file is selected
        if (!$('#selectFile')[0].files.length) {
            alert('Please select a file first');
            return;
        }
        
        updateRenamePreview();
        modalHandlers.populateConfirmationModal();
    });

    // File input change handler
    $('#selectFile').on('change', function () {
        const fileInput = $(this)[0];
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            $('#fileName').val(file.name);
            $('#fileSize').text(utils.formatFileSize(file.size));
            updateRenamePreview();
            checkFileSize(file);
        } else {
            $('#fileName').val('');
            $('#fileSize').text('');
            $('#fileSizeMessage').text(`Maximum upload size is ${maxFileSizeGB} GB`).removeClass('text-danger');
        }
    });

    // Form field change handlers
    $('#operation, #itemNumber, #subNumber, #deviceType, #dateOfCollection').on('input change', function() {
        console.log('Form field changed, updating preview');
        updateRenamePreview();
    });

    // Rename checkbox handler
    $('#renameFileCheck').on('change', function() {
        console.log('Rename checkbox changed');
        updateRenamePreview();
    });

    // Submit confirmation handler
    $('#confirmSubmit').on('click', async function(e) {
        console.log('Confirm submit clicked');
        e.preventDefault();

        const fileInput = $('#selectFile')[0];
        const file = fileInput.files[0];
        if (!file) {
            alert('Please select a file');
            return;
        }

        const renameFileChecked = $('#renameFileCheck').is(':checked');
        const newFilename = renameFileChecked ? $('#renamePreview').val() : file.name;
        const currentTime = utils.getTimestamp();
        const folderName = `${$('#renamePreview').val().split('.')[0]}_${currentTime}`;

        fileProcessing.setCurrentFolderName(folderName);

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
            system: systemName,
            folder_name: folderName
        };

        try {
            $('#confirmationModal').modal('hide');
            modalHandlers.showProgressModal();
            
            fileProcessing.setCurrentUpload(new AbortController());
            console.log('Starting file processing');
            
            const result = await fileProcessing.processFile(file, metadata);
            
            if (!result.verified) {
                throw new Error('File verification failed');
            }
            
        } catch (error) {
            console.error('Processing error:', error);
            if (error.name === 'AbortError') {
                console.log('Upload was cancelled by user');
                try {
                    await fileProcessing.cancelUploadOnServer(fileProcessing.getCurrentFolderName());
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
            fileProcessing.setCurrentUpload(null);
            fileProcessing.setCurrentFolderName(null);
        }
    });
});

// File size checking function
function checkFileSize(file) {
    const fileSizeInGB = file.size / (1024 * 1024 * 1024);
    const fileSizeMessage = $('#fileSizeMessage');
    
    if (fileSizeInGB > maxFileSizeGB) {
        fileSizeMessage.text(`File is too large. Maximum size is ${maxFileSizeGB} GB. Your file is ${fileSizeInGB.toFixed(2)} GB.`).addClass('text-danger');
        $('#selectFile').val(''); // Clear the file input
        $('#fileName').val(''); // Clear the file name field
        $('#fileSize').text(''); // Clear the file size
    } else {
        fileSizeMessage.text(`File size: ${utils.formatFileSize(file.size)} (Max: ${maxFileSizeGB} GB)`).removeClass('text-danger');
    }
}

// Rename preview update function
function updateRenamePreview() {
    console.log('Updating rename preview');
    const operation = $('#operation').val().replace(/\s+/g, '_');
    const itemNumber = $('#itemNumber').val();
    const subNumber = $('#subNumber').val();
    const deviceType = $('#deviceType').val();
    const collectionDate = $('#dateOfCollection').val();
    const fileInput = $('#selectFile')[0];
    let fileExtension = utils.getFileExtension(fileInput.files[0]?.name || '');

    const renamePreview = `${operation}_${itemNumber}-${subNumber}_${deviceType}_${collectionDate}${fileExtension}`;
    console.log('New rename preview:', renamePreview);
    $('#renamePreview').val(renamePreview);
}