<?php

if (!defined('ABSPATH')) {
    exit;
}

class ALM_Bills {

    private $table;

    public function __construct() {

        global $wpdb;

        $this->table = $wpdb->prefix . 'alm_bills';

        add_action(
            'rest_api_init',
            [$this, 'register_routes']
        );
    }

    public function register_routes() {

        register_rest_route(
            'alm/v1',
            '/bills',
            [
                [
                    'methods' => 'GET',
                    'callback' => [$this, 'get_bills'],
                    'permission_callback' => '__return_true'
                ],
                [
                    'methods' => 'POST',
                    'callback' => [$this, 'create_bill'],
                    'permission_callback' => '__return_true'
                ],
                [
                    'methods' => 'PUT',
                    'callback' => [$this, 'update_bill'],
                    'permission_callback' => '__return_true'
                ]
            ]
        );

        register_rest_route(
            'alm/v1',
            '/bills/(?P<id>\d+)',
            [
                'methods' => 'DELETE',
                'callback' => [$this, 'delete_bill'],
                'permission_callback' => '__return_true'
            ]
        );

        register_rest_route(
            'alm/v1',
            '/bills/(?P<id>\d+)/paid',
            [
                'methods' => 'PUT',
                'callback' => [$this, 'mark_paid'],
                'permission_callback' => '__return_true'
            ]
        );
    }

    public function get_bills() {

        global $wpdb;

        $user_id = alm_require_request_user_id();

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $bills = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$this->table} WHERE user_id = %d ORDER BY due_date ASC",
                $user_id
            ),
            ARRAY_A
        );

        $today = current_time('Y-m-d');

            foreach ($bills as &$bill) {

                if ($bill['status'] === 'paid') {

                    $bill['display_status'] = 'paid';

                } else {

                    if ($bill['due_date'] < $today) {

                        $bill['display_status'] = 'overdue';

                    } elseif ($bill['due_date'] === $today) {

                        $bill['display_status'] = 'today';

                    } else {

                        $bill['display_status'] = 'upcoming';
                    }
                }
            }

            return $bills;
    }

    public function create_bill($request) {

        global $wpdb;

        $user_id = alm_require_request_user_id();

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $params = $request->get_json_params();

        $wpdb->insert(
            $this->table,
            [
                'user_id' => $user_id,
                'bill_name' => $params['bill_name'],
                'amount' => $params['amount'],
                'due_date' => $params['due_date'],
                'recurring' => $params['recurring'],
                'reminder_days' => $params['reminder_days'] ?? 3,
                'status' => 'pending'
            ]
        );

        return [
            'success' => true,
            'id' => $wpdb->insert_id
        ];
    }

    public function update_bill($request) {

        global $wpdb;

        $user_id = alm_require_request_user_id();

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $params = $request->get_json_params();

        $wpdb->update(
            $this->table,
            [
                'bill_name' => $params['bill_name'],
                'amount' => $params['amount'],
                'due_date' => $params['due_date'],
                'recurring' => $params['recurring'],
                'reminder_days' => $params['reminder_days']
            ],
            [
                'id' => $params['id'],
                'user_id' => $user_id
            ]
        );

        return [
            'success' => true
        ];
    }

    public function mark_paid($request) {

        global $wpdb;

        $user_id = alm_require_request_user_id();

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $wpdb->update(
            $this->table,
            [
                'status' => 'paid'
            ],
            [
                'id' => $request['id'],
                'user_id' => $user_id
            ]
        );

        return [
            'success' => true
        ];
    }

    public function delete_bill($request) {

        global $wpdb;

        $user_id = alm_require_request_user_id();

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $id = (int) $request['id'];

        $bill = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT bill_name
                FROM {$this->table}
                WHERE id = %d
                AND user_id = %d",
                $id,
                $user_id
            ),
            ARRAY_A
        );

        if ($bill) {

            $notifications_table =
                $wpdb->prefix .
                'alm_notifications';

            $wpdb->query(
                $wpdb->prepare(
                    "
                    DELETE FROM {$notifications_table}
                    WHERE type = 'bill'
                    AND user_id = %d
                    AND message LIKE %s
                    ",
                    $user_id,
                    '%' .
                    $wpdb->esc_like(
                        $bill['bill_name']
                    ) .
                    '%'
                )
            );
        }

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
            'success' => true
        ];
    }
}
