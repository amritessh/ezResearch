# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose Vite's default port
EXPOSE 5173

# Start the application in development mode
# The --host flag allows connections from outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
