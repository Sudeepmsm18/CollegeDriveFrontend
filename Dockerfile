# Frontend/Dockerfile

# Stage 1: Build the React application
FROM node:20-alpine as build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the Vite project for production
# Ensure VITE_API_BASE_URL is passed during build time via docker-compose
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Stage 2: Serve with NGINX
FROM nginx:alpine

# Copy the built assets from the dist folder
COPY --from=build /app/dist /usr/share/nginx/html

# Provide a basic NGINX configuration for React routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
