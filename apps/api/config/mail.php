<?php

$useSsl = filter_var(env('SMTP_USE_SSL', false), FILTER_VALIDATE_BOOL);
$useTls = filter_var(env('SMTP_USE_TLS', true), FILTER_VALIDATE_BOOL);

return [
    'default' => env('MAIL_MAILER', 'smtp'),
    'smtp_use_tls' => $useTls,
    'smtp_use_ssl' => $useSsl,
    'mailers' => [
        'smtp' => [
            'transport' => 'smtp',
            'scheme' => $useSsl ? 'smtps' : ($useTls ? 'smtp' : null),
            'url' => env('MAIL_URL'),
            'host' => env('SMTP_HOST', '127.0.0.1'),
            'port' => (int) env('SMTP_PORT', 587),
            'username' => env('SMTP_USERNAME'),
            'password' => env('SMTP_PASSWORD'),
            'timeout' => (float) env('SMTP_TIMEOUT_SECONDS', 10),
            'local_domain' => env('MAIL_EHLO_DOMAIN', parse_url(env('APP_URL', 'http://localhost'), PHP_URL_HOST)),
            'from_address' => env('SMTP_FROM_EMAIL'),
        ],
        'array' => [
            'transport' => 'array',
        ],
    ],
    'from' => [
        'address' => env('SMTP_FROM_EMAIL', 'noreply@example.com'),
        'name' => env('APP_NAME', 'Lyceum Club'),
    ],
];
