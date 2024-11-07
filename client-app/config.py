import os

# User-configurable settings
UPLOAD_FOLDER = r"H:\Upload_test"
MAX_FILE_SIZE_GB = 100
SYSTEM_NAME = "System A"
STATIC_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')

# Derived settings
MAX_FILE_SIZE = MAX_FILE_SIZE_GB * 1024 * 1024 * 1024  # Convert GB to bytes

class Config:
    UPLOAD_FOLDER = UPLOAD_FOLDER
    MAX_FILE_SIZE = MAX_FILE_SIZE
    SYSTEM_NAME = SYSTEM_NAME
    STATIC_FOLDER = STATIC_FOLDER

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

# Allow overriding settings with environment variables
for key in ['UPLOAD_FOLDER', 'MAX_FILE_SIZE', 'SYSTEM_NAME', 'STATIC_FOLDER']:
    if os.environ.get(key):
        setattr(Config, key, os.environ.get(key))
        if key == 'MAX_FILE_SIZE':
            Config.MAX_FILE_SIZE = int(Config.MAX_FILE_SIZE)