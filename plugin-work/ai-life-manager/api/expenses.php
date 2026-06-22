<?php

if (!defined('ABSPATH')) {
    exit;
}

class ALM_Expenses {

    private $table;

    public function __construct() {

        global $wpdb;

        $this->table = $wpdb->prefix . 'alm_expenses';

        add_action(
            'rest_api_init',
            [$this, 'register_routes']
        );
    }


    public function register_routes() {

        register_rest_route(
            'alm/v1',
            '/expenses',
            [
                [
                    'methods' => 'GET',
                    'callback' => [$this, 'get_expenses'],
                    'permission_callback' => '__return_true'
                ],
                [
                    'methods' => 'POST',
                    'callback' => [$this, 'create_expense'],
                    'permission_callback' => '__return_true'
                ],
                [
                    'methods' => 'PUT',
                    'callback' => [$this, 'update_expense'],
                    'permission_callback' => '__return_true'
                ]
            ]
        );

        register_rest_route(
            'alm/v1',
            '/expenses/(?P<id>\d+)',
            [
                [
                    'methods' => 'DELETE',
                    'callback' => [$this, 'delete_expense'],
                    'permission_callback' => '__return_true'
                ]
            ]
        );
    }



    public function get_expenses() {

        global $wpdb;

        $user_id = alm_require_request_user_id();

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$this->table} WHERE user_id = %d ORDER BY id DESC",
                $user_id
            ),
            ARRAY_A
        );
    }

    public function create_expense($request) {

        global $wpdb;

        $user_id = alm_require_request_user_id();

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $wpdb->insert(
            $this->table,
            [
                'user_id' => $user_id,

                'amount' => sanitize_text_field(
                    $request['amount']
                ),

                'category' => sanitize_text_field(
                    $request['category']
                ),

                'note' => sanitize_textarea_field(
                    $request['note']
                ),

                'expense_date' => sanitize_text_field(
                    $request['expense_date']
                )
            ]
        );

        return [
            'success' => true,
            'id' => $wpdb->insert_id
        ];
    }

    public function delete_expense($request) {

        global $wpdb;

        $user_id = alm_require_request_user_id();

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $id = (int) $request['id'];

        $deleted = $wpdb->delete(
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

        if ($deleted === false) {
            return new WP_Error(
                'delete_failed',
                'Unable to delete expense',
                ['status' => 500]
            );
        }

        return [
            'success' => true,
            'message' => 'Expense deleted'
        ];
    }

    public function update_expense($request) {

        global $wpdb;

        $user_id = alm_require_request_user_id();

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $params = $request->get_json_params();

        $wpdb->update(
            $this->table,
            [
                'amount' => sanitize_text_field(
                    $params['amount']
                ),

                'category' => sanitize_text_field(
                    $params['category']
                ),

                'note' => sanitize_textarea_field(
                    $params['note']
                ),

                'expense_date' => sanitize_text_field(
                    $params['expense_date']
                )
            ],
            [
                'id' => (int) $params['id'],
                'user_id' => $user_id
            ]
        );

        return [
            'success' => true
        ];
    }
}
