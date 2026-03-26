FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ linux-headers eudev-dev

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
