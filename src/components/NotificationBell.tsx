import { useEffect, useState } from "react";
import axios from "axios";

const API =
  "http://localhost/ai-life-manager/wp-json/alm/v1";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  status: string;
  created_at: string;
  remaining_time?: string;
  formatted_due_date?: string;
  bill_expired?: boolean;
}

export default function NotificationBell() {

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [show, setShow] =
    useState(false);

  const fetchNotifications =
    async () => {

      try {

        const response =
          await axios.get(
            `${API}/notifications`
          );

        setNotifications(
          response.data
        );

      } catch (error) {

        console.error(error);

      }
    };

  const deleteNotification =
    async (id: number) => {

      try {

        await axios.delete(
          `${API}/notifications/${id}`
        );

        setNotifications(
          (prev) =>
            prev.filter(
              (item) =>
                item.id !== id
            )
        );

      } catch (error) {

        console.error(error);

      }
    };

  useEffect(() => {

    fetchNotifications();

    const interval =
      setInterval(
        fetchNotifications,
        60000
      );

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <div
      className="position-relative me-3"
    >

      <button
        className="btn btn-light position-relative"
        onClick={() =>
          setShow(!show)
        }
      >

        🔔

        {notifications.length > 0 && (

          <span
            className="
            position-absolute
            top-0
            start-100
            translate-middle
            badge
            rounded-pill
            bg-danger
          "
          >
            {notifications.length}
          </span>

        )}

      </button>

      {show && (

        <div
          className="card position-absolute"
          style={{
            width: "350px",
            right: 0,
            zIndex: 9999,
          }}
        >

          <div className="card-header">
            Notifications
          </div>

          <div
            className="card-body"
            style={{
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >

            {notifications.length === 0 ? (

              <p className="mb-0">
                No notifications
              </p>

            ) : (

              notifications.map(
                (item) => (

                  <div
                    key={item.id}
                    className="
                    border-bottom
                    mb-2
                    pb-2
                  "
                  >

                    <div
                      className="
                      d-flex
                      justify-content-between
                      align-items-start
                      "
                    >

                      <strong>
                        {item.title}
                      </strong>

                      {(
                        item.remaining_time === "Expired" ||
                        item.bill_expired
                      ) && (

                        <button
                          className="
                          btn
                          btn-sm
                          border-0
                          text-danger
                          p-0
                          "
                          title="Remove Notification"
                          onClick={() =>
                            deleteNotification(
                              item.id
                            )
                          }
                        >
                          ✕
                        </button>

                      )}

                    </div>

                    <div>
                      {item.message}
                    </div>

                    <small
                      className={
                        item.remaining_time ===
                        "Expired"
                          ? "text-danger"
                          : "text-primary"
                      }
                    >

                      {item.type === "task" ? (

                        item.remaining_time === "Expired" ? (

                          "Expired"

                        ) : (

                          `Starts in ${item.remaining_time}`
                        )

                      ) : (

                        item.formatted_due_date
                          ? `Due Date: ${item.formatted_due_date}`
                          : ""
                      )}

                    </small>

                  </div>

                )
              )

            )}

          </div>

        </div>

      )}

    </div>

  );
}