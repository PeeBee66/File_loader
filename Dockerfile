# Use an official Python runtime as a base image
FROM python:3.9

# Set the working directory in the container
WORKDIR /app

# Install the necessary Python packages
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Expose port 443 for the app to bind to
EXPOSE 5000