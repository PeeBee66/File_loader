// form-validator.js
const formValidator = {
    checkFileSize(file) {
        const fileSizeInGB = file.size / (1024 * 1024 * 1024);
        const fileSizeMessage = $('#fileSizeMessage');
        const maxFileSizeGB = config.state.maxFileSizeGB;
        
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

    validateForm() {
        const fileInput = $('#selectFile')[0];
        if (!fileInput.files.length) {
            alert('Please select a file first');
            return false;
        }
        return true;
    }
};
