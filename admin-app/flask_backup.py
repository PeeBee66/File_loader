import os
import fnmatch

def generate_folder_structure(root_dir, ignore_patterns):
    structure = []
    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if not any(fnmatch.fnmatch(os.path.join(root, d), pattern) for pattern in ignore_patterns)]
        
        level = root.replace(root_dir, '').count(os.sep)
        indent = '│   ' * (level - 1) + '├── ' if level > 0 else ''
        folder_name = os.path.basename(root)
        structure.append(f"{indent}{folder_name}/")
        
        subindent = '│   ' * level + '├── '
        for file in files:
            file_path = os.path.join(root, file)
            if not any(fnmatch.fnmatch(file_path, pattern) for pattern in ignore_patterns):
                structure.append(f"{subindent}{file}")
    
    return '\n'.join(structure)

def backup_flask_app(root_dir, output_file):
    ignore_patterns = [
        '*.pyc',
        '*.pyo',
        '*.pyd',
        '*/__pycache__',
        '*.so',
        '*.egg-info',
        '*.egg',
        '*/dist',
        '*/build',
        '*.bak',
        '*.swp',
        '*.swo',
        '*.log',
        '*/.git',
        '*/.gitignore',
        '*/.vscode',
        '*/venv',
        '*/env',
        '*.sqlite3',
        '*.db',
        '*/node_modules',
        '*/flask_backup.py',
        '*/flask_backup.txt',
        '*/project/static/css/bootstrap.min.css',
        '*/project/static/css/bootstrap.min.css.map',
        '*/project/static/js/bootstrap.bundle.min.js',
        '*/project/static/js/bootstrap.bundle.min.js.map',
        '*/project/static/js/jquery.min.js',
        '*/logs/*',
        '*/tmp/*',
        '*/project/tmp/*'
    ]

    with open(output_file, 'w', encoding='utf-8') as backup_file:
        # Add folder structure at the top
        folder_structure = generate_folder_structure(root_dir, ignore_patterns)
        backup_file.write("Folder Structure:\n")
        backup_file.write("=================\n")
        backup_file.write(folder_structure)
        backup_file.write("\n\nFile Contents:\n")
        backup_file.write("==============\n")

        for root, dirs, files in os.walk(root_dir):
            dirs[:] = [d for d in dirs if not any(fnmatch.fnmatch(os.path.join(root, d), pattern) for pattern in ignore_patterns)]

            for file in files:
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, root_dir)
                
                if any(fnmatch.fnmatch(file_path, pattern) for pattern in ignore_patterns):
                    continue

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