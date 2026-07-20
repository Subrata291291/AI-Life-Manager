<?php

if (!defined('ABSPATH')) {
    exit;
}

class ALM_Auth {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        register_rest_route('alm/v1', '/auth/register', [
            'methods' => 'POST',
            'callback' => [$this, 'register_user'],
            'permission_callback' => '__return_true'
        ]);

        register_rest_route('alm/v1', '/auth/login', [
            'methods' => 'POST',
            'callback' => [$this, 'login_user'],
            'permission_callback' => '__return_true'
        ]);

        register_rest_route('alm/v1', '/auth/me', [
            'methods' => 'GET',
            'callback' => [$this, 'current_user'],
            'permission_callback' => function () {
                return is_user_logged_in();
            }
        ]);

        register_rest_route('alm/v1', '/auth/verify-email', [
            'methods' => 'POST',
            'callback' => [$this, 'verify_email'],
            'permission_callback' => '__return_true'
        ]);

        register_rest_route('alm/v1', '/auth/forgot-password', [
            'methods' => 'POST',
            'callback' => [$this, 'forgot_password'],
            'permission_callback' => '__return_true'
        ]);

        register_rest_route('alm/v1', '/auth/reset-password', [
            'methods' => 'POST',
            'callback' => [$this, 'reset_password'],
            'permission_callback' => '__return_true'
        ]);
    }

    // --- REGISTER ---

    public function register_user($request) {
        $email = sanitize_email($request['email']);
        $password = $request['password'];
        $name = sanitize_text_field($request['name']);

        if (email_exists($email)) {
            return new WP_Error('email_exists', 'Email already registered', ['status' => 400]);
        }

        $user_id = wp_create_user($email, $password, $email);
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        wp_update_user([
            'ID' => $user_id,
            'display_name' => $name
        ]);

        // Generate verification token
        $token = wp_generate_password(32, false);
        update_user_meta($user_id, 'alm_verification_token', $token);

        // Send verification email
        $this->send_verification_email($email, $name, $token);

        return [
            'success' => true,
            'message' => 'Account created. Please check your email and verify your account before logging in.',
        ];
    }

    private function send_verification_email($email, $name, $token) {
        $frontend_url = get_option('alm_frontend_url', home_url());
        $verify_link = trailingslashit($frontend_url) . 'verify-email?email=' . urlencode($email) . '&token=' . urlencode($token);

        $subject = 'Verify your AI Life Manager account';
        $message = "
            <p>Hi {$name},</p>
            <p>Thank you for creating an account with AI Life Manager.</p>
            <p>Please click the link below to verify your email address:</p>
            <p><a href='{$verify_link}'>Verify Email Address</a></p>
            <p>If you did not create this account, you can safely ignore this email.</p>
        ";

        $headers = ['Content-Type: text/html; charset=UTF-8'];
        wp_mail($email, $subject, $message, $headers);
    }

    // --- VERIFY EMAIL ---

    public function verify_email($request) {
        $email = sanitize_email($request['email']);
        $token = sanitize_text_field($request['token']);

        if (empty($email) || empty($token)) {
            return new WP_Error('missing_params', 'Missing email or token.', ['status' => 400]);
        }

        $user = get_user_by('email', $email);
        if (!$user) {
            return new WP_Error('invalid_email', 'No account found with this email.', ['status' => 404]);
        }

        $stored_token = get_user_meta($user->ID, 'alm_verification_token', true);
        if (empty($stored_token) || !hash_equals($stored_token, $token)) {
            return new WP_Error('invalid_token', 'This verification link is invalid or expired.', ['status' => 400]);
        }

        update_user_meta($user->ID, 'alm_user_verified', '1');
        delete_user_meta($user->ID, 'alm_verification_token');

        return [
            'success' => true,
            'message' => 'Your email is verified. You can log in now.',
        ];
    }

    // --- LOGIN ---

    public function login_user($request) {
        $email = sanitize_email($request['email']);

        $creds = [
            'user_login' => $email,
            'user_password' => $request['password'],
            'remember' => true
        ];

        $user = wp_signon($creds);
        if (is_wp_error($user)) {
            return new WP_Error('invalid_login', 'Invalid credentials', ['status' => 401]);
        }

        // Check if email is verified
        $verified = get_user_meta($user->ID, 'alm_user_verified', true);
        if ($verified !== '1') {
            // Check if this user needs verification (new registrations require it)
            $token = get_user_meta($user->ID, 'alm_verification_token', true);
            if (!empty($token)) {
                wp_logout();
                return new WP_Error(
                    'email_not_verified',
                    'Please verify your email address before logging in. Check your inbox for the verification link.',
                    ['status' => 403]
                );
            }
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

    // --- FORGOT PASSWORD ---

    public function forgot_password($request) {
        $email = sanitize_email($request['email']);

        if (empty($email)) {
            return new WP_Error('missing_email', 'Please provide your email address.', ['status' => 400]);
        }

        $user = get_user_by('email', $email);
        if (!$user) {
            // Don't reveal if email exists for security
            return [
                'success' => true,
                'message' => 'If this email exists, reset instructions will be sent shortly.',
            ];
        }

        $token = wp_generate_password(32, false);
        update_user_meta($user->ID, 'alm_reset_token', $token);
        update_user_meta($user->ID, 'alm_reset_token_expiry', time() + 3600); // 1 hour

        $frontend_url = get_option('alm_frontend_url', home_url());
        $reset_link = trailingslashit($frontend_url) . 'reset-password?email=' . urlencode($email) . '&token=' . urlencode($token);

        $subject = 'Reset your AI Life Manager password';
        $message = "
            <p>Hi {$user->display_name},</p>
            <p>You requested a password reset for your AI Life Manager account.</p>
            <p>Click the link below to set a new password (valid for 1 hour):</p>
            <p><a href='{$reset_link}'>Reset Password</a></p>
            <p>If you did not request this, you can safely ignore this email.</p>
        ";

        $headers = ['Content-Type: text/html; charset=UTF-8'];
        wp_mail($email, $subject, $message, $headers);

        return [
            'success' => true,
            'message' => 'If this email exists, reset instructions will be sent shortly.',
        ];
    }

    // --- RESET PASSWORD ---

    public function reset_password($request) {
        $email = sanitize_email($request['email']);
        $token = sanitize_text_field($request['token']);
        $password = $request['password'];

        if (empty($email) || empty($token) || empty($password)) {
            return new WP_Error('missing_params', 'Missing required fields.', ['status' => 400]);
        }

        $user = get_user_by('email', $email);
        if (!$user) {
            return new WP_Error('invalid_email', 'No account found with this email.', ['status' => 404]);
        }

        $stored_token = get_user_meta($user->ID, 'alm_reset_token', true);
        $expiry = (int) get_user_meta($user->ID, 'alm_reset_token_expiry', true);

        if (empty($stored_token) || !hash_equals($stored_token, $token) || time() > $expiry) {
            return new WP_Error('invalid_token', 'This reset link is invalid or has expired.', ['status' => 400]);
        }

        wp_set_password($password, $user->ID);
        delete_user_meta($user->ID, 'alm_reset_token');
        delete_user_meta($user->ID, 'alm_reset_token_expiry');

        return [
            'success' => true,
            'message' => 'Your password has been reset successfully. You can log in now.',
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
