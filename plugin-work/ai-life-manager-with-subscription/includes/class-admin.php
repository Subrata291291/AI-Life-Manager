<?php

if (!defined('ABSPATH')) {
    exit;
}

class ALM_Admin {

    public function __construct() {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
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
        </div>
        <?php
    }
}
