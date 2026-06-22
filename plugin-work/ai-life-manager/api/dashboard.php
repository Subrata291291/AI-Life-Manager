<?php

if (!defined('ABSPATH')) {
    exit;
}

class ALM_Dashboard {

    public function __construct() {

        add_action(
            'rest_api_init',
            [$this, 'register_routes']
        );
    }

    public function register_routes() {

        register_rest_route(
            'alm/v1',
            '/dashboard',
            [
                'methods' => 'GET',
                'callback' => [$this, 'get_stats'],
                'permission_callback' => '__return_true'
            ]
        );
    }

    public function get_stats() {

        global $wpdb;

        $tasks_table =
            $wpdb->prefix . 'alm_tasks';

        $expenses_table =
            $wpdb->prefix . 'alm_expenses';

        $bills_table =
            $wpdb->prefix . 'alm_bills';

        $goals_table =
            $wpdb->prefix . 'alm_goals';

        /* -------------------------
           Totals
        -------------------------- */

        $total_tasks = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM {$tasks_table}"
        );

        $completed_tasks = (int) $wpdb->get_var(
            "SELECT COUNT(*) 
            FROM {$tasks_table}
            WHERE status = 'completed'"
        );

        $pending_tasks = (int) $wpdb->get_var(
            "SELECT COUNT(*)
            FROM {$tasks_table}
            WHERE status = 'pending'"
        );

        $completion_rate =
            $total_tasks > 0
                ? round(
                    ($completed_tasks / $total_tasks) * 100
                )
                : 0;

        $total_expenses = (float) $wpdb->get_var(
            "SELECT COALESCE(SUM(amount),0)
            FROM {$expenses_table}"
        );

        $total_bills = (int) $wpdb->get_var(
            "SELECT COUNT(*)
            FROM {$bills_table}"
        );

        $total_goals = (int) $wpdb->get_var(
            "SELECT COUNT(*)
            FROM {$goals_table}"
        );

        /* -------------------------
           Recent Tasks
        -------------------------- */

        $recent_tasks = $wpdb->get_results(
            "SELECT id,
                    title,
                    status
            FROM {$tasks_table}
            ORDER BY id DESC
            LIMIT 5",
            ARRAY_A
        );

        /* -------------------------
           Upcoming Bills
        -------------------------- */

        $upcoming_bills = $wpdb->get_results(
            "SELECT id,
                    bill_name,
                    amount,
                    due_date,
                    status
            FROM {$bills_table}
            ORDER BY due_date ASC
            LIMIT 5",
            ARRAY_A
        );

        /* -------------------------
           Active Goals
        -------------------------- */

        $active_goals = $wpdb->get_results(
            "SELECT id,
                    goal_name,
                    target_amount,
                    current_amount
            FROM {$goals_table}
            ORDER BY id DESC
            LIMIT 5",
            ARRAY_A
        );
        
        $monthly_expenses =
            $wpdb->get_results(
                "
                SELECT
                DATE_FORMAT(
                    expense_date,
                    '%b'
                ) as month,

                SUM(amount) as total

                FROM {$expenses_table}

                GROUP BY
                MONTH(expense_date)

                ORDER BY
                MONTH(expense_date)
                ",
                ARRAY_A
            );

            /* -------------------------
Generate Task Notifications
-------------------------- */

$notifications_table =
    $wpdb->prefix .
    'alm_notifications';

$current_time =
    current_time('mysql');

$wpdb->query(
    "
    DELETE n
    FROM {$notifications_table} n
    INNER JOIN {$tasks_table} t
        ON n.task_id = t.id
    WHERE n.type = 'task'
    AND t.end_time < NOW()
    "
);

$wpdb->query(
    "
    UPDATE {$tasks_table}
    SET status = 'expired'
    WHERE status = 'pending'
    AND end_time < NOW()
    "
);

$upcoming_tasks =
    $wpdb->get_results(
        "
        SELECT *
        FROM {$tasks_table}
        WHERE status = 'pending'
        ",
        ARRAY_A
    );

    $wpdb->query(
    "
    DELETE n
    FROM {$notifications_table} n
    LEFT JOIN {$tasks_table} t
    ON n.task_id = t.id
    WHERE n.type='task'
    AND t.id IS NULL
    "
);

foreach ($upcoming_tasks as $task) {

    if (
        empty($task['start_time'])
    ) {
        continue;
    }

    $task_time =
        strtotime(
            $task['start_time']
        );

    $now =
        strtotime(
            $current_time
        );

    $minutes_left =
        ($task_time - $now) / 60;

    if (
        $minutes_left <= 15 &&
        $minutes_left > 0
    ) {

        $exists =
            $wpdb->get_var(
                $wpdb->prepare(
                    "
                    SELECT COUNT(*)
                    FROM {$notifications_table}
                    WHERE task_id = %d
                    AND type = 'task'
                    ",
                    $task['id']
                )
            );

        if (!$exists) {

            $wpdb->insert(
                $notifications_table,
                [
                    'user_id' => 1,

                    'task_id' =>
                        (int) $task['id'],

                    'title' =>
                        'Upcoming Task',

                    'message' =>
                        'Task "' .
                        $task['title'] .
                        '" starts in 15 minutes.',

                    'type' =>
                        'task',

                    'status' =>
                        'unread'
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
        }
    }
}

            /* -------------------------
Generate Bill Notifications
-------------------------- */

$bills =
    $wpdb->get_results(
        "
        SELECT *
        FROM {$bills_table}
        WHERE status != 'paid'
        ",
        ARRAY_A
    );

foreach ($bills as $bill) {

    $days_left =
        floor(
            (
                strtotime(
                    $bill['due_date']
                ) -
                time()
            ) / 86400
        );

    if (
        $days_left <= 3 &&
        $days_left >= 0
    ) {

        $message =
            $bill['bill_name'] .
            ' bill is due in ' .
            $days_left .
            ' day(s).';

        $exists =
            $wpdb->get_var(
                $wpdb->prepare(
                    "
                    SELECT COUNT(*)
                    FROM {$notifications_table}
                    WHERE message=%s
                    ",
                    $message
                )
            );

        if (!$exists) {

            $wpdb->insert(
                $notifications_table,
                [
                    'user_id' => 1,

                    'title' =>
                        'Upcoming Bill',

                    'message' =>
                        $message,

                    'type' =>
                        'bill',

                    'status' =>
                        'unread'
                ]
            );
        }
    }
}


        return [

            'tasks' => $total_tasks,

            'completed_tasks' =>
                $completed_tasks,

            'pending_tasks' =>
                $pending_tasks,

            'completion_rate' =>
                $completion_rate,

            'expenses' =>
                $total_expenses,

            'bills' =>
                $total_bills,

            'goals' =>
                $total_goals,

            'recent_tasks' =>
                $recent_tasks,

            'upcoming_bills' =>
                $upcoming_bills,

            'active_goals' =>
                $active_goals,
            
            'monthly_expenses' =>
                $monthly_expenses,

            'insights' => [

                'expenses' =>
                    'You have spent ₹' .
                    $total_expenses,

                'goal' =>
                    'You currently have ' .
                    $total_goals .
                    ' active goals.',

                'bill' =>
                    'You currently have ' .
                    $total_bills .
                    ' upcoming bills.',
            ]
        ];
    }
}