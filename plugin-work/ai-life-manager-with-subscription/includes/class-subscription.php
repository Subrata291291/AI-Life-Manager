<?php

if (!defined('ABSPATH')) {
    exit;
}

class ALM_Subscription {

    private static $tiers = [
        0 => ['name' => 'Free', 'features' => []],
        1 => ['name' => 'Tasks', 'features' => ['tasks']],
        2 => ['name' => 'Essential', 'features' => ['tasks', 'expenses']],
        3 => ['name' => 'Premium', 'features' => ['tasks', 'expenses', 'bills', 'goals']],
    ];

    private static $tier_prices = [
        1 => 49900,
        2 => 99900,
        3 => 149900,
    ];

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        register_rest_route('alm/v1', '/subscription/status', [
            'methods' => 'GET',
            'callback' => [$this, 'get_status'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('alm/v1', '/subscription/create-order', [
            'methods' => 'POST',
            'callback' => [$this, 'create_order'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('alm/v1', '/subscription/verify', [
            'methods' => 'POST',
            'callback' => [$this, 'verify_payment'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('alm/v1', '/subscription/webhook', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_webhook'],
            'permission_callback' => '__return_true',
        ]);
    }

    public function get_status() {
        $user_id = alm_require_request_user_id();
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        return $this->build_status_response($user_id);
    }

    public function create_order($request) {
        $user_id = alm_require_request_user_id();
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $tier = isset($request['tier']) ? (int) $request['tier'] : 0;
        if (!isset(self::$tiers[$tier]) || $tier === 0) {
            return new WP_Error('invalid_tier', 'Invalid subscription tier selected.', ['status' => 400]);
        }

        $key_id = get_option('alm_razorpay_key_id');
        $key_secret = get_option('alm_razorpay_key_secret');
        if (empty($key_id) || empty($key_secret)) {
            return new WP_Error('razorpay_not_configured', 'Payment gateway not configured. Contact support.', ['status' => 500]);
        }

        $amount = self::$tier_prices[$tier];
        $receipt = 'alm_' . $user_id . '_' . time();

        $response = $this->razorpay_api_request('orders', [
            'amount' => $amount,
            'currency' => 'INR',
            'receipt' => $receipt,
            'notes' => [
                'user_id' => (string) $user_id,
                'tier' => (string) $tier,
            ],
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        $order_id = $response['id'];
        update_user_meta($user_id, 'alm_razorpay_order_id', $order_id);
        update_user_meta($user_id, 'alm_pending_tier', $tier);

        $user = get_userdata($user_id);

        return [
            'order_id' => $order_id,
            'amount' => $amount,
            'currency' => 'INR',
            'key_id' => $key_id,
            'name' => 'AI Life Manager',
            'description' => self::$tiers[$tier]['name'] . ' Plan',
            'prefill' => [
                'email' => $user ? $user->user_email : '',
                'name' => $user ? $user->display_name : '',
            ],
        ];
    }

    public function verify_payment($request) {
        $user_id = alm_require_request_user_id();
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $params = $request->get_json_params();
        $payment_id = sanitize_text_field($params['razorpay_payment_id'] ?? '');
        $order_id = sanitize_text_field($params['razorpay_order_id'] ?? '');
        $signature = sanitize_text_field($params['razorpay_signature'] ?? '');

        if (empty($payment_id) || empty($order_id) || empty($signature)) {
            return new WP_Error('missing_params', 'Missing payment verification parameters.', ['status' => 400]);
        }

        $key_secret = get_option('alm_razorpay_key_secret');
        $expected = hash_hmac('sha256', $order_id . '|' . $payment_id, $key_secret);

        if (!hash_equals($expected, $signature)) {
            return new WP_Error('verification_failed', 'Payment signature verification failed.', ['status' => 400]);
        }

        $pending_tier = (int) get_user_meta($user_id, 'alm_pending_tier', true);
        $tier = in_array($pending_tier, [1, 2, 3]) ? $pending_tier : 1;

        $expiry = date('Y-m-d H:i:s', strtotime('+30 days'));

        update_user_meta($user_id, 'alm_subscription_tier', $tier);
        update_user_meta($user_id, 'alm_subscription_status', 'active');
        update_user_meta($user_id, 'alm_razorpay_payment_id', $payment_id);
        update_user_meta($user_id, 'alm_razorpay_order_id', $order_id);
        update_user_meta($user_id, 'alm_subscription_expiry', $expiry);
        delete_user_meta($user_id, 'alm_pending_tier');

        return [
            'success' => true,
            'tier' => $tier,
            'tier_name' => self::$tiers[$tier]['name'],
            'status' => 'active',
            'expiry' => $expiry,
        ];
    }

    public function handle_webhook() {
        $payload = file_get_contents('php://input');
        $data = json_decode($payload, true);

        if (!$data || !isset($data['event'])) {
            return new WP_Error('invalid_webhook', 'Invalid webhook payload.', ['status' => 400]);
        }

        $key_secret = get_option('alm_razorpay_key_secret');
        $webhook_signature = $_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? '';
        $expected = hash_hmac('sha256', $payload, $key_secret);

        if (!hash_equals($expected, $webhook_signature)) {
            return new WP_Error('webhook_verification_failed', 'Webhook signature mismatch.', ['status' => 401]);
        }

        $event = $data['event'];
        $payment = $data['payload']['payment']['entity'] ?? null;

        if (!$payment) {
            return ['success' => false, 'message' => 'No payment entity found.'];
        }

        $order_id = $payment['order_id'] ?? '';
        $payment_id = $payment['id'] ?? '';

        if ($event === 'payment.captured') {
            $notes = $payment['notes'] ?? [];
            $user_id = isset($notes['user_id']) ? (int) $notes['user_id'] : 0;
            $tier = isset($notes['tier']) ? (int) $notes['tier'] : 0;

            if ($user_id && in_array($tier, [1, 2, 3])) {
                $expiry = date('Y-m-d H:i:s', strtotime('+30 days'));
                update_user_meta($user_id, 'alm_subscription_tier', $tier);
                update_user_meta($user_id, 'alm_subscription_status', 'active');
                update_user_meta($user_id, 'alm_razorpay_payment_id', $payment_id);
                update_user_meta($user_id, 'alm_razorpay_order_id', $order_id);
                update_user_meta($user_id, 'alm_subscription_expiry', $expiry);
                delete_user_meta($user_id, 'alm_pending_tier');
            }
        }

        return ['success' => true];
    }

    private function build_status_response($user_id) {
        $tier = (int) get_user_meta($user_id, 'alm_subscription_tier', true);
        $status = get_user_meta($user_id, 'alm_subscription_status', true);
        $expiry = get_user_meta($user_id, 'alm_subscription_expiry', true);
        $payment_id = get_user_meta($user_id, 'alm_razorpay_payment_id', true);

        if (!$tier || !in_array($tier, [0, 1, 2, 3])) {
            $tier = 0;
            $status = 'inactive';
        }

        if ($status === 'active' && !empty($expiry)) {
            if (strtotime($expiry) < time()) {
                $status = 'expired';
                update_user_meta($user_id, 'alm_subscription_status', 'expired');
            }
        }

        return [
            'tier' => $tier,
            'tier_name' => self::$tiers[$tier]['name'],
            'status' => $status ?: 'inactive',
            'expiry' => $expiry ?: null,
            'features' => self::$tiers[$tier]['features'],
            'payment_id' => $payment_id ?: null,
        ];
    }

    private function razorpay_api_request($endpoint, $data = []) {
        $key_id = get_option('alm_razorpay_key_id');
        $key_secret = get_option('alm_razorpay_key_secret');

        $response = wp_remote_post('https://api.razorpay.com/v1/' . $endpoint, [
            'headers' => [
                'Authorization' => 'Basic ' . base64_encode($key_id . ':' . $key_secret),
                'Content-Type' => 'application/json',
            ],
            'body' => wp_json_encode($data),
            'timeout' => 30,
        ]);

        if (is_wp_error($response)) {
            return new WP_Error('razorpay_api_error', 'Failed to contact payment gateway: ' . $response->get_error_message(), ['status' => 502]);
        }

        $body = wp_remote_retrieve_body($response);
        $result = json_decode($body, true);

        $http_code = wp_remote_retrieve_response_code($response);
        if ($http_code < 200 || $http_code >= 300) {
            $razorpay_err = $result['error']['description'] ?? ($result['error']['message'] ?? '');
            $err_code = $result['error']['code'] ?? '';
            $err_msg = $razorpay_err ? "Razorpay error ($err_code): $razorpay_err" : 'Payment gateway error (HTTP ' . $http_code . ')';
            alm_debug_log("Razorpay API error: $err_msg - Response: $body");
            return new WP_Error('razorpay_api_error', $err_msg, ['status' => 502]);
        }

        return $result;
    }

    public static function user_has_feature($user_id, $feature) {
        $tier = (int) get_user_meta($user_id, 'alm_subscription_tier', true);
        $status = get_user_meta($user_id, 'alm_subscription_status', true);
        $expiry = get_user_meta($user_id, 'alm_subscription_expiry', true);

        if ($status !== 'active') {
            return $tier === 0 && $feature === 'tasks';
        }

        if ($status === 'active' && !empty($expiry)) {
            if (strtotime($expiry) < time()) {
                update_user_meta($user_id, 'alm_subscription_status', 'expired');
                return $feature === 'tasks';
            }
        }

        $features = self::$tiers[$tier]['features'] ?? [];
        return in_array($feature, $features, true);
    }

    public static function require_feature_access($feature) {
        $user_id = alm_require_request_user_id();
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $has = self::user_has_feature($user_id, $feature);
        if (!$has) {
            return new WP_Error(
                'feature_restricted',
                'Your current subscription plan does not include access to this feature. Please upgrade to continue.',
                ['status' => 403]
            );
        }

        return $user_id;
    }

    public static function get_tiers() {
        return self::$tiers;
    }

    public static function get_tier_prices() {
        return self::$tier_prices;
    }
}
