# Flask Backup and Restore Project

This project provides a comprehensive backup and restore solution for Flask applications, designed to handle file operations, error handling, and data processing efficiently.

## Features

- **Backup and Restore**: Efficient tools for backing up and restoring files within the Flask application.
- **Error Handling**: Custom error handlers for streamlined debugging and issue management.
- **Chunked File Uploads**: Support for large file uploads by handling data in chunks.
- **Metadata Management**: Tracking and logging of metadata throughout the data pipeline.

## Folder Structure

The project is organised as follows:

client-app/ ├── config.py ├── flask_backup.py ├── flask_restore.py ├── manage.py ├── logs/ │ ├── pipeline.log ├── project/ │ ├── init.py │ ├── client_app/ │ │ ├── error_handlers.py │ │ ├── file_utils/ │ │ │ ├── file_handlers.py │ │ │ ├── hash_utils.py │ │ ├── operations/ │ │ │ ├── cleanup_operations.py │ │ │ ├── file_operations.py │ │ ├── routes/ │ │ │ ├── cleanup_routes.py │ │ │ ├── history_routes.py │ ├── utils/ │ │ ├── cleanup_utils.py │ │ ├── directory_utils.py │ ├── static/ │ │ ├── css/ │ │ │ ├── bootstrap.min.css │ │ ├── js/ │ │ │ ├── file-processing/ │ ├── templates/ │ │ ├── 404.html │ │ ├── base.html │ ├── tmp/

csharp
Copy code

## Getting Started

Follow these steps to set up and run the project on your local machine.

### Prerequisites

Ensure you have Python and Flask installed. You can install Flask and other dependencies by running:

```bash
pip install -r requirements.txt
Installation
Clone the repository:

bash
Copy code
git clone https://github.com/your-username/flask-backup.git
cd flask-backup
Configure your environment settings in config.py to customise the application.

Start the Flask application:

bash
Copy code
python manage.py
Usage
Backup: Run flask_backup.py to create backups of specific files and directories.
Restore: Use flask_restore.py to restore files from a backup.
Error Logging: Errors are logged in pipeline.log for easy monitoring and debugging.
Routes: Various routes handle file uploads, metadata management, and data validation.
License
This project is licensed under the GNU General Public License v3.0 - see the LICENSE file for details.

Authors
PeeBee (peebee_github@protonmail.com)
