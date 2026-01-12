# Node.js production image
FROM node:22-alpine

# Install necessary dependencies
RUN apk update && apk add --no-cache \
    udev \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies
RUN npm install --production --ignore-scripts && npm cache clean --force

# Copy application code
COPY . ./

# Set environment variables
ENV NODE_ENV=production
ENV NODE_PATH=/app/node_modules

# Expose port 4200
EXPOSE 4200

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4200/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["npm", "start"]
