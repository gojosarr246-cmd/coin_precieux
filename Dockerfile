FROM nginx:alpine

# Copy site files into nginx web root
COPY . /usr/share/nginx/html

# Expose standard HTTP port
EXPOSE 80

# Start nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
