# ==== CONFIGURE =====
# Use a Node 18 base image
FROM node:18
# Set the working directory to /code inside the container
WORKDIR /code
# Copy app files
COPY . .
# ==== BUILD =====
# Install dependencies (npm ci makes sure the exact versions in the lockfile gets installed)
RUN npm ci
# Build the app
RUN npm run build
# ==== RUN =======
# Set the env to "production"
ENV NODE_ENV production
# Expose the port on which the app will be running (3000 is the default that `serve` uses)
EXPOSE 7860
# Start the proxy and app
CMD ["bash", "-c", "node server.js & npx serve -l 7860 build"]