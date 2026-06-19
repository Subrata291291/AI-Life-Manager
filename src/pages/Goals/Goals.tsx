import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import {
  createGoal,
  getGoals,
  deleteGoal,
  updateGoal,
  addMoneyToGoal
} from "../../services/goalService";
import Swal from "sweetalert2";
import {
  confirmDelete,
  successAlert,
  errorAlert,
} from "../../utils/alerts";

interface Goal {
  id: number;
  goal_name: string;
  target_amount: string;
  current_amount: string;
  target_date: string;
}

const Goals = () => {
  const [goals, setGoals] =
    useState<Goal[]>([]);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [formData, setFormData] =
    useState({
      goal_name: "",
      target_amount: "",
      current_amount: "",
      target_date: "",
    });

    const [searchText, setSearchText] =
      useState("");

      const filteredGoals =
        goals.filter(goal =>
          goal.goal_name
            .toLowerCase()
            .includes(
              searchText.toLowerCase()
            )
        );

  const fetchGoals = async () => {
    try {
      const data =
        await getGoals();

      setGoals(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    try {

      if (editingId) {

        await updateGoal({
          id: editingId,
          ...formData,
        });

        setEditingId(null);

      } else {

        await createGoal(
          formData
        );

      }

      setFormData({
        goal_name: "",
        target_amount: "",
        current_amount: "",
        target_date: "",
      });

      fetchGoals();

    } catch (error) {

      console.error(error);

    }
  };

  const handleEdit = (
    goal: Goal
  ) => {

    setEditingId(goal.id);

    setFormData({
      goal_name: goal.goal_name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      target_date: goal.target_date,
    });
  };

  const handleAddMoney =
  async (goalId: number) => {

    const result =
      await Swal.fire({
        title: "Add Money",
        input: "number",
        inputLabel: "Enter amount",
        inputPlaceholder: "e.g. 5000",
        showCancelButton: true,
        confirmButtonText: "Add Money",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#198754",
      });

    if (!result.isConfirmed || !result.value) {
      return;
    }

    try {

      await addMoneyToGoal(
        goalId,
        Number(result.value)
      );

      fetchGoals();

      successAlert(
        "Money added successfully."
      );

    } catch (error) {

      console.error(error);

      errorAlert(
        "Failed to add money."
      );

    }
};

  const handleDelete = async (
    id: number
  ) => {

    const confirmed =
      await confirmDelete(
        "This goal will be permanently removed."
      );

    if (!confirmed) {
      return;
    }

    try {

      await deleteGoal(id);

      fetchGoals();

      successAlert(
        "Goal deleted successfully."
      );

    } catch (error) {

      console.error(error);

      errorAlert(
        "Failed to delete goal."
      );
    }
  };

  const calculateProgress = (
    current: string,
    target: string
  ) => {
    const currentAmount =
      Number(current);

    const targetAmount =
      Number(target);

    if (!targetAmount)
      return 0;

    return Math.round(
      (currentAmount /
        targetAmount) *
        100
    );
  };

  return (
    <MainLayout>
      <h2 className="mb-4">
        Financial Goals
      </h2>

      <div className="row mb-4">

        <div className="col-6 col-md-3">
          <div className="card">
            <div className="card-body text-center">

              <h6>Total Goals</h6>

              <h3>
                {goals.length}
              </h3>

            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card">
            <div className="card-body text-center">

              <h6>Completed Goals</h6>

              <h3 className="text-success">

                {
                  goals.filter(goal =>
                    Number(goal.current_amount) >=
                    Number(goal.target_amount)
                  ).length
                }

              </h3>

            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card">
            <div className="card-body text-center">

              <h6>Active Goals</h6>

              <h3 className="text-primary">

                {
                  goals.filter(goal =>
                    Number(goal.current_amount) <
                    Number(goal.target_amount)
                  ).length
                }

              </h3>

            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card">
            <div className="card-body text-center">

              <h6>Total Target</h6>

              <h3>

                ₹
                {
                  goals.reduce(
                    (sum, goal) =>
                      sum +
                      Number(goal.target_amount),
                    0
                  )
                }

              </h3>

            </div>
          </div>
        </div>

      </div>

      {/* Create Goal */}

      <div className="card mb-4">
        <div className="card-body">

          <h5 className="mb-3">
            {editingId
            ? "Edit Goal"
            : "Create New Goal"}
          </h5>

          <form
            onSubmit={
              handleSubmit
            }
          >
            <div className="row">

              <div className="col-md-4 mb-3">
                <label>
                  Goal Name
                </label>

                <input
                  type="text"
                  className="form-control"
                  name="goal_name"
                  value={
                    formData.goal_name
                  }
                  onChange={
                    handleChange
                  }
                  required
                />
              </div>

              <div className="col-md-4 mb-3">
                <label>
                  Target Amount
                </label>

                <input
                  type="number"
                  className="form-control"
                  name="target_amount"
                  value={
                    formData.target_amount
                  }
                  onChange={
                    handleChange
                  }
                  required
                />
              </div>

              <div className="col-md-4 mb-3">
                <label>
                  Current Amount
                </label>

                <input
                  type="number"
                  className="form-control"
                  name="current_amount"
                  value={
                    formData.current_amount
                  }
                  onChange={
                    handleChange
                  }
                  required
                />
              </div>

            </div>

            <div className="row">

              <div className="col-md-4 mb-3">
                <label>
                  Target Date
                </label>

                <input
                  type="date"
                  className="form-control"
                  name="target_date"
                  value={
                    formData.target_date
                  }
                  onChange={
                    handleChange
                  }
                  required
                />
              </div>

            </div>

            <button
              type="submit"
              className="btn btn-primary"
            >
              {editingId
              ? "Update Goal"
              : "Add Goal"}
            </button>

            {editingId && (
              <button
                type="button"
                className="btn btn-secondary ms-2"
                onClick={() => {

                  setEditingId(null);

                  setFormData({
                    goal_name: "",
                    target_amount: "",
                    current_amount: "",
                    target_date: "",
                  });

                }}
              >
                Cancel
              </button>
            )}

          </form>

        </div>
      </div>

      {/* Goal List */}

          <div className="row mb-3">

            <div className="col-md-4">

              <input
                type="text"
                className="form-control"
                placeholder="Search Goal..."
                value={searchText}
                onChange={(e) =>
                  setSearchText(
                    e.target.value
                  )
                }
              />

            </div>

          </div>

      <div className="card">
        <div className="card-body">
          
          <h5 className="mb-3">
            Goal Progress
          </h5>

          <table className="table table-bordered">

            <thead>
              <tr>
                <th>ID</th>
                <th>Goal Name</th>
                <th>Target Amount</th>
                <th>Current Amount</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Days Left</th>
                <th>Target Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {filteredGoals.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    No goals found
                  </td>
                </tr>
              ) : (
                filteredGoals.map(
                  (goal) => {

                    const progress =
                      calculateProgress(
                        goal.current_amount,
                        goal.target_amount
                      );

                    return (
                      <tr
                        key={goal.id}
                      >
                        <td>
                          {goal.id}
                        </td>

                        <td>
                          {
                            goal.goal_name
                          }
                        </td>

                        <td>
                          ₹
                          {
                            goal.target_amount
                          }
                        </td>

                        <td>
                          ₹
                          {
                            goal.current_amount
                          }
                        </td>

                        <td
                          style={{
                            width:
                              "250px",
                          }}
                        >
                          <div className="progress">

                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{
                                width: `${progress}%`,
                                backgroundColor:
                                  progress >= 100
                                    ? "#198754"
                                    : progress >= 50
                                    ? "#0d6efd"
                                    : "#ffc107",
                              }}
                            >
                              {progress}%
                            </div>

                          </div>
                        </td>
                        <td>
                          {progress >= 100 ? (

                            <span className="badge bg-success">
                              Completed
                            </span>

                          ) : progress >= 50 ? (

                            <span className="badge bg-primary">
                              In Progress
                            </span>

                          ) : (

                            <span className="badge bg-warning text-dark">
                              Started
                            </span>

                          )}

                        </td>

                        <td>
                          {
                            Math.max(
                              0,
                              Math.ceil(
                                (
                                  new Date(goal.target_date).getTime() -
                                  new Date().getTime()
                                ) /
                                (1000 * 60 * 60 * 24)
                              )
                            )
                          }

                          days

                        </td>

                        <td>
                          {
                            goal.target_date
                          }
                        </td>

                        <td>
                          <button
                            className="btn btn-success btn-sm me-2"
                            onClick={() =>
                              handleAddMoney(goal.id)
                            }
                          >
                            Add Money
                          </button>

                          <button
                            className="btn btn-warning btn-sm me-2"
                            onClick={() =>
                              handleEdit(goal)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() =>
                              handleDelete(goal.id)
                            }
                          >
                            Delete
                          </button>
                        </td>

                      </tr>
                    );
                  }
                )
              )}

            </tbody>

          </table>

        </div>
      </div>

    </MainLayout>
  );
};

export default Goals;