<?php
/**
 * Plugin Name: AI Life Manager
 * Plugin URI: https://yourdomain.com
 * Description: Daily Planner, Expense Tracker, Bill Reminder SaaS Backend
 * Version: 1.1.0
 * Author: Subrata Halder
 * Text Domain: ai-life-manager
 */

if (!defined('ABSPATH')) {
    exit;
}

define('ALM_VERSION', '1.1.0');
define('ALM_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('ALM_PLUGIN_URL', plugin_dir_url(__FILE__));

// --- Early CORS for REST API preflight requests ---
add_action('init', function () {
    $is_rest = (defined('REST_REQUEST') && REST_REQUEST)
        || (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], '/wp-json/') !== false)
        || (isset($_SERVER['HTTP_ORIGIN']) && isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']));

    if (!$is_rest) return;

    $origin = get_http_origin();
    if (!$origin) return;

    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Methods: OPTIONS, GET, POST, PUT, PATCH, DELETE');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Authorization, X-WP-Nonce, Content-Type, X-ALM-User-ID');
    header('Access-Control-Max-Age: 1728000');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        status_header(200);
        exit;
    }
}, 1);

add_filter('rest_allowed_cors_headers', function ($headers) {
    if (!in_array('X-ALM-User-ID', $headers)) {
        $headers[] = 'X-ALM-User-ID';
    }
    return $headers;
});

// --- User auth helpers ---

function alm_get_request_user_id() {
    $user_id = intval($_SERVER['HTTP_X_ALM_USER_ID'] ?? 0);
    if (!$user_id) {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        alm_debug_log('Auth: No X-ALM-User-ID. Headers: ' . json_encode($headers));
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

// --- Diagnostic endpoint ---
add_action('rest_api_init', function () {
    register_rest_route('alm/v1', '/ping', [
        'methods'             => 'GET',
        'callback'            => function () {
            $headers = function_exists('getallheaders') ? getallheaders() : [];
            return [
                'success' => true,
                'message' => 'AI Life Manager API is working',
                'version' => ALM_VERSION,
                'x_alm_user_id_header' => $headers['X-ALM-User-ID'] ?? $headers['x-alm-user-id'] ?? 'not present',
                'user_id_from_header'  => alm_get_request_user_id(),
            ];
        },
        'permission_callback' => '__return_true',
    ]);
});

// --- Load classes ---
require_once ALM_PLUGIN_PATH . 'includes/class-db.php';
require_once ALM_PLUGIN_PATH . 'includes/class-loader.php';

register_activation_hook(__FILE__, ['ALM_DB', 'create_tables']);

function alm_init_plugin() {
    new ALM_Loader();
}
add_action('plugins_loaded', 'alm_init_plugin');
