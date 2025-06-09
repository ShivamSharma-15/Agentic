FROM node:18

# Set the working directory inside the container
WORKDIR /app/backend

# Copy only backend's package files and install deps
COPY backend/package*.json ./
RUN npm install

# Copy backend code
COPY backend/ .

# Copy frontend if needed (optional)
COPY data/ /app/data/

# Expose the backend port (match the internal app port)
EXPOSE 3000

# Start the app
CMD ["node", "src/app.js"]
