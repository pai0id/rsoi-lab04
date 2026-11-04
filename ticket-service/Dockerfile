FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src

ENV PORT=8070
EXPOSE 8070

CMD ["node", "src/index.js"]
