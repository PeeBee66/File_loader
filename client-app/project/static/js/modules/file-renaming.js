// file-renaming.js
const fileRenaming = {
    updateRenamePreview() {
        console.log('Updating rename preview');
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
        console.log('New rename preview:', renamePreview);
        $('#renamePreview').val(renamePreview);
    },

    generateFolderName() {
        const renamePreview = $('#renamePreview').val();
        const currentTime = new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        }).replace(':', '');
        
        return `${renamePreview.split('.')[0]}_${currentTime}`;
    }
};
