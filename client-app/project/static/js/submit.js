// submit.js

$(document).ready(function () {
    // Event listener for open confirmation modal button
    $('#openConfirmationModal').on('click', function () {
        updateRenamePreview();
        populateConfirmationModal();
    });

    // Function to populate the confirmation modal
    function populateConfirmationModal() {
        const fileInput = document.getElementById('selectFile');
        const fields = [
            { name: 'File', value: fileInput.files.length > 0 ? `${fileInput.files[0].name} (${formatFileSize(fileInput.files[0].size)})` : 'No file selected' },
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

        let confirmationTableBody = $('#confirmationTableBody');
        confirmationTableBody.empty();

        fields.forEach((field, index) => {
            let row = `<tr>
                <td>${field.name}</td>
                <td class="from-value">${field.value}</td>
                <td class="reviewed-column">
                    <input type='checkbox' class='review-checkbox' data-index='${index}'>
                </td>
            </tr>`;
            confirmationTableBody.append(row);
        });

        // Reset submit button state
        $('#confirmSubmit').prop('disabled', true);

        // Add event listeners to checkboxes
        $('.review-checkbox').on('change', updateSubmitButtonState);

        $('#confirmationModal').modal('show');
    }

    // Function to update submit button state
    function updateSubmitButtonState() {
        const allChecked = $('.review-checkbox:checked').length === $('.review-checkbox').length;
        $('#confirmSubmit').prop('disabled', !allChecked);
    }

    // Submit button logic
    $('#confirmSubmit').on('click', async function () {
        const fileInput = $('#selectFile')[0];
        const file = fileInput.files[0];
        const renameFileChecked = $('#renameFileCheck').is(':checked');
        const newFilename = renameFileChecked ? $('#renamePreview').val() : file.name;
        const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        const folderName = `${$('#renamePreview').val().split('.')[0]}_${currentTime.replace(':', '')}`;

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
            showProgressModal();
            console.log('Starting file upload with metadata:', metadata);
            const result = await uploadFile(file, metadata, updateProgress);
            $('#progressModal').modal('hide');
            console.log('Upload result:', result);
            
            let successMessage = `File uploaded successfully!`;
            if (result.renamed) {
                successMessage += ` The file was renamed to "${result.file}".`;
            }
            successMessage += `\nFull path: ${result.full_path}`;
            
            alert(successMessage);
        } catch (error) {
            console.error('Error details:', error);
            $('#progressModal').modal('hide');
            let errorMessage = 'An error occurred while uploading the file.';
            if (error.message) {
                errorMessage += ' Error message: ' + error.message;
            }
            if (error.response) {
                try {
                    const errorBody = await error.response.text();
                    console.error('Error response body:', errorBody);
                    const errorJson = JSON.parse(errorBody);
                    if (errorJson.error) {
                        errorMessage += ' Server error: ' + errorJson.error;
                    }
                    if (errorJson.traceback) {
                        console.error('Server traceback:', errorJson.traceback);
                    }
                } catch (e) {
                    console.error('Could not parse error response:', e);
                }
            }
            alert(errorMessage);
        }
    });

    // Function to show progress modal
    function showProgressModal() {
        $('#progressBar').css('width', '0%').attr('aria-valuenow', 0);
        $('#progressText').text('Uploading... 0%');
        $('#progressModal').modal('show');
    }

    // Function to update progress
    function updateProgress(progress) {
        $('#progressBar').css('width', `${progress}%`).attr('aria-valuenow', progress);
        $('#progressText').text(`Uploading... ${Math.round(progress)}%`);
    }

    // Helper function to format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Cancel review button logic
    $('#cancelReview').on('click', function () {
        $('#confirmationModal').modal('hide');
    });

    // Secret sequence to check all boxes
    let secretSequence = '';
    $(document).on('keypress', function(e) {
        secretSequence += String.fromCharCode(e.which);
        if (secretSequence.endsWith('xxx')) {
            $('.review-checkbox').prop('checked', true);
            updateSubmitButtonState();
            secretSequence = '';
        }
        if (secretSequence.length > 10) secretSequence = '';
    });

    // Function to update rename preview
    function updateRenamePreview() {
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
    }

    // Update rename preview on changes
    $('#operation, #itemNumber, #subNumber, #deviceType, #dateOfCollection, #selectFile').on('input change', updateRenamePreview);

    // Rename file checkbox logic
    $('#renameFileCheck').on('change', updateRenamePreview);
});