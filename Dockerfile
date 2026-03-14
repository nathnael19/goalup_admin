FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci && npm install -g vite

COPY . .

EXPOSE 8000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8000"]


