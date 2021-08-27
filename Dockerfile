FROM node:lts-stretch
WORKDIR /app
COPY . .
# COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production
RUN npm run build
RUN npm i -g pm2
#VOLUME ["/app/config/env.json"] Create your env.json file from https://github.com/MrGreenGaming/website-v2/blob/master/config/env.sample.json and mount it here
CMD [ "pm2-runtime", "ecosystem.config.js" ]
