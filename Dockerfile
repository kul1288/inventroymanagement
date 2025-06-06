FROM node:22 AS builder

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:20

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.env ./.env

# Rebuild bcrypt for the correct architecture
RUN npm rebuild bcrypt --build-from-source

CMD ["npm", "run", "start:prod"]