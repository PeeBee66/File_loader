// modal-handlers.js
const modalHandlers = {
    showProgressModal: function(initialMessage = 'Initializing...') {
        $('#progressBar')
            .css('width', '0%')
            .attr('aria-valuenow', 0)
            .removeClass('progress-bar-striped progress-bar-animated');
        $('#progressText').text(initialMessage);
        $('#progressDetails').text('');
        $('#completionInfo').addClass('d-none');
        $('#cancelUpload').removeClass('d-none');
        $('#completeButton').addClass('d-none');
        $('#progressModal').modal('show');
    },

    updateProgress: function(message, progress) {
        const progressBar = $('#progressBar');
        const progressText = $('#progressText');
        
        if (progress === 'calculating' || progress === 'checking' || progress === 'verifying') {
            progressBar.addClass('progress-bar-striped progress-bar-animated')
                .css('width', '100%')
                .attr('aria-valuenow', 100);
            progressText.text(message);
        } else if (typeof progress === 'number') {
            progressBar.removeClass('progress-bar-striped progress-bar-animated')
                .css('width', `${Math.round(progress)}%`)
                .attr('aria-valuenow', Math.round(progress));
            progressText.text(`${message} ${Math.round(progress)}%`);
        }
    },

    showCompletionInfo: function(info) {
        $('#completionInfo').removeClass('d-none');
        $('#origFilename').text(info.originalFilename);
        $('#newFilename').text(info.newFilename);
        $('#origHash').text(info.originalHash);
        $('#newHash').text(info.newHash);
        $('#fileSize').text(utils.formatFileSize(info.fileSize));
        
        const verificationBadge = info.verified ? 
            '<div class="badge bg-success p-2 fs-6">Verified</div>' :
            '<div class="badge bg-danger p-2 fs-6">Not Verified</div>';
        $('#verificationStatus').html(verificationBadge);
        
        $('#cancelUpload').addClass('d-none');
        $('#completeButton').removeClass('d-none');
    }
};