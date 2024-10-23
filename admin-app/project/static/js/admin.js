$(document).ready(function() {
    // Approve button click handler
    $('.approve-btn').on('click', function() {
        const folderName = $(this).data('folder');
        const $btn = $(this);
        
        if (confirm('Are you sure you want to approve this folder? The quincy process will be triggered.')) {
            $.post(`/approve/${folderName}`, function(response) {
                if (response.status === 'success') {
                    alert(response.message);
                    $btn.prop('disabled', true).text('Approved');
                    $btn.removeClass('btn-success').addClass('btn-secondary');
                } else {
                    alert('Error: ' + response.message);
                }
            }).fail(function(xhr, status, error) {
                alert('An error occurred: ' + error);
            });
        }
    });

    // Delete button click handler
    $('.delete-btn').on('click', function() {
        const folderName = $(this).data('folder');
        $('#deleteConfirmModal').data('folder', folderName).modal('show');
        $('#deleteConfirmInput').val(''); // Clear the input field
        $('#confirmDeleteBtn').prop('disabled', true);
    });

    // Delete confirmation input handler
    $('#deleteConfirmInput').on('input', function() {
        $('#confirmDeleteBtn').prop('disabled', $(this).val() !== 'I AGREE');
    });

    // Confirm delete button click handler
    $('#confirmDeleteBtn').on('click', function() {
        const folderName = $('#deleteConfirmModal').data('folder');
        const $row = $(`button.delete-btn[data-folder="${folderName}"]`).closest('tr');
        
        $.post(`/delete/${folderName}`, function(response) {
            if (response.status === 'success') {
                alert(response.message);
                $row.fadeOut(400, function() { $(this).remove(); });
            } else {
                alert('Error: ' + response.message);
            }
        }).fail(function(xhr, status, error) {
            alert('An error occurred: ' + error);
        });
        
        $('#deleteConfirmModal').modal('hide');
    });

    // Check status button click handler
    $('.check-status-btn').on('click', function() {
        const folderName = $(this).data('folder');
        const $btn = $(this);
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Checking...');
        
        $.get(`/check-status/${folderName}`, function(response) {
            if (response.status === 'success') {
                $('#statusModal .modal-body').html(`<p>${response.details}</p>`);
                $('#statusModal').modal('show');
            } else {
                alert('Error: ' + response.message);
            }
        }).fail(function(xhr, status, error) {
            alert('An error occurred: ' + error);
        }).always(function() {
            $btn.prop('disabled', false).text('Check Status');
        });
    });

    // Table sorting
    $('th[data-sort]').on('click', function() {
        const column = $(this).data('sort');
        const $table = $(this).closest('table');
        const $tbody = $table.find('tbody');
        const rows = $tbody.find('tr').get();
        
        rows.sort(function(a, b) {
            const aValue = $(a).find(`td:eq(${$table.find('th').index(this)})`).text();
            const bValue = $(b).find(`td:eq(${$table.find('th').index(this)})`).text();
            return aValue.localeCompare(bValue);
        });
        
        if ($(this).hasClass('asc')) {
            rows.reverse();
            $(this).removeClass('asc').addClass('desc');
        } else {
            $(this).removeClass('desc').addClass('asc');
        }
        
        $.each(rows, function(index, row) {
            $tbody.append(row);
        });
    });

    // Search functionality
    $('#searchInput').on('keyup', function() {
        const value = $(this).val().toLowerCase();
        $('table tbody tr').filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
        });
    });

    // Refresh button click handler
    $('#refreshBtn').on('click', function() {
        location.reload();
    });

    // Initialize tooltips
    $('[data-bs-toggle="tooltip"]').tooltip();

    // Handle modal close
    $('.modal').on('hidden.bs.modal', function() {
        $(this).find('form').trigger('reset');
    });

    // Chunk status update
    function updateChunkStatus(folderName, status) {
        $(`tr[data-folder="${folderName}"] .chunk-status`).text(status);
    }

    // Periodically check chunk status for incomplete uploads
    setInterval(function() {
        $('.check-status-btn:not(:disabled)').each(function() {
            const folderName = $(this).data('folder');
            $.get(`/check-status/${folderName}`, function(response) {
                if (response.status === 'success') {
                    updateChunkStatus(folderName, response.details);
                    if (response.details.includes('All chunks received') && response.details.includes('File is complete')) {
                        $(`button.check-status-btn[data-folder="${folderName}"]`).prop('disabled', true).remove();
                    }
                }
            });
        });
    }, 60000); // Check every minute

    // Bulk action functionality
    $('#bulkActionBtn').on('click', function() {
        const action = $('#bulkActionSelect').val();
        const selectedFolders = $('.folder-checkbox:checked').map(function() {
            return $(this).val();
        }).get();

        if (selectedFolders.length === 0) {
            alert('Please select at least one folder.');
            return;
        }

        if (action === 'approve') {
            if (confirm(`Are you sure you want to approve ${selectedFolders.length} folder(s)? The quincy process will be triggered for each.`)) {
                selectedFolders.forEach(function(folderName) {
                    $.post(`/approve/${folderName}`, function(response) {
                        if (response.status === 'success') {
                            $(`button.approve-btn[data-folder="${folderName}"]`).prop('disabled', true).text('Approved').removeClass('btn-success').addClass('btn-secondary');
                        }
                    });
                });
            }
        } else if (action === 'delete') {
            $('#bulkDeleteConfirmModal').modal('show');
        }
    });

    // Bulk delete confirmation
    $('#bulkConfirmDeleteBtn').on('click', function() {
        const selectedFolders = $('.folder-checkbox:checked').map(function() {
            return $(this).val();
        }).get();

        selectedFolders.forEach(function(folderName) {
            $.post(`/delete/${folderName}`, function(response) {
                if (response.status === 'success') {
                    $(`tr[data-folder="${folderName}"]`).fadeOut(400, function() { $(this).remove(); });
                }
            });
        });

        $('#bulkDeleteConfirmModal').modal('hide');
    });

    // Select all checkbox
    $('#selectAllCheckbox').on('change', function() {
        $('.folder-checkbox').prop('checked', $(this).prop('checked'));
    });
});