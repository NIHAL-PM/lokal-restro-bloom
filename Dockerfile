# Multi-stage build for frontend and backend
FROM node:20-alpine as builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM node:20-alpine as server
WORKDIR /app
COPY --from=builder /app/server ./server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
RUN cd server && npm install --production
EXPOSE 4000 5173
CMD ["sh", "-c", "cd server && npm start"]
