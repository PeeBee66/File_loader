// script.js

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

$(document).ready(function () {
    // Set default processing method on page load
    $('#processingMethod').val('Normal');

    // Prefill button logic
    $('#preFill').on('click', function () {
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
        updateRenamePreview();
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

    // Update rename preview on changes
    $('#operation, #itemNumber, #subNumber, #deviceType, #dateOfCollection').on('input change', updateRenamePreview);

    // Rename file checkbox logic
    $('#renameFileCheck').on('change', updateRenamePreview);
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