<?php

if (!defined('ABSPATH')) {
    exit;
}

class ALM_Admin {

    public function __construct() {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_post_alm_set_subscription', [$this, 'handle_set_subscription']);
        add_action('admin_post_alm_test_razorpay', [$this, 'handle_test_razorpay']);
    }

    public function add_admin_menu() {
        add_menu_page(
            'AI Life Manager',
            'AI Life Manager',
            'manage_options',
            'ai-life-manager',
            [$this, 'render_settings_page'],
            'dashicons-admin-generic',
            80
        );

        add_submenu_page(
            'ai-life-manager',
            'Subscriptions',
            'Subscriptions',
            'manage_options',
            'alm-subscriptions',
            [$this, 'render_subscriptions_page']
        );
    }

    public function register_settings() {
        register_setting('alm_settings_group', 'alm_razorpay_key_id');
        register_setting('alm_settings_group', 'alm_razorpay_key_secret');
    }

    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1>AI Life Manager Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields('alm_settings_group'); ?>
                <?php do_settings_sections('alm_settings_group'); ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="alm_razorpay_key_id">Razorpay Key ID</label>
                        </th>
                        <td>
                            <input
                                type="text"
                                id="alm_razorpay_key_id"
                                name="alm_razorpay_key_id"
                                value="<?php echo esc_attr(get_option('alm_razorpay_key_id')); ?>"
                                class="regular-text"
                            />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="alm_razorpay_key_secret">Razorpay Key Secret</label>
                        </th>
                        <td>
                            <input
                                type="password"
                                id="alm_razorpay_key_secret"
                                name="alm_razorpay_key_secret"
                                value="<?php echo esc_attr(get_option('alm_razorpay_key_secret')); ?>"
                                class="regular-text"
                            />
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>

            <hr />

            <h2>Test API Connection</h2>
            <p>Visit this URL in your browser to verify the API is working:</p>
            <code>
                <a href="<?php echo esc_url(rest_url('alm/v1/ping')); ?>" target="_blank">
                    <?php echo esc_url(rest_url('alm/v1/ping')); ?>
                </a>
            </code>

            <?php
            $test_result = get_transient('alm_razorpay_test_result');
            delete_transient('alm_razorpay_test_result');
            if ($test_result) : ?>
                <div class="notice notice-<?php echo $test_result['success'] ? 'success' : 'error'; ?> is-dismissible">
                    <p><?php echo esc_html($test_result['message']); ?></p>
                </div>
            <?php endif; ?>

            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin-top:1rem">
                <?php wp_nonce_field('alm_test_razorpay_nonce', 'alm_test_nonce'); ?>
                <input type="hidden" name="action" value="alm_test_razorpay" />
                <button type="submit" class="button button-secondary">Test Razorpay Connection</button>
            </form>
        </div>
        <?php
    }

    public function render_subscriptions_page() {
        $tiers = [
            0 => 'Free',
            1 => 'Tasks (₹499)',
            2 => 'Essential (₹999)',
            3 => 'Premium (₹1,499)',
        ];

        $saved = false;
        if ($_GET['alm_sub_saved'] ?? false) {
            $saved = true;
        }

        $users = get_users(['orderby' => 'display_name', 'order' => 'ASC']);
        ?>
        <div class="wrap">
            <h1>User Subscriptions</h1>

            <?php if ($saved) : ?>
                <div class="notice notice-success is-dismissible"><p>Subscription updated.</p></div>
            <?php endif; ?>

            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Current Tier</th>
                        <th>Status</th>
                        <th>Expiry</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($users as $u) :
                        $tier = (int) get_user_meta($u->ID, 'alm_subscription_tier', true);
                        $status = get_user_meta($u->ID, 'alm_subscription_status', true);
                        $expiry = get_user_meta($u->ID, 'alm_subscription_expiry', true);
                    ?>
                    <tr>
                        <td><?php echo esc_html($u->display_name); ?></td>
                        <td><?php echo esc_html($u->user_email); ?></td>
                        <td><?php echo esc_html($tiers[$tier] ?? 'Free'); ?></td>
                        <td><?php echo esc_html($status ?: 'inactive'); ?></td>
                        <td><?php echo esc_html($expiry ?: '—'); ?></td>
                        <td>
                            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:inline">
                                <?php wp_nonce_field('alm_set_sub_nonce', 'alm_nonce'); ?>
                                <input type="hidden" name="action" value="alm_set_subscription" />
                                <input type="hidden" name="user_id" value="<?php echo $u->ID; ?>" />
                                <select name="tier">
                                    <?php foreach ($tiers as $tid => $tname) : ?>
                                        <option value="<?php echo $tid; ?>" <?php selected($tier, $tid); ?>><?php echo esc_html($tname); ?></option>
                                    <?php endforeach; ?>
                                </select>
                                <select name="status">
                                    <option value="active" <?php selected($status, 'active'); ?>>Active</option>
                                    <option value="inactive" <?php selected($status, 'inactive'); ?>>Inactive</option>
                                    <option value="expired" <?php selected($status, 'expired'); ?>>Expired</option>
                                </select>
                                <input type="text" name="expiry" placeholder="YYYY-MM-DD HH:MM:SS" value="<?php echo esc_attr($expiry ?: ''); ?>" />
                                <button type="submit" class="button button-primary">Update</button>
                            </form>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php
    }

    public function handle_set_subscription() {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized.');
        }

        check_admin_referer('alm_set_sub_nonce', 'alm_nonce');

        $user_id = intval($_POST['user_id'] ?? 0);
        $tier    = intval($_POST['tier'] ?? 0);
        $status  = sanitize_text_field($_POST['status'] ?? 'inactive');
        $expiry  = sanitize_text_field($_POST['expiry'] ?? '');

        if (!$user_id || !get_user_by('ID', $user_id)) {
            wp_die('Invalid user.');
        }

        if (!in_array($tier, [0, 1, 2, 3])) {
            $tier = 0;
        }
        if (!in_array($status, ['active', 'inactive', 'expired'])) {
            $status = 'inactive';
        }

        update_user_meta($user_id, 'alm_subscription_tier', $tier);
        update_user_meta($user_id, 'alm_subscription_status', $status);
        if ($expiry) {
            update_user_meta($user_id, 'alm_subscription_expiry', $expiry);
        } else {
            delete_user_meta($user_id, 'alm_subscription_expiry');
        }
        if ($tier === 0) {
            delete_user_meta($user_id, 'alm_razorpay_payment_id');
            delete_user_meta($user_id, 'alm_razorpay_order_id');
        }

        wp_redirect(admin_url('admin.php?page=alm-subscriptions&alm_sub_saved=1'));
        exit;
    }

    public function handle_test_razorpay() {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized.');
        }
        check_admin_referer('alm_test_razorpay_nonce', 'alm_test_nonce');

        $key_id = get_option('alm_razorpay_key_id');
        $key_secret = get_option('alm_razorpay_key_secret');

        if (empty($key_id) || empty($key_secret)) {
            set_transient('alm_razorpay_test_result', [
                'success' => false,
                'message' => 'Razorpay keys are not configured. Set them above first.',
            ], 30);
            wp_redirect(admin_url('admin.php?page=ai-life-manager'));
            exit;
        }

        $response = wp_remote_get('https://api.razorpay.com/v1/payments', [
            'headers' => [
                'Authorization' => 'Basic ' . base64_encode($key_id . ':' . $key_secret),
                'Content-Type' => 'application/json',
            ],
            'timeout' => 15,
        ]);

        if (is_wp_error($response)) {
            set_transient('alm_razorpay_test_result', [
                'success' => false,
                'message' => 'Connection failed: ' . $response->get_error_message(),
            ], 30);
            wp_redirect(admin_url('admin.php?page=ai-life-manager'));
            exit;
        }

        $http_code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);

        if ($http_code === 200) {
            set_transient('alm_razorpay_test_result', [
                'success' => true,
                'message' => 'Razorpay connection successful! API is reachable with the configured keys.',
            ], 30);
        } elseif ($http_code === 401) {
            $err = $body['error']['description'] ?? $body['error']['message'] ?? 'Unknown error';
            set_transient('alm_razorpay_test_result', [
                'success' => false,
                'message' => "Razorpay authentication failed: $err. Double-check your Key ID and Key Secret.",
            ], 30);
        } else {
            $err = $body['error']['description'] ?? 'HTTP ' . $http_code;
            set_transient('alm_razorpay_test_result', [
                'success' => false,
                'message' => "Razorpay error: $err",
            ], 30);
        }

        wp_redirect(admin_url('admin.php?page=ai-life-manager'));
        exit;
    }
}
