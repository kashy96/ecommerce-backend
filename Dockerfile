# # Use the official Node.js 22 image
# FROM node:22-alpine

# # Set working directory
# WORKDIR /app

# # Copy package.json and package-lock.json (if available)
# COPY package*.json ./

# # Install dependencies
# RUN npm ci --only=production

# # Copy the rest of the application code
# COPY . .

# # Expose the port the app runs on
# EXPOSE 5000

# # Start the application
# CMD ["npm", "start"]

# Use the official Node.js 22 image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on (Change to 3000 if your app uses that port)
EXPOSE 5000

# Start the application in development mode (assuming you have a 'dev' script in package.json)
CMD ["npm", "run", "dev"]
