# Dockerfile for React/Vite Frontend
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the code
COPY . .

# Expose the default Vite port
EXPOSE 5173

# Start the development server (for production, you'd build and serve statically)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
