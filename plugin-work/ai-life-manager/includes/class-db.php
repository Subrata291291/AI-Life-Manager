<?php

if (!defined('ABSPATH')) {
    exit;
}

class ALM_DB {

    public static function create_tables() {

        global $wpdb;

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $charset_collate = $wpdb->get_charset_collate();

        $tasks_table = $wpdb->prefix . 'alm_tasks';
        $expenses_table = $wpdb->prefix . 'alm_expenses';
        $bills_table = $wpdb->prefix . 'alm_bills';
        $goals_table = $wpdb->prefix . 'alm_goals';
        $notifications_table = $wpdb->prefix . 'alm_notifications';

        $sql = [];

        $sql[] = "CREATE TABLE $tasks_table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT UNSIGNED NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NULL,
            start_time DATETIME,
            end_time DATETIME,
            priority VARCHAR(20) DEFAULT 'medium',
            status VARCHAR(20) DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(id),
            KEY user_id (user_id)
        ) $charset_collate;";

        $sql[] = "CREATE TABLE $expenses_table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT UNSIGNED NOT NULL,
            amount DECIMAL(12,2) NOT NULL,
            category VARCHAR(100),
            note TEXT,
            expense_date DATE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(id),
            KEY user_id (user_id)
        ) $charset_collate;";

        $sql[] = "CREATE TABLE $bills_table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT UNSIGNED NOT NULL,
            bill_name VARCHAR(255),
            amount DECIMAL(12,2),
            due_date DATE,
            recurring VARCHAR(50) DEFAULT 'monthly',
            reminder_days INT DEFAULT 3,
            status VARCHAR(20) DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(id),
            KEY user_id (user_id)
        ) $charset_collate;";

        $sql[] = "CREATE TABLE $goals_table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT UNSIGNED NOT NULL,
            goal_name VARCHAR(255),
            target_amount DECIMAL(12,2),
            current_amount DECIMAL(12,2),
            target_date DATE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(id),
            KEY user_id (user_id)
        ) $charset_collate;";

        $sql[] = "CREATE TABLE $notifications_table (

            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

            user_id BIGINT UNSIGNED NOT NULL,

            task_id BIGINT UNSIGNED NULL,

            title VARCHAR(255) NOT NULL,

            message TEXT NOT NULL,

            type VARCHAR(50) NOT NULL,

            status VARCHAR(20)
            DEFAULT 'unread',

            created_at DATETIME
            DEFAULT CURRENT_TIMESTAMP,

            PRIMARY KEY(id),

            KEY user_id (user_id),

            KEY task_id (task_id)

        ) $charset_collate;";


        foreach ($sql as $query) {
            dbDelta($query);
        }
    }
}