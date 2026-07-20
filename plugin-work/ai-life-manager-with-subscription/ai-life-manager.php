<?php
/**
 * Plugin Name: AI Life Manager
 * Plugin URI: https://yourdomain.com
 * Description: Daily Planner, Expense Tracker, Bill Reminder SaaS Backend
 * Version: 1.0.0
 * Author: Subrata Halder
 * Text Domain: ai-life-manager
 */

if (!defined('ABSPATH')) {
    exit;
}

define('ALM_VERSION', '1.0.0');
define('ALM_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('ALM_PLUGIN_URL', plugin_dir_url(__FILE__));

function alm_get_request_user_id() {
    $user_id = intval($_SERVER['HTTP_X_ALM_USER_ID'] ?? 0);

    if (!$user_id) {
        alm_debug_log('Auth: No X-ALM-User-ID header found. Headers: ' . json_encode(getallheaders()));
        return 0;
    }

    $user = get_user_by('ID', $user_id);

    if (!$user) {
        alm_debug_log('Auth: User not found for ID: ' . $user_id);
        return 0;
    }

    return $user_id;
}

function alm_require_request_user_id() {
    $user_id = alm_get_request_user_id();

    if (!$user_id) {
        return new WP_Error(
            'unauthorized_user',
            'Authentication failed. Could not verify user. Make sure you are logged in.',
            ['status' => 401]
        );
    }

    return $user_id;
}

function alm_debug_log($message) {
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log('[ALM] ' . $message);
    }
}

// Handle CORS for cross-origin requests from Netlify
add_action('rest_pre_serve_request', function($result) {
    $origin = get_http_origin();
    if ($origin) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: X-ALM-User-ID, Content-Type, Authorization, X-WP-Nonce');
        header('Access-Control-Expose-Headers: X-ALM-User-ID');
    }
});

// Allow custom CORS headers
add_filter('rest_allowed_cors_headers', function($headers) {
    if (!in_array('X-ALM-User-ID', $headers)) {
        $headers[] = 'X-ALM-User-ID';
    }
    return $headers;
});

require_once ALM_PLUGIN_PATH . 'includes/class-db.php';
require_once ALM_PLUGIN_PATH . 'includes/class-loader.php';

register_activation_hook(__FILE__, ['ALM_DB', 'create_tables']);

function alm_init_plugin() {
    new ALM_Loader();
}
add_action('plugins_loaded', 'alm_init_plugin');
