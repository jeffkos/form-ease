# Utilisation de Docker pour générer le client Prisma dans un environnement sain
# Place ce fichier à la racine de ton projet (formease/backend)

FROM node:20
WORKDIR /app
COPY . .
RUN npm ci
RUN npx prisma generate --schema=prisma/schema_test.prisma
CMD ["bash"]
