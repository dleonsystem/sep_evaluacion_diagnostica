FROM node:20.18.3

# Configurar zona horaria (UTC-06:00 - México Central)
ENV TZ=America/Mexico_City
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 5009

CMD ["npm", "start"]
