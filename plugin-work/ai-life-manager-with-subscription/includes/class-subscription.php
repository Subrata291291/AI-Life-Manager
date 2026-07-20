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
        add_action('alm_daily_subscription_sync', [$this, 'sync_all_subscriptions']);
    }

    public function register_routes() {
        register_rest_route('alm/v1', '/subscription/status', [
            'methods' => 'GET',
            'callback' => [$this, 'get_status'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('alm/v1', '/subscription/create-subscription', [
            'methods' => 'POST',
            'callback' => [$this, 'create_subscription'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('alm/v1', '/subscription/verify', [
            'methods' => 'POST',
            'callback' => [$this, 'verify_payment'],
            'permission_callback' => '__return_true',
        ]);
    }

    public function get_status() {
        $user_id = alm_require_request_user_id();
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $this->sync_user_subscription($user_id);
        return $this->build_status_response($user_id);
    }

    public function create_subscription($request) {
        $user_id = alm_require_request_user_id();
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $tier = isset($request['tier']) ? (int) $request['tier'] : 0;
        if (!isset(self::$tiers[$tier]) || $tier === 0) {
            return new WP_Error('invalid_tier', 'Invalid subscription tier selected.', ['status' => 400]);
        }

        $key_id = get_option('alm_razorpay_key_id');
        if (empty($key_id)) {
            return new WP_Error('razorpay_not_configured', 'Payment gateway not configured. Contact support.', ['status' => 500]);
        }

        $plan_id = $this->ensure_plan_exists($tier);
        if (is_wp_error($plan_id)) {
            return $plan_id;
        }

        $user = get_userdata($user_id);
        $response = $this->razorpay_api_request('subscriptions', [
            'plan_id' => $plan_id,
            'total_count' => 24,
            'customer_notify' => 1,
            'notes' => [
                'user_id' => (string) $user_id,
                'tier' => (string) $tier,
            ],
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        $subscription_id = $response['id'];
        update_user_meta($user_id, 'alm_razorpay_subscription_id', $subscription_id);
        update_user_meta($user_id, 'alm_pending_tier', $tier);

        // Schedule daily sync if not already scheduled
        if (!wp_next_scheduled('alm_daily_subscription_sync')) {
            wp_schedule_event(time(), 'daily', 'alm_daily_subscription_sync');
        }

        return [
            'subscription_id' => $subscription_id,
            'key_id' => $key_id,
            'name' => 'AI Life Manager',
            'description' => self::$tiers[$tier]['name'] . ' Plan (monthly)',
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
        $subscription_id = sanitize_text_field($params['razorpay_subscription_id'] ?? '');
        $signature = sanitize_text_field($params['razorpay_signature'] ?? '');

        if (empty($payment_id) || empty($subscription_id) || empty($signature)) {
            return new WP_Error('missing_params', 'Missing payment verification parameters.', ['status' => 400]);
        }

        $key_secret = get_option('alm_razorpay_key_secret');
        $expected = hash_hmac('sha256', $subscription_id . '|' . $payment_id, $key_secret);

        if (!hash_equals($expected, $signature)) {
            return new WP_Error('verification_failed', 'Payment signature verification failed.', ['status' => 400]);
        }

        $pending_tier = (int) get_user_meta($user_id, 'alm_pending_tier', true);
        $tier = in_array($pending_tier, [1, 2, 3]) ? $pending_tier : 1;

        $expiry = date('Y-m-d H:i:s', strtotime('+30 days'));

        update_user_meta($user_id, 'alm_subscription_tier', $tier);
        update_user_meta($user_id, 'alm_subscription_status', 'active');
        update_user_meta($user_id, 'alm_razorpay_payment_id', $payment_id);
        update_user_meta($user_id, 'alm_razorpay_subscription_id', $subscription_id);
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

    // --- Subscription sync (no webhooks needed) ---

    public function sync_user_subscription($user_id) {
        $sub_id = get_user_meta($user_id, 'alm_razorpay_subscription_id', true);
        if (empty($sub_id)) {
            return;
        }

        $razorpay_sub = $this->razorpay_api_request('subscriptions/' . $sub_id, [], 'GET');
        if (is_wp_error($razorpay_sub)) {
            return;
        }

        $status = $razorpay_sub['status'] ?? '';
        $tier = (int) get_user_meta($user_id, 'alm_subscription_tier', true);
        if (!$tier) $tier = 0;

        // If subscription is completed or cancelled, mark as expired
        if (in_array($status, ['completed', 'cancelled', 'halted'])) {
            update_user_meta($user_id, 'alm_subscription_status', 'expired');
            return;
        }

        // If subscription is active, fetch latest invoice for payment date
        if ($status === 'active') {
            $invoices = $this->razorpay_api_request('invoices?subscription_id=' . $sub_id . '&count=1', [], 'GET');
            if (!is_wp_error($invoices) && !empty($invoices['items'])) {
                $latest = $invoices['items'][0];
                $paid_at = $latest['paid_at'] ?? 0;
                if ($paid_at) {
                    // Set expiry = 30 days from the latest payment
                    $expiry = date('Y-m-d H:i:s', $paid_at + 30 * 24 * 3600);
                    update_user_meta($user_id, 'alm_subscription_status', 'active');
                    update_user_meta($user_id, 'alm_subscription_expiry', $expiry);
                    if ($tier === 0 && isset($razorpay_sub['notes']['tier'])) {
                        $tier = (int) $razorpay_sub['notes']['tier'];
                        update_user_meta($user_id, 'alm_subscription_tier', $tier);
                    }
                }
            }
        }
    }

    public function sync_all_subscriptions() {
        $users = get_users([
            'meta_key' => 'alm_razorpay_subscription_id',
            'meta_compare' => 'EXISTS',
        ]);

        foreach ($users as $user) {
            $this->sync_user_subscription($user->ID);
        }
    }

    // --- Plan management ---

    private function ensure_plan_exists($tier) {
        $option_key = 'alm_razorpay_plan_id_tier_' . $tier;
        $expected_amount = self::$tier_prices[$tier];
        $plan_id = get_option($option_key);

        if ($plan_id) {
            $verify = $this->razorpay_api_request('plans/' . $plan_id, [], 'GET');
            if (!is_wp_error($verify)) {
                $existing_amount = $verify['item']['amount'] ?? 0;
                if ((int) $existing_amount === $expected_amount) {
                    return $plan_id;
                }
                alm_debug_log("Plan $plan_id amount mismatch: expected $expected_amount, got $existing_amount. Creating new plan.");
                delete_option($option_key);
            }
        }

        $response = $this->razorpay_api_request('plans', [
            'period' => 'monthly',
            'interval' => 1,
            'item' => [
                'name' => self::$tiers[$tier]['name'] . ' Plan (₹' . number_format($expected_amount / 100) . '/mo)',
                'amount' => $expected_amount,
                'currency' => 'INR',
                'description' => 'Monthly ' . self::$tiers[$tier]['name'] . ' subscription',
            ],
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        $plan_id = $response['id'];
        update_option($option_key, $plan_id);
        return $plan_id;
    }

    // --- Status helpers ---

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

    private function razorpay_api_request($endpoint, $data = [], $method = 'POST') {
        $key_id = get_option('alm_razorpay_key_id');
        $key_secret = get_option('alm_razorpay_key_secret');

        $args = [
            'headers' => [
                'Authorization' => 'Basic ' . base64_encode($key_id . ':' . $key_secret),
                'Content-Type' => 'application/json',
            ],
            'timeout' => 30,
        ];

        if ($method === 'GET') {
            $url = 'https://api.razorpay.com/v1/' . $endpoint;
            $response = wp_remote_get($url, $args);
        } else {
            $args['body'] = wp_json_encode($data);
            $url = 'https://api.razorpay.com/v1/' . $endpoint;
            $response = wp_remote_post($url, $args);
        }

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
