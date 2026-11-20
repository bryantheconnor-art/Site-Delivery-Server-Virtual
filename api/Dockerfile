FROM node:24-alpine

ENV NODE_ENV=production
ENV PORT=3001
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev
COPY --chown=node:node db.json server.js ./

USER node
EXPOSE 3001
CMD ["npm", "start"]
