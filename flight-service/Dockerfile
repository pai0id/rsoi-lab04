FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src

ENV PORT=8060
EXPOSE 8060

CMD ["node", "src/index.js"]
