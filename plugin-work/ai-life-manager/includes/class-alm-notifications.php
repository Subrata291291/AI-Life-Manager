<?php

if (!defined('ABSPATH')) {
    exit;
}

class ALM_Notifications {

    private $table;

    public function __construct() {

        global $wpdb;

        $this->table =
            $wpdb->prefix .
            'alm_notifications';

        add_action(
            'rest_api_init',
            [$this, 'register_routes']
        );
    }

    public function register_routes() {

        register_rest_route(
            'alm/v1',
            '/notifications',
            [
                [
                    'methods' => 'GET',
                    'callback' => [$this, 'get_notifications'],
                    'permission_callback' => '__return_true'
                ]
            ]
        );

        register_rest_route(
            'alm/v1',
            '/notifications/read',
            [
                [
                    'methods' => 'POST',
                    'callback' => [$this, 'mark_read'],
                    'permission_callback' => '__return_true'
                ]
            ]
        );

        register_rest_route(
            'alm/v1',
            '/notifications/(?P<id>\d+)',
            [
                [
                    'methods' => 'DELETE',
                    'callback' => [$this, 'delete_notification'],
                    'permission_callback' => '__return_true'
                ]
            ]
        );
    }

    public function get_notifications() {

        global $wpdb;

        $user_id = alm_require_request_user_id();

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $tasks_table =
            $wpdb->prefix . 'alm_tasks';

        $bills_table =
            $wpdb->prefix . 'alm_bills';

        $notifications =
            $wpdb->get_results(
                $wpdb->prepare(
                    "
                    SELECT
                        n.*,
                        t.start_time,
                        t.end_time,
                        b.due_date
                    FROM {$this->table} n

                    LEFT JOIN {$tasks_table} t
                        ON n.task_id = t.id

                    LEFT JOIN {$bills_table} b
                        ON n.message LIKE CONCAT('%', b.bill_name, '%') AND b.user_id = %d

                    WHERE n.user_id = %d
                    ORDER BY n.id DESC
                    ",
                    $user_id,
                    $user_id
                ),
                ARRAY_A
            );

        $final_notifications = [];

        foreach ($notifications as $notification) {

            /* -------------------------
               TASK NOTIFICATIONS
            -------------------------- */

            if (
                $notification['type'] === 'task' &&
                !empty($notification['start_time'])
            ) {

                $remaining =
                    strtotime(
                        $notification['start_time']
                    ) -
                    current_time('timestamp');

                if ($remaining <= 0) {

                    $notification['remaining_time'] =
                        'Expired';

                } else {

                    $days =
                        floor(
                            $remaining / 86400
                        );

                    $hours =
                        floor(
                            ($remaining % 86400) / 3600
                        );

                    $minutes =
                        floor(
                            ($remaining % 3600) / 60
                        );

                    if ($days > 0) {

                        $notification['remaining_time'] =
                            $days .
                            ' day ' .
                            $hours .
                            ' hr';

                    } elseif ($hours > 0) {

                        $notification['remaining_time'] =
                            $hours .
                            ' hr ' .
                            $minutes .
                            ' min';

                    } else {

                        $notification['remaining_time'] =
                            $minutes .
                            ' min';
                    }
                }
            }

            /* -------------------------
               BILL NOTIFICATIONS
            -------------------------- */

            if (
                $notification['type'] === 'bill' &&
                !empty($notification['due_date'])
            ) {

                $due_timestamp =
                    strtotime(
                        $notification['due_date']
                    );

                $today_timestamp =
                    strtotime(
                        current_time('Y-m-d')
                    );

                $notification['formatted_due_date'] =
                    date(
                        'd M Y',
                        $due_timestamp
                    );

                $notification['bill_expired'] =
                    $due_timestamp <
                    $today_timestamp;

                /*
                 Auto delete expired bill
                 notifications
                */

                if (
                    $notification['bill_expired']
                ) {

                    $wpdb->delete(
                        $this->table,
                        [
                            'id' =>
                                $notification['id'],
                            'user_id' =>
                                $user_id
                        ],
                        [
                            '%d',
                            '%d'
                        ]
                    );

                    continue;
                }
            }

            $final_notifications[] =
                $notification;
        }

        return $final_notifications;
    }

    public function mark_read($request) {

        global $wpdb;

        $user_id = alm_require_request_user_id();

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $params =
            $request->get_json_params();

        $wpdb->update(
            $this->table,
            [
                'status' => 'read'
            ],
            [
                'id' => $params['id'],
                'user_id' => $user_id
            ],
            [
                '%s'
            ],
            [
                '%d',
                '%d'
            ]
        );

        return [
            'success' => true,
            'message' =>
                'Notification marked as read'
        ];
    }

    public function delete_notification($request) {

        global $wpdb;

        $user_id = alm_require_request_user_id();

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $id =
            (int) $request['id'];

        $wpdb->delete(
            $this->table,
            [
                'id' => $id,
                'user_id' => $user_id
            ],
            [
                '%d',
                '%d'
            ]
        );

        return [
            'success' => true,
            'message' =>
                'Notification deleted'
        ];
    }
}