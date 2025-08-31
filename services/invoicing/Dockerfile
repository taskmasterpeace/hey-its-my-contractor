# Custom InvoicePlane Docker Image
FROM php:8.1-apache

# Install system dependencies for PHP extensions
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    curl \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libzip-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Configure and install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install mysqli pdo pdo_mysql gd bcmath zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Enable Apache modules
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Download and install InvoicePlane
RUN curl -L https://github.com/InvoicePlane/InvoicePlane/archive/refs/heads/master.zip -o invoiceplane.zip \
    && unzip invoiceplane.zip \
    && mv InvoicePlane-master/* . \
    && rm -rf InvoicePlane-master invoiceplane.zip

# Copy Apache configuration
COPY ./invoiceplane.conf /etc/apache2/sites-available/000-default.conf

# Install PHP dependencies with Composer
RUN composer install --no-dev --optimize-autoloader

# Create InvoicePlane configuration from example
RUN cp /var/www/html/ipconfig.php.example /var/www/html/ipconfig.php

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html \
    && chmod 666 /var/www/html/ipconfig.php

# Expose port
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]