FROM node:lts-stretch
WORKDIR /app
COPY . .
RUN npm install --production
RUN npm run build
CMD [ "npm", "run", "start" ]
