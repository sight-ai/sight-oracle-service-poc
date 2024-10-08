# Use an official Node.js runtime as a parent image
FROM --platform=linux/amd64 node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock) files
COPY package*.json ./

# Install jq to read JSON files
RUN apt-get update && apt-get install -y jq

# Declare build arguments with default values
ARG ORG_NAME=sight-ai
ARG VERSION

# If VERSION is not provided, extract it from package.json
RUN if [ -z "$VERSION" ]; then VERSION=$(jq -r .version package.json); fi && \
    echo "Organization: ${ORG_NAME}" > release_info && \
    echo "Version: ${VERSION}" >> release_info

# Install PM2 globally
RUN npm install pm2 -g

# Install any needed packages specified in package.json
RUN npm install

# Bundle your app's source code inside the Docker image
COPY . .

# Build your NestJS application
RUN npm run build

# Your application runs on port 3000 by default, expose it
EXPOSE 3000

# Define command to run the app using PM2 when the container starts
CMD ["pm2-runtime", "start", "dist/main.js"]