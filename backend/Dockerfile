# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Environment variables configuration
ARG RAG_API_URL=http://rag-qa-api:8000
ARG MONGODB_URL=""

ENV RAG_API_URL=$RAG_API_URL
ENV MONGODB_URL=$MONGODB_URL

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
COPY . .

# Make port 8001 available to the world outside this container
EXPOSE 8001

# Run the application
CMD ["python", "-m", "app.main"]
