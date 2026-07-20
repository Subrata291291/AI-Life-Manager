<?php

if (!defined('ABSPATH')) {
    exit;
}

class ALM_Loader {

    public function __construct() {

        require_once ALM_PLUGIN_PATH . 'includes/class-api.php';
        require_once ALM_PLUGIN_PATH . 'includes/class-auth.php';
        require_once ALM_PLUGIN_PATH . 'includes/class-subscription.php';
        require_once ALM_PLUGIN_PATH . 'api/tasks.php';
        require_once ALM_PLUGIN_PATH . 'api/expenses.php';
        require_once ALM_PLUGIN_PATH . 'api/dashboard.php';
        require_once ALM_PLUGIN_PATH . 'api/bills.php';
        require_once ALM_PLUGIN_PATH . 'api/goals.php';
        require_once ALM_PLUGIN_PATH . 'includes/class-alm-notifications.php';
        require_once ALM_PLUGIN_PATH . 'includes/class-admin.php';

        new ALM_API();
        new ALM_Auth();
        new ALM_Subscription();
        new ALM_Tasks();
        new ALM_Expenses();
        new ALM_Dashboard();
        new ALM_Bills();
        new ALM_Goals();
        new ALM_Notifications();
        new ALM_Admin();
    }
}