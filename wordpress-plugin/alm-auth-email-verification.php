<?php
/**
 * Plugin Name: AI Life Manager Auth Email Verification
 * Description: REST auth endpoints with email verification using WordPress users and user meta.
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

const ALM_AUTH_NAMESPACE = 'alm/v1';
const ALM_EMAIL_VERIFIED_META = 'alm_email_verified';
const ALM_EMAIL_TOKEN_META = 'alm_email_verification_token';
const ALM_EMAIL_TOKEN_EXPIRES_META = 'alm_email_verification_expires';

add_action('rest_api_init', function () {
    register_rest_route(ALM_AUTH_NAMESPACE, '/auth/register', [
        'methods' => 'POST',
        'callback' => 'alm_auth_register',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route(ALM_AUTH_NAMESPACE, '/auth/verify-email', [
        'methods' => 'POST',
        'callback' => 'alm_auth_verify_email',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route(ALM_AUTH_NAMESPACE, '/auth/login', [
        'methods' => 'POST',
        'callback' => 'alm_auth_login',
        'permission_callback' => '__return_true',
    ]);
});

function alm_auth_register(WP_REST_Request $request) {
    $name = sanitize_text_field($request->get_param('name'));
    $email = sanitize_email($request->get_param('email'));
    $password = (string) $request->get_param('password');

    if (!$name || !$email || !$password) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Name, email, and password are required.',
        ], 400);
    }

    if (!is_email($email)) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Please enter a valid email address.',
        ], 400);
    }

    if (email_exists($email)) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'This email is already registered.',
        ], 409);
    }

    $username = sanitize_user(current(explode('@', $email)), true);

    if (username_exists($username)) {
        $username .= '_' . wp_generate_password(6, false, false);
    }

    $user_id = wp_create_user($username, $password, $email);

    if (is_wp_error($user_id)) {
        return new WP_REST_Response([
            'success' => false,
            'message' => $user_id->get_error_message(),
        ], 500);
    }

    wp_update_user([
        'ID' => $user_id,
        'display_name' => $name,
        'first_name' => $name,
    ]);

    update_user_meta($user_id, ALM_EMAIL_VERIFIED_META, '0');
    alm_auth_send_verification_email($user_id, $email);

    return new WP_REST_Response([
        'success' => true,
        'message' => 'Registration successful. Please check your email to verify your account.',
    ], 201);
}

function alm_auth_verify_email(WP_REST_Request $request) {
    $email = sanitize_email($request->get_param('email'));
    $token = sanitize_text_field($request->get_param('token'));

    if (!$email || !$token) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Invalid verification link.',
        ], 400);
    }

    $user = get_user_by('email', $email);

    if (!$user) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Invalid verification link.',
        ], 404);
    }

    if (get_user_meta($user->ID, ALM_EMAIL_VERIFIED_META, true) === '1') {
        return new WP_REST_Response([
            'success' => true,
            'message' => 'Email already verified. You can log in.',
        ]);
    }

    $stored_hash = get_user_meta($user->ID, ALM_EMAIL_TOKEN_META, true);
    $expires = (int) get_user_meta($user->ID, ALM_EMAIL_TOKEN_EXPIRES_META, true);

    if (!$stored_hash || !$expires || time() > $expires) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Verification link has expired. Please register again or request a new link.',
        ], 400);
    }

    if (!hash_equals($stored_hash, hash('sha256', $token))) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Invalid verification token.',
        ], 400);
    }

    update_user_meta($user->ID, ALM_EMAIL_VERIFIED_META, '1');
    delete_user_meta($user->ID, ALM_EMAIL_TOKEN_META);
    delete_user_meta($user->ID, ALM_EMAIL_TOKEN_EXPIRES_META);

    return new WP_REST_Response([
        'success' => true,
        'message' => 'Your email is verified. You can log in now.',
    ]);
}

function alm_auth_login(WP_REST_Request $request) {
    $email = sanitize_email($request->get_param('email'));
    $password = (string) $request->get_param('password');

    if (!$email || !$password) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Email and password are required.',
        ], 400);
    }

    $user = get_user_by('email', $email);

    if (!$user || !wp_check_password($password, $user->user_pass, $user->ID)) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Invalid email or password.',
        ], 401);
    }

    if (get_user_meta($user->ID, ALM_EMAIL_VERIFIED_META, true) !== '1') {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Please verify your email before logging in.',
        ], 403);
    }

    return new WP_REST_Response([
        'success' => true,
        'id' => $user->ID,
        'name' => $user->display_name,
        'email' => $user->user_email,
    ]);
}

function alm_auth_send_verification_email($user_id, $email) {
    $token = bin2hex(random_bytes(32));
    $expires = time() + DAY_IN_SECONDS;

    update_user_meta($user_id, ALM_EMAIL_TOKEN_META, hash('sha256', $token));
    update_user_meta($user_id, ALM_EMAIL_TOKEN_EXPIRES_META, $expires);

    $frontend_url = apply_filters(
        'alm_auth_frontend_verify_url',
        'http://127.0.0.1:5174/verify-email'
    );

    $verification_link = add_query_arg([
        'email' => rawurlencode($email),
        'token' => rawurlencode($token),
    ], $frontend_url);

    $subject = 'Verify your AI Life Manager account';
    $message = sprintf(
        "Hi,\n\nPlease verify your email address by opening this link:\n\n%s\n\nThis link expires in 24 hours.\n\nIf you did not create this account, you can ignore this email.",
        $verification_link
    );

    wp_mail($email, $subject, $message);
}
