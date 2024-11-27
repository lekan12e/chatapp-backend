FROM node

WORKDIR Users/Admin/Desktop/projs/first-backend

COPY package*.json ./ 

RUN npm install

EXPOSE 3000

RUN ["node", "server.js"]