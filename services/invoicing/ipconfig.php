<?php

// InvoicePlane Configuration for FieldTime Integration
return [
    /*
    |--------------------------------------------------------------------------
    | URL Configuration
    |--------------------------------------------------------------------------
    */
    'base_url' => 'http://localhost:8080',
    
    /*
    |--------------------------------------------------------------------------
    | Database Configuration
    |--------------------------------------------------------------------------
    */
    'database' => [
        'hostname' => 'invoiceplane-mysql',
        'database' => 'invoiceplane',
        'username' => 'invoiceplane',
        'password' => 'invoiceplane_password',
        'driver'   => 'mysqli',
        'port'     => 3306,
    ],

    /*
    |--------------------------------------------------------------------------
    | Email Configuration
    |--------------------------------------------------------------------------
    */
    'email' => [
        'protocol'    => 'smtp',
        'smtp_host'   => 'mailhog',
        'smtp_user'   => '',
        'smtp_pass'   => '',
        'smtp_port'   => 1025,
        'smtp_crypto' => '',
        'mailtype'    => 'html',
        'charset'     => 'utf-8',
        'wordwrap'    => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Encryption Key
    |--------------------------------------------------------------------------
    */
    'encryption_key' => 'your_encryption_key_here_32_characters_long',

    /*
    |--------------------------------------------------------------------------
    | InvoicePlane Settings
    |--------------------------------------------------------------------------
    */
    'disable_setup' => false,
    'disable_read_only' => false,
    'remove_indexphp' => true,

    /*
    |--------------------------------------------------------------------------
    | FieldTime Integration Settings
    |--------------------------------------------------------------------------
    */
    'fieldtime_integration' => [
        'api_key' => 'fieldtime_api_key_here',
        'webhook_url' => 'http://host.docker.internal:4000/api/invoiceplane/webhook',
        'sync_clients' => true,
        'sync_invoices' => true,
        'auto_create_from_milestones' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Payment Gateway Configuration
    |--------------------------------------------------------------------------
    */
    'payment_gateways' => [
        'stripe' => [
            'enabled' => true,
            'public_key' => 'pk_test_your_stripe_public_key',
            'secret_key' => 'sk_test_your_stripe_secret_key',
        ],
        'paypal' => [
            'enabled' => true,
            'client_id' => 'your_paypal_client_id',
            'client_secret' => 'your_paypal_secret',
            'sandbox' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Branding Configuration
    |--------------------------------------------------------------------------
    */
    'branding' => [
        'company_name' => 'Johnson Contracting LLC',
        'company_logo' => '/uploads/logo.png',
        'primary_color' => '#2563EB',
        'secondary_color' => '#059669',
        'remove_invoiceplane_branding' => true, // MIT license allows this
    ],
];
?>