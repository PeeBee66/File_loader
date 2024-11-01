// modal-handlers/index.js
const modalHandlers = {
    ...modalState,
    ...progressModalHandler,
    ...confirmationModalHandler,
    ...modalCompletionHandler,

    initialize() {
        console.log('Initializing modal handlers');
        this.resetState();
        this.bindEventHandlers();
    },

    bindEventHandlers() {
        console.log('Binding modal event handlers...');

        // Review checkbox handler
        $(document).off('change', '.review-checkbox').on('change', '.review-checkbox', () => {
            const totalCheckboxes = $('.review-checkbox').length;
            const checkedCheckboxes = $('.review-checkbox:checked').length;
            $('#confirmSubmit').prop('disabled', !(totalCheckboxes > 0 && checkedCheckboxes === totalCheckboxes));
        });

        // Debug check for button existence
        if ($('#cancelUpload').length === 0) {
            console.error('Cancel button not found in DOM');
        } else {
            console.log('Cancel button found and handler attached');
        }
    }
};

// Initialize modal handlers when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing modal handlers');
    modalHandlers.initialize();
});

// Make modalHandlers available globally
window.modalHandlers = modalHandlers;