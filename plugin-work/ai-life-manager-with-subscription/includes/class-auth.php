<?php

if (!defined('ABSPATH')) {
    exit;
}

class ALM_Auth {

    public function __construct() {

        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {

        register_rest_route(
            'alm/v1',
            '/auth/register',
            [
                'methods' => 'POST',
                'callback' => [$this, 'register_user'],
                'permission_callback' => '__return_true'
            ]
        );

        register_rest_route(
            'alm/v1',
            '/auth/login',
            [
                'methods' => 'POST',
                'callback' => [$this, 'login_user'],
                'permission_callback' => '__return_true'
            ]
        );

        register_rest_route(
            'alm/v1',
            '/auth/me',
            [
                'methods' => 'GET',
                'callback' => [$this, 'current_user'],
                'permission_callback' => function () {
                    return is_user_logged_in();
                }
            ]
        );
    }

    public function register_user($request) {

        $email = sanitize_email($request['email']);
        $password = $request['password'];
        $name = sanitize_text_field($request['name']);

        if (email_exists($email)) {

            return new WP_Error(
                'email_exists',
                'Email already registered',
                ['status' => 400]
            );
        }

        $user_id = wp_create_user(
            $email,
            $password,
            $email
        );

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        wp_update_user([
            'ID' => $user_id,
            'display_name' => $name
        ]);

        return [
            'success' => true,
            'user_id' => $user_id
        ];
    }

    public function login_user($request) {

        $creds = [
            'user_login' => sanitize_email($request['email']),
            'user_password' => $request['password'],
            'remember' => true
        ];

        $user = wp_signon($creds);

        if (is_wp_error($user)) {

            return new WP_Error(
                'invalid_login',
                'Invalid credentials',
                ['status' => 401]
            );
        }

        wp_set_current_user($user->ID);

        $tier = (int) get_user_meta($user->ID, 'alm_subscription_tier', true);
        $sub_status = get_user_meta($user->ID, 'alm_subscription_status', true);

        if (!in_array($tier, [0, 1, 2, 3])) {
            $tier = 0;
            $sub_status = 'inactive';
        }

        return [
            'success' => true,
            'user_id' => $user->ID,
            'name' => $user->display_name,
            'email' => $user->user_email,
            'subscription' => [
                'tier' => $tier,
                'status' => $sub_status ?: 'inactive',
            ],
        ];
    }

    public function current_user() {

        $user = wp_get_current_user();

        return [
            'id' => $user->ID,
            'name' => $user->display_name,
            'email' => $user->user_email
        ];
    }
}