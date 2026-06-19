import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import {
  confirmDelete,
  successAlert,
} from "../../utils/alerts";

const API =
  "http://localhost/ai-life-manager/wp-json/alm/v1";

interface Task {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  start_time: string;
  end_time: string; 
}

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    start_time: "",
    end_time: "",
  });

  const [editingId, setEditingId] =
  useState<number | null>(null);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(
        `${API}/tasks`
      );

      setTasks(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const updateStatus = async (
    id: number,
    status: string
  ) => {

    try {

      await axios.post(
        `${API}/tasks/status`,
        {
          id,
          status,
        }
      );

      fetchTasks();

    } catch (error) {

      console.error(error);

    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    try {

      if (editingId) {

        await axios.put(
          `${API}/tasks/${editingId}`,
          formData
        );

        setEditingId(null);

      } else {

        await axios.post(
          `${API}/tasks`,
          formData
        );
      }

      setFormData({
        title: "",
        description: "",
        priority: "medium",
        start_time: "",
        end_time: ""
      });

      fetchTasks();

    } catch (error) {

      console.error(error);

    }
  };

  const handleDelete = async (
  id: number
  ) => {

  const confirmed =
    await confirmDelete(
    "This task will be permanently removed."
    );

    if (!confirmed) return;

    try {

    await axios.delete(
      `${API}/tasks/${id}`
    );

    fetchTasks();

    successAlert(
      "Task deleted successfully."
    );

    } catch (error) {

    console.error(error);

    }
  };


  const getTaskStatus = (
  task: Task
) => {

  if (
    task.status === "completed"
  ) {
    return "Completed";
  }

  const now =
    new Date();

  const start =
    new Date(
      task.start_time
    );

  const end =
    new Date(
      task.end_time
    );

  if (now < start) {
    return "Upcoming";
  }

  if (
    now >= start &&
    now <= end
  ) {
    return "In Progress";
  }

  return "Overdue";
};

  return (
    <MainLayout>

      <div className="main-div">

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Tasks</h2>
        </div>

        <div className="row mb-4">

          <div className="col-6 col-md-3">
            <div className="card">
              <div className="card-body text-center">
                <h6>Total Tasks</h6>
                <h3>{tasks.length}</h3>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="card">
              <div className="card-body text-center">
                <h6>Completed</h6>
                <h3>
                  {
                    tasks.filter(
                      t => t.status === "completed"
                    ).length
                  }
                </h3>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="card">
              <div className="card-body text-center">
                <h6>Pending</h6>
                <h3>
                  {
                    tasks.filter(
                      t => t.status === "pending"
                    ).length
                  }
                </h3>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="card">
              <div className="card-body text-center">
                <h6>In Progress</h6>
                <h3>
                  {
                    tasks.filter(
                      t => getTaskStatus(t) === "In Progress"
                    ).length
                  }
                </h3>
              </div>
            </div>
          </div>

        </div>

        {/* Create Task Form */}

        <div className="card mb-4">
          <div className="card-body">

            <h5 className="mb-3">
              {editingId
                ? "Edit Task"
                : "Create New Task"}
            </h5>

            <form onSubmit={handleSubmit}>

              <div className="mb-3">
                <label className="form-label">
                  Title
                </label>

                <input
                  type="text"
                  className="form-control"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Description
                </label>

                <textarea
                  className="form-control"
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="row">

                <div className="col-md-6 mb-3">

                  <label>
                    Start Time
                  </label>

                  <input
                    type="datetime-local"
                    className="form-control"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleChange}
                    required
                  />

                </div>

                <div className="col-md-6 mb-3">

                  <label>
                    End Time
                  </label>

                  <input
                    type="datetime-local"
                    className="form-control"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleChange}
                    required
                  />

                </div>

              </div>

              <div className="mb-3">
                <label className="form-label">
                  Priority
                </label>

                <select
                  className="form-select"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="low">
                    Low
                  </option>

                  <option value="medium">
                    Medium
                  </option>

                  <option value="high">
                    High
                  </option>
                </select>
              </div>

              <button
                className="btn btn-primary"
                type="submit"
              >
                {editingId
                  ? "Update Task"
                  : "Create Task"}
              </button>

            </form>

          </div>
        </div>

        {/* Task List */}

        <div className="card">
          <div className="card-body">

            <h5 className="mb-3">
              Task List
            </h5>

            {tasks.length === 0 ? (
              <p>No tasks found.</p>
            ) : (

              <table className="table table-bordered">

                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Priority</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {tasks.map((task) => (

                    <tr key={task.id}>

                      <td>{task.id}</td>

                      <td>{task.title}</td>

                      <td>
                        {task.description}
                      </td>

                      <td>
                        {task.priority === "high" && (
                          <span className="badge bg-danger">
                            High
                          </span>
                        )}

                        {task.priority === "medium" && (
                          <span className="badge bg-warning text-dark">
                            Medium
                          </span>
                        )}

                        {task.priority === "low" && (
                          <span className="badge bg-success">
                            Low
                          </span>
                        )}

                      </td>

                      <td>
                        {task.start_time
                          ? new Date(
                              task.start_time
                            ).toLocaleString()
                          : "-"}
                      </td>

                      <td>
                        {task.end_time
                          ? new Date(
                              task.end_time
                            ).toLocaleString()
                          : "-"}
                      </td>

                      <td>
                        {(() => {

                          if (
                            !task.start_time ||
                            !task.end_time
                          ) {
                            return "-";
                          }

                          const diffMs =
                            new Date(task.end_time).getTime() -
                            new Date(task.start_time).getTime();

                          const totalMinutes =
                            Math.floor(
                              diffMs / (1000 * 60)
                            );

                          const hours =
                            Math.floor(
                              totalMinutes / 60
                            );

                          const minutes =
                            totalMinutes % 60;

                          if (
                            hours > 0 &&
                            minutes > 0
                          ) {
                            return `${hours} hr ${minutes} min`;
                          }

                          if (hours > 0) {
                            return `${hours} hr`;
                          }

                          return `${minutes} min`;

                        })()}
                      </td>

                      <td>
                        {getTaskStatus(task) ===
                        "Completed" && (
                          <span className="badge bg-success">
                            Completed
                          </span>
                        )}

                        {getTaskStatus(task) ===
                        "Upcoming" && (
                          <span className="badge bg-primary">
                            Upcoming
                          </span>
                        )}

                        {getTaskStatus(task) ===
                        "In Progress" && (
                          <span className="badge bg-info">
                            In Progress
                          </span>
                        )}

                        {getTaskStatus(task) ===
                        "Overdue" && (
                          <span className="badge bg-danger">
                            Expired
                          </span>
                        )}

                      </td>

                      <td>
                        <button
                          className="btn btn-warning btn-sm me-2"
                          onClick={() => {

                            setEditingId(task.id);

                            setFormData({
                              title: task.title,
                              description: task.description,
                              priority: task.priority,
                              start_time: task.start_time,
                              end_time: task.end_time,
                            });
                          }}
                        >
                          Edit
                        </button>

                        {task.status !==
                          "completed" && (
                          <button
                            className="btn btn-success btn-sm me-2"
                            onClick={() =>
                              updateStatus(
                                task.id,
                                "completed"
                              )
                            }
                          >
                            Complete
                          </button>
                        )}

                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            handleDelete(task.id)
                          }
                        >
                          Delete
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            )}

          </div>
        </div>

      </div>

    </MainLayout>
  );
};

export default Tasks;