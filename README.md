# Data Ingestion Portal

A comprehensive web application for managing and processing data ingestion operations with separate client and admin interfaces.

## Overview

This application consists of two main components:
- **Client Portal**: For uploading and processing data files
- **Admin Portal**: For managing and monitoring uploaded data

### Client Portal Features

- Large file upload support with chunking (up to 200GB)
- Real-time upload progress tracking
- File integrity verification through MD5 hashing
- Metadata collection for uploads
- Customizable file renaming
- Upload history tracking
- Support for various device types and platforms
- Secure file handling and processing

### Admin Portal Features

- Overview of all uploaded files
- File verification status monitoring
- Approval workflow management
- Detailed metadata viewing
- Search functionality
- File deletion management
- Chunk status monitoring
- Support for resubmitting failed chunks

## Technical Details

### Prerequisites

- Python 3.x
- Flask
- Bootstrap 5.1.3
- jQuery 3.6.0

### Directory Structure

```
.
├── admin-app/       # Admin portal application
├── client-app/      # Client portal application
├── config.py        # Configuration settings
├── manage.py        # Application entry point
└── project/         # Main application code
```

### Key Components

1. **File Processing**
   - Chunked file upload system
   - MD5 hash verification
   - Automatic file renaming
   - Progress tracking

2. **Data Management**
   - JSON-based metadata storage
   - File system organization
   - Search functionality
   - Status tracking

3. **Security Features**
   - File integrity verification
   - Secure file handling
   - Access controls
   - Error logging

### Configuration

Key settings in `config.py`:
- `UPLOAD_FOLDER`: Directory for file storage
- `MAX_FILE_SIZE_GB`: Maximum file size (default 200GB)
- `SYSTEM_NAME`: System identifier
- `STATIC_FOLDER`: Static files location

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure settings in `config.py`

5. Initialize the application:
```bash
python manage.py
```

## Usage

### Client Portal

1. Access the client portal at `http://localhost:5000`
2. Select files for upload
3. Fill in required metadata
4. Review and confirm submission
5. Monitor upload progress
6. View upload history

### Admin Portal

1. Access the admin portal at `http://localhost:5001`
2. View uploaded files and their status
3. Approve or delete uploads
4. Monitor chunk status
5. Manage failed uploads
6. Search and filter uploads

## Development

### Client-side Architecture
- Modular JavaScript components
- State management system
- Event-driven architecture
- Bootstrap UI components

### Server-side Architecture
- Flask blueprints for modularity
- Robust error handling
- Logging system
- File system management

## Error Handling

- Comprehensive error logging
- User-friendly error messages
- Automatic cleanup of failed uploads
- Recovery mechanisms for failed chunks

## Logging

- Automatic log rotation
- Detailed error tracking
- Upload status logging
- System event logging

## Security Considerations

- File integrity verification
- Secure file handling
- Input validation
- Error message sanitization

## Performance

- Chunked file uploads
- Asynchronous processing
- Efficient file system operations
- Optimized search functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the GNU General Public License v3.0 - see the LICENSE file for details.

## Authors

* PeeBee (peebee_github@protonmail.com)

## Support

For support, please email peebee_github@protonmail.com or create an issue in the repository.

## Acknowledgments

- Flask community
- Bootstrap team
- jQuery developers
- Open source contributors
