import os

def generate_folder_structure(root_dir):
    structure = []
    for root, dirs, files in os.walk(root_dir):
        if 'venv' in dirs:
            dirs.remove('venv')  # don't go into 'venv' directory
        if '__pycache__' in dirs:
            dirs.remove('__pycache__')  # don't go into '__pycache__' directory
        
        level = root.replace(root_dir, '').count(os.sep)
        indent = '│   ' * (level - 1) + '├── ' if level > 0 else ''
        folder_name = os.path.basename(root)
        structure.append(f"{indent}{folder_name}/")
        
        subindent = '│   ' * level + '├── '
        for file in files:
            if file not in ['flask_backup.txt', 'flask_backup.py']:
                structure.append(f"{subindent}{file}")
    
    return '\n'.join(structure)

def backup_flask_app(root_dir, output_file):
    ignore_files = [
        'flask_backup.py',
        'flask_backup.txt',
        'bootstrap.min.js',
        'jquery.min.js',
        'bootstrap.bundle.min.js',
        'bootstrap.min.css'
    ]

    with open(output_file, 'w', encoding='utf-8') as backup_file:
        # Add folder structure at the top
        folder_structure = generate_folder_structure(root_dir)
        backup_file.write("Folder Structure:\n")
        backup_file.write("=================\n")
        backup_file.write(folder_structure)
        backup_file.write("\n\nFile Contents:\n")
        backup_file.write("==============\n")

        for root, dirs, files in os.walk(root_dir):
            if 'venv' in dirs:
                dirs.remove('venv')  # don't go into 'venv' directory
            if '__pycache__' in dirs:
                dirs.remove('__pycache__')  # don't go into '__pycache__' directory

            for file in files:
                if file in ignore_files:
                    continue

                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, root_dir)

                backup_file.write(f"\n{relative_path}\n")
                backup_file.write("=" * len(relative_path) + "\n")

                try:
                    with open(file_path, 'r', encoding='utf-8') as source_file:
                        backup_file.write(source_file.read())
                except Exception as e:
                    backup_file.write(f"Error reading file: {str(e)}\n")

                backup_file.write("\n\n")

if __name__ == "__main__":
    project_root = os.path.dirname(os.path.abspath(__file__))
    backup_filename = "flask_backup.txt"
    backup_path = os.path.join(project_root, backup_filename)

    backup_flask_app(project_root, backup_path)
    print(f"Backup completed: {backup_path}")