# Base node image
FROM node:22-slim AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Development image with hot module replacement (HMR)
FROM base AS dev
COPY . .
EXPOSE 5173
ENV VITE_BACKEND_URL=http://django:8000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build production assets
FROM base AS build
COPY . .
RUN npm run build

# Production Nginx server
FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
