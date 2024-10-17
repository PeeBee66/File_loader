const fileSaveLocation = 'F:\\pipline_output';  // Sinbin location
const maxFileSizeGB = 20; // Maximum file size in GB
const systemName = "XXX"; // TODO: Replace "XXX" with your actual system name

$(document).ready(function () {
    // Set default processing method on page load
    $('#processingMethod').val('Normal');

    // Prefill button logic
    $('#preFill').on('click', function () {
        $('#fileSizeMessage').text(`Maximum upload size is ${maxFileSizeGB} GB`);
        $('#operation').val('Sample Operation');
        $('#deviceType').val('windows');
        $('#serialNumber').val('12345');
        $('#itemNumber').val('001');
        $('#subNumber').val('1');
        $('#collection').val('blue');
        $('#platform').val('red');
        $('#dateOfCollection').val(new Date().toISOString().split('T')[0]);
        $('#knownPasswords').val('password1,password2');
        $('#notes').val('Sample notes for data ingestion.');
        $('#processingMethod').val('Normal'); // Set default processing method
    });

    // File input change event to update the file name field and check file size
    $('#selectFile').on('change', function () {
        const fileInput = $(this)[0];
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            $('#fileName').val(file.name);
            $('#fileSize').text(formatFileSize(file.size));
            updateRenamePreview();
            checkFileSize(file);
        } else {
            $('#fileName').val('');
            $('#fileSize').text('');
            $('#fileSizeMessage').text(`Maximum upload size is ${maxFileSizeGB} GB`).removeClass('text-danger');
        }
    });

    // Function to format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Function to check file size and display message
    function checkFileSize(file) {
        const fileSizeInGB = file.size / (1024 * 1024 * 1024);
        const fileSizeMessage = $('#fileSizeMessage');
        
        if (fileSizeInGB > maxFileSizeGB) {
            fileSizeMessage.text(`File is too large. Maximum size is ${maxFileSizeGB} GB. Your file is ${fileSizeInGB.toFixed(2)} GB.`).addClass('text-danger');
            $('#selectFile').val(''); // Clear the file input
            $('#fileName').val(''); // Clear the file name field
            $('#fileSize').text(''); // Clear the file size
        } else {
            fileSizeMessage.text(`File size: ${formatFileSize(file.size)} (Max: ${maxFileSizeGB} GB)`).removeClass('text-danger');
        }
    }

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
        return renamePreview;
    }

    // Update rename preview on changes
    $('#operation, #itemNumber, #subNumber, #deviceType, #dateOfCollection').on('input change', updateRenamePreview);

     // Event listener for submit button
     $('#openConfirmationModal').on('click', function () {
        const fileInput = document.getElementById('selectFile');
        const operation = document.getElementById('operation').value;
        const deviceType = document.getElementById('deviceType').value;
        const serialNumber = document.getElementById('serialNumber').value;
        const itemNumber = document.getElementById('itemNumber').value;
        const subNumber = document.getElementById('subNumber').value;
        const collection = document.getElementById('collection').value;
        const platform = document.getElementById('platform').value;
        const dateOfCollection = document.getElementById('dateOfCollection').value;
        const knownPasswords = document.getElementById('knownPasswords').value;
        const notes = document.getElementById('notes').value;
        const renameFileChecked = document.getElementById('renameFileCheck').checked;
        const processingMethod = document.getElementById('processingMethod').value;

        // Refresh rename preview
        const updatedRenamePreview = updateRenamePreview();

        let confirmationTableBody = document.getElementById('confirmationTableBody');
        confirmationTableBody.innerHTML = '';

        const fields = [
            { name: 'File', value: fileInput.files.length > 0 ? `${fileInput.files[0].name} (${formatFileSize(fileInput.files[0].size)})` : 'No file selected' },
            { name: 'Operation', value: operation },
            { name: 'Device Type', value: deviceType },
            { name: 'Serial Number', value: serialNumber },
            { name: 'Item Number', value: itemNumber },
            { name: 'Sub Number', value: subNumber },
            { name: 'Collection', value: collection },
            { name: 'Platform', value: platform },
            { name: 'Date of Collection', value: dateOfCollection },
            { name: 'Known Passwords', value: knownPasswords },
            { name: 'Notes', value: notes },
            { name: 'Rename File', value: renameFileChecked ? 'Yes' : 'No' },
            { name: 'New File Name', value: renameFileChecked ? updatedRenamePreview : 'N/A' },
            { name: 'Processing Method', value: processingMethod }
        ];

        fields.forEach((field, index) => {
            let row = `<tr>
                <td>${field.name}</td>
                <td>${field.value}</td>
                <td class="text-center">
                    <input type='checkbox' class='review-checkbox' data-index='${index}'>
                </td>
            </tr>`;
            confirmationTableBody.innerHTML += row;
        });

        // Reset submit button state
        $('#confirmSubmit').prop('disabled', true);

        // Add event listeners to checkboxes
        $('.review-checkbox').on('change', function() {
            updateSubmitButtonState();
        });

        const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
        confirmationModal.show();
    });

    // Function to update submit button state
    function updateSubmitButtonState() {
        const allChecked = $('.review-checkbox:checked').length === $('.review-checkbox').length;
        $('#confirmSubmit').prop('disabled', !allChecked);
    }

    // Cancel review button logic
    $('#cancelReview').on('click', function () {
        const confirmationModal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
        confirmationModal.hide();

        // Ensure modal backdrop is removed after cancel is clicked and restore scrolling
        $('body').removeClass('modal-open');
        $('.modal-backdrop').remove();
        $('body').css('overflow', 'auto');
    });

    // Function to show progress modal
    function showProgressModal() {
        const modalHtml = `
        <div class="modal fade" id="progressModal" tabindex="-1" aria-labelledby="progressModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="progressModalLabel">Processing File</h5>
                    </div>
                    <div class="modal-body">
                        <div id="progressText">Processing your file. Please wait...</div>
                        <div class="progress mt-3">
                            <div id="progressBar" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 100%;" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const progressModal = new bootstrap.Modal(document.getElementById('progressModal'));
        progressModal.show();
    }

    // Submit button logic
    $('#confirmSubmit').on('click', function () {
        const fileInput = $('#selectFile')[0];
        const originalFilename = fileInput.files.length > 0 ? fileInput.files[0].name : 'No file selected';
        const renameFileChecked = $('#renameFileCheck').is(':checked');
        const newFilename = renameFileChecked ? updateRenamePreview() : originalFilename;

        const jsonData = {
            uploaded_filename: originalFilename,
            current_filename: newFilename,
            fileSize: fileInput.files.length > 0 ? formatFileSize(fileInput.files[0].size) : 'N/A',
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
            renameFile: renameFileChecked ? 'Yes' : 'No',
            processingMethod: $('#processingMethod').val(),
            approved: 'No', // Default JSON option
            system: systemName,
            fileSaveLocation: fileSaveLocation
        };

        const formData = new FormData();
        formData.append('json', JSON.stringify(jsonData));
        
        if (fileInput.files.length > 0) {
            formData.append('file', fileInput.files[0]);
        }

        showProgressModal();

        fetch('/submit-data', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            $('#progressModal').modal('hide');
            if (data.success) {
                alert('Data and file submitted successfully!');
            } else {
                throw new Error(data.error || 'An error occurred while processing the file.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            $('#progressModal').modal('hide');
            alert(error.message || 'An error occurred while submitting the data and file.');
        });
    });
});