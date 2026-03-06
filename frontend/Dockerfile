FROM nginx:alpine

# Copie des fichiers frontend
COPY . /usr/share/nginx/html

# Copie de la configuration nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposition du port
EXPOSE 80

# Healthcheck — curl disponible dans nginx:alpine
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
