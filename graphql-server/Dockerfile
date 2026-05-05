FROM node:20.18.3

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 5009

CMD ["npm", "start"]
