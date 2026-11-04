FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src

ENV PORT=8050
EXPOSE 8050

CMD ["node", "src/index.js"]
