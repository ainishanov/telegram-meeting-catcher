FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

VOLUME ["/app/data"]

CMD ["npm", "run", "listen", "--", "--dry-run"]
