FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN npm ci --ignore-scripts
RUN npm --prefix frontend ci
COPY index.html ./index.html
COPY src ./src
COPY frontend ./frontend
RUN npm --prefix frontend run build
FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
