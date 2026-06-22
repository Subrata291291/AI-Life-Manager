<?php

if (!defined('ABSPATH')) {
    exit;
}

class ALM_API {

    public function __construct() {

        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {

        register_rest_route(
            'alm/v1',
            '/health',
            [
                'methods' => 'GET',
                'callback' => [$this, 'health_check'],
                'permission_callback' => '__return_true'
            ]
        );
    }

    public function health_check() {

        return [
            'success' => true,
            'message' => 'AI Life Manager API Running'
        ];
    }
}