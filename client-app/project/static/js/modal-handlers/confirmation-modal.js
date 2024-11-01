// modal-handlers/confirmation-modal.js
const confirmationModalHandler = {
    showConfirmationModal() {
        console.log('Showing confirmation modal');
        try {
            const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'), {
                backdrop: 'static',
                keyboard: false
            });
            confirmationModal.show();
            modalState.state.isConfirmationModalShown = true;
            
            // Reset checkbox states
            $('.review-checkbox').prop('checked', false);
            $('#confirmSubmit').prop('disabled', true);

        } catch (error) {
            console.error('Error showing confirmation modal:', error);
            alert('Error showing confirmation dialog. Please try again.');
        }
    },

    hideConfirmationModal() {
        console.log('Hiding confirmation modal');
        try {
            const confirmationModal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
            if (confirmationModal) {
                confirmationModal.hide();
                modalState.state.isConfirmationModalShown = false;
            }
        } catch (error) {
            console.error('Error hiding confirmation modal:', error);
        }
    },

    populateConfirmationModal() {
        console.log('Populating confirmation modal...');
        try {
            const fileInput = document.getElementById('selectFile');
            const fields = [
                { 
                    name: 'File', 
                    value: fileInput.files.length > 0 ? 
                        `${fileInput.files[0].name} (${utils.formatFileSize(fileInput.files[0].size)})` : 
                        'No file selected' 
                },
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

        } catch (error) {
            console.error('Error populating confirmation modal:', error);
            alert('Error preparing confirmation dialog. Please try again.');
        }
    }
};