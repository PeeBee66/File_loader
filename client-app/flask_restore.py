import os
import re
print("Current Working Directory:", os.getcwd())
def restore_files_from_backup(backup_file_path, base_dir):
    """
    Extracts each file from the backup file and restores it to its specified folder structure.
    Logs each restored file in the terminal.

    Parameters:
    - backup_file_path (str): Path to the backup text file containing all code files.
    - base_dir (str): Base directory where the folder structure should be recreated.
    
    Returns:
    - None
    """
    # Open the backup file and read its contents
    with open(backup_file_path, 'r') as f:
        content = f.read()

    # Regex pattern to capture each file's content and its path in the structure
    file_pattern = r'([a-zA-Z0-9_/\\]+\.py)\n=+\n(.*?)\n(?=[a-zA-Z0-9_/\\]+\.py|\Z)'
    matches = re.findall(file_pattern, content, re.DOTALL)

    for file_path, file_content in matches:
        # Create the full path for each file in the base directory
        full_path = os.path.join(base_dir, file_path.replace('\\', '/'))
        dir_path = os.path.dirname(full_path)

        # Ensure the directory exists
        os.makedirs(dir_path, exist_ok=True)

        # Write the content to the file
        with open(full_path, 'w') as file:
            file.write(file_content)
        
        # Log the restored file in the terminal
        print(f"Updated: {full_path}")

# Usage example
restore_files_from_backup(r'c:\Users\phillipb\Desktop\Pipeline\client-app\flask_backup.txt', 'client-app')