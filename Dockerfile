# Multi-stage build for Al Handassa.dz

# Stage 1: Build frontend assets
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build 2>/dev/null || echo "No build script"

# Stage 2: Production runtime
FROM node:20-alpine
WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files
COPY --from=frontend-builder /app .

# Expose ports
EXPOSE 3000 5000

# Environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/products', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start both servers
CMD ["sh", "-c", "npm run dev:backend & npm run dev:frontend & wait"]
