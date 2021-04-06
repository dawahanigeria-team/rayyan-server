FROM node:15.4.0-alpine3.10
#specify working directory
WORKDIR /app

#copy only packagejsone to install
COPY package.json ./

#install dependencies
RUN npm install


COPY ./ ./

CMD ["node", "app.js"]
