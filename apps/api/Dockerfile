FROM php:8.3-cli-alpine AS php-base
RUN apk add --no-cache $PHPIZE_DEPS default-mysql-client mariadb-connector-c-dev oniguruma-dev \
    && docker-php-ext-install pdo_mysql mbstring

FROM php-base AS dependencies
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-scripts --prefer-dist

FROM php-base
WORKDIR /var/www/html
COPY --from=dependencies /app/vendor ./vendor
COPY . .
RUN chown -R www-data:www-data storage bootstrap/cache
EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
