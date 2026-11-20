FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html admin.html /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/
COPY imagens/produto-arch-linux-tratada.webp /usr/share/nginx/html/imagens/
COPY imagens/produto-kit-streetwear-tratada.webp /usr/share/nginx/html/imagens/
COPY imagens/produto-livro-cpp-tratada.webp /usr/share/nginx/html/imagens/
COPY imagens/produto-traje-tatico-tratada.webp /usr/share/nginx/html/imagens/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/

EXPOSE 80
