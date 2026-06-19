import { useEffect, useState } from "react";
import axios from "axios";
import { Bell, X } from "lucide-react";

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
    <div className="notification">
      <button
        className="icon-button notification__button"
        onClick={() =>
          setShow(!show)
        }
        type="button"
        aria-label="Notifications"
      >
        <Bell size={18} />

        {notifications.length > 0 && (
          <span className="notification__badge">
            {notifications.length}
          </span>
        )}
      </button>

      {show && (
        <div className="notification-menu">
          <div className="notification-menu__header">
            <strong>
              Notifications
            </strong>
            <span>
              {notifications.length}
            </span>
          </div>

          <div className="notification-menu__body">
            {notifications.length === 0 ? (
              <p className="mb-0">
                No notifications
              </p>
            ) : (
              notifications.map(
                (item) => (
                  <div
                    key={item.id}
                    className="notification-item"
                  >
                    <div className="notification-item__top">
                      <strong>
                        {item.title}
                      </strong>

                      {(
                        item.remaining_time === "Expired" ||
                        item.bill_expired
                      ) && (
                        <button
                          className="icon-button icon-button--danger"
                          title="Remove notification"
                          onClick={() =>
                            deleteNotification(
                              item.id
                            )
                          }
                          type="button"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>

                    <p>
                      {item.message}
                    </p>

                    <small
                      className={
                        item.remaining_time === "Expired"
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
