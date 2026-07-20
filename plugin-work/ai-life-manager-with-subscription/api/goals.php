<?php

if (!defined('ABSPATH')) {
    exit;
}

class ALM_Goals {

    private $table;

    public function __construct() {

        global $wpdb;

        $this->table = $wpdb->prefix . 'alm_goals';

        add_action(
            'rest_api_init',
            [$this, 'register_routes']
        );
    }

    public function register_routes() {

        // GET + POST

        register_rest_route(
            'alm/v1',
            '/goals',
            [
                [
                    'methods' => 'GET',
                    'callback' => [$this, 'get_goals'],
                    'permission_callback' => '__return_true'
                ],
                [
                    'methods' => 'POST',
                    'callback' => [$this, 'create_goal'],
                    'permission_callback' => '__return_true'
                ],
                [
                    'methods' => 'PUT',
                    'callback' => [$this, 'update_goal'],
                    'permission_callback' => '__return_true'
                ]
            ]
        );

        // DELETE

        register_rest_route(
            'alm/v1',
            '/goals/(?P<id>\d+)',
            [
                'methods' => 'DELETE',
                'callback' => [$this, 'delete_goal'],
                'permission_callback' => '__return_true'
            ]
        );

        // Add Money

        register_rest_route(
            'alm/v1',
            '/goals/add-money',
            [
                [
                    'methods' => 'POST',
                    'callback' => [$this, 'add_money'],
                    'permission_callback' => '__return_true'
                ]
            ]
        );
    }

    public function get_goals() {

        global $wpdb;

        $user_id = ALM_Subscription::require_feature_access('goals');
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

    public function create_goal($request) {

        global $wpdb;

        $user_id = ALM_Subscription::require_feature_access('goals');
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $params = $request->get_json_params();

        $goal_name =
            sanitize_text_field(
                $params['goal_name'] ?? ''
            );

        $target_amount =
            floatval(
                $params['target_amount'] ?? 0
            );

        $current_amount =
            floatval(
                $params['current_amount'] ?? 0
            );

        $target_date =
            sanitize_text_field(
                $params['target_date'] ?? ''
            );

        if (empty($goal_name)) {

            return new WP_Error(
                'goal_name_required',
                'Goal name is required',
                ['status' => 400]
            );
        }

        $wpdb->insert(
            $this->table,
            [
                'user_id' => $user_id,
                'goal_name' => $goal_name,
                'target_amount' => $target_amount,
                'current_amount' => $current_amount,
                'target_date' => $target_date
            ]
        );

        return [
            'success' => true,
            'id' => $wpdb->insert_id
        ];
    }

    public function update_goal($request) {

        global $wpdb;

        $user_id = ALM_Subscription::require_feature_access('goals');
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $params =
            $request->get_json_params();

        $wpdb->update(
            $this->table,
            [
                'goal_name' =>
                    $params['goal_name'],

                'target_amount' =>
                    $params['target_amount'],

                'current_amount' =>
                    $params['current_amount'],

                'target_date' =>
                    $params['target_date']
            ],
            [
                'id' =>
                    $params['id'],
                'user_id' =>
                    $user_id
            ]
        );

        return [
            'success' => true
        ];
    }

    public function add_money($request){
        global $wpdb;

        $user_id = ALM_Subscription::require_feature_access('goals');
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $params = $request->get_json_params();

        $goal_id = (int) $params['id'];
        $amount = (float) $params['amount'];

        $goal = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT current_amount
                FROM {$this->table}
                WHERE id=%d
                AND user_id=%d",
                $goal_id,
                $user_id
            ),
            ARRAY_A
        );

        if (!$goal) {

            return new WP_Error(
                'goal_not_found',
                'Goal not found',
                ['status' => 404]
            );
        }

        $new_amount =
            $goal['current_amount'] +
            $amount;

        $wpdb->update(
            $this->table,
            [
                'current_amount' =>
                    $new_amount
            ],
            [
                'id' => $goal_id,
                'user_id' => $user_id
            ]
        );

        return [
            'success' => true
        ];
    }

    public function delete_goal($request) {

        global $wpdb;

        $user_id = ALM_Subscription::require_feature_access('goals');
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $id = (int) $request['id'];

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
