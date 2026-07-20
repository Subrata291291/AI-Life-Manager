<?php

if (!defined('ABSPATH')) {
    exit;
}

class ALM_Tasks {

    private $table;

    public function __construct() {

        global $wpdb;

        $this->table = $wpdb->prefix . 'alm_tasks';

        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {

    register_rest_route(
        'alm/v1',
        '/tasks',
        [
            [
                'methods' => 'GET',
                'callback' => [$this, 'get_tasks'],
                'permission_callback' => '__return_true'
            ],
            [
                'methods' => 'POST',
                'callback' => [$this, 'create_task'],
                'permission_callback' => '__return_true'
            ]
        ]
    );

    register_rest_route(
        'alm/v1',
        '/tasks/(?P<id>\d+)',
        [
            'methods' => 'DELETE',
            'callback' => [$this, 'delete_task'],
            'permission_callback' => '__return_true'
            ]
        );

    register_rest_route(
        'alm/v1',
        '/tasks/status',
        [
            'methods' => 'POST',
            'callback' => [$this, 'update_task_status'],
            'permission_callback' => '__return_true'
        ]
    );

    register_rest_route(
        'alm/v1',
        '/tasks/(?P<id>\d+)',
        [
            'methods' => 'PUT',
            'callback' => [$this, 'update_task'],
            'permission_callback' => '__return_true'
        ]
    );

    }

    public function get_tasks() {

        global $wpdb;

        $user_id = ALM_Subscription::require_feature_access('tasks');
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $tasks = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$this->table} WHERE user_id = %d ORDER BY id DESC",
                $user_id
            ),
            ARRAY_A
        );

        return $tasks;
    }

    public function create_task($request) {

        global $wpdb;

        $user_id = ALM_Subscription::require_feature_access('tasks');
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $wpdb->insert(
            $this->table,
            [
                'user_id' => $user_id,

                'title' => sanitize_text_field(
                    $request['title']
                ),

                'description' => sanitize_textarea_field(
                    $request['description']
                ),

                'priority' => sanitize_text_field(
                    $request['priority']
                ),

                'start_time' => sanitize_text_field(
                    $request['start_time']
                ),

                'end_time' => sanitize_text_field(
                    $request['end_time']
                ),

                'status' => 'pending'
            ]
        );

        $task_id = $wpdb->insert_id;

        $notifications_table =
            $wpdb->prefix .
            'alm_notifications';

        $wpdb->insert(
            $notifications_table,
            [
                'user_id' => $user_id,

                'task_id' => $task_id,

                'title' => 'Upcoming Task',

                'message' => sanitize_text_field(
                    $request['title']
                ),

                'type' => 'task',

                'status' => 'unread'
            ],
            [
                '%d',
                '%d',
                '%s',
                '%s',
                '%s',
                '%s'
            ]
        );

        return [
            'success' => true,
            'id' => $task_id
        ];
    }
    
    public function delete_task($request) {

    global $wpdb;

    $user_id = ALM_Subscription::require_feature_access('tasks');
    if (is_wp_error($user_id)) {
        return $user_id;
    }

    $id = (int) $request['id'];

    $notifications_table =
        $wpdb->prefix . 'alm_notifications';

    // delete task notifications first
    $wpdb->delete(
        $notifications_table,
        [
            'task_id' => $id,
            'type' => 'task',
            'user_id' => $user_id
        ],
        [
            '%d',
            '%s',
            '%d'
        ]
    );

    // delete task
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

    public function update_task_status($request) {

        global $wpdb;

        $user_id = ALM_Subscription::require_feature_access('tasks');
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $params =
            $request->get_json_params();

        $wpdb->update(
            $this->table,
            [
                'status' =>
                    $params['status']
            ],
            [
                'id' =>
                    $params['id'],
                'user_id' =>
                    $user_id
            ]
        );

        if (
            $params['status'] ===
            'completed'
        ) {

            $notifications_table =
                $wpdb->prefix .
                'alm_notifications';

            $wpdb->delete(
                $notifications_table,
                [
                    'task_id' =>
                        $params['id'],
                    'type' =>
                        'task',
                    'user_id' =>
                        $user_id
                ],
                [
                    '%d',
                    '%s',
                    '%d'
                ]
            );
        }

        return [
            'success' => true
        ];
    }

    public function update_task($request){
        global $wpdb;

        $user_id = ALM_Subscription::require_feature_access('tasks');
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        $id = (int) $request['id'];

        $params =
            $request->get_json_params();

        $wpdb->update(
            $this->table,
            [
                'title' =>
                    sanitize_text_field(
                        $params['title']
                    ),

                'description' =>
                    sanitize_textarea_field(
                        $params['description']
                    ),

                'priority' =>
                    sanitize_text_field(
                        $params['priority']
                    ),
                
                'start_time' =>
                    sanitize_text_field(
                        $params['start_time']
                    ),

                'end_time' =>
                    sanitize_text_field(
                        $params['end_time']
                    ),
            ],
            [
                'id' => $id,
                'user_id' => $user_id
            ]
        );

        $notifications_table =
            $wpdb->prefix .
            'alm_notifications';

        $wpdb->delete(
            $notifications_table,
            [
                'task_id' => $id,
                'type' => 'task',
                'user_id' => $user_id
            ],
            [
                '%d',
                '%s',
                '%d'
            ]
        );

        return [
            'success' => true
        ];
    }
}
