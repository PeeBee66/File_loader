# project/client_app/operations/processing/__init__.py
"""Processing package initialization."""

from .core_processor import CoreProcessor
from .file_rename import FileRenameHandler
from .status_tracker import ProcessingStatusTracker
from .cleanup_handler import CleanupHandler
from .completion_handler import CompletionHandler
from .file_processor import FileProcessor  # Add FileProcessor to exports

__all__ = [
    'CoreProcessor',
    'FileRenameHandler',
    'ProcessingStatusTracker',
    'CleanupHandler',
    'CompletionHandler',
    'FileProcessor'  # Export FileProcessor
]