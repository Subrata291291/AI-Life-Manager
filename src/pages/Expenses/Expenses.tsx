import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import {
  createExpense,
  getExpenses,
  deleteExpense,
  updateExpense,
} from "../../services/expenseService";
import {
  confirmDelete,
  successAlert,
  errorAlert,
} from "../../utils/alerts";
import SubscriptionGate from "../../components/SubscriptionGate";
import { useSubscriptionContext } from "../../contexts/SubscriptionContext";

interface Expense {
  id: number;
  amount: string;
  category: string;
  note: string;
  expense_date: string;
}

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [editingId, setEditingId] =
    useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [filterCategory, setFilterCategory] =
    useState("All");

  const [searchText, setSearchText] =
    useState("");
  
  const [fromDate, setFromDate] =
  useState("");

  const [toDate, setToDate] =
    useState("");

  const [formData, setFormData] = useState({
    amount: "",
    category: "Food",
    note: "",
    expense_date: new Date()
      .toISOString()
      .split("T")[0],
  });

  const fetchExpenses = async () => {
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchExpenses();
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
    setSubmitting(true);

    try {
      if (editingId) {
        await updateExpense({
          id: editingId,
          ...formData,
        });

        setEditingId(null);
      } else {
        await createExpense(formData);
      }

      setFormData({
        amount: "",
        category: "Food",
        note: "",
        expense_date: new Date()
          .toISOString()
          .split("T")[0],
      });

      fetchExpenses();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (
    expense: Expense
  ) => {
    setEditingId(expense.id);

    setFormData({
      amount: expense.amount,
      category: expense.category,
      note: expense.note,
      expense_date: expense.expense_date,
    });
  };

  const handleDelete = async (
    id: number
  ) => {

    const confirmed =
      await confirmDelete(
        "This expense will be permanently removed."
      );

    if (!confirmed) {
      return;
    }

    try {

      await deleteExpense(id);

      fetchExpenses();

      successAlert(
        "Expense deleted successfully."
      );

    } catch (error) {

      console.error(error);

      errorAlert(
        "Failed to delete expense."
      );
    }
  };

  const filteredExpenses =
  expenses.filter((expense) => {

    const categoryMatch =
      filterCategory === "All"
        ? true
        : expense.category ===
          filterCategory;

    const searchMatch =
      expense.note
        .toLowerCase()
        .includes(
          searchText.toLowerCase()
        );

    const expenseDate =
      new Date(
        expense.expense_date
      );

    const fromMatch =
      !fromDate ||
      expenseDate >=
        new Date(fromDate);

    const toMatch =
      !toDate ||
      expenseDate <=
        new Date(toDate);

    return (
      categoryMatch &&
      searchMatch &&
      fromMatch &&
      toMatch
    );
  });

  const totalExpenses =
    expenses.reduce(
      (sum, item) =>
        sum +
        Number(item.amount),
      0
    );

  const today =
  new Date()
    .toISOString()
    .split("T")[0];

const todayExpense =
  expenses
    .filter(
      (item) =>
        item.expense_date ===
        today
    )
    .reduce(
      (sum, item) =>
        sum +
        Number(item.amount),
      0
    );

const currentMonth =
  new Date().getMonth();

const currentYear =
  new Date().getFullYear();

const monthlyExpense =
  expenses
    .filter((item) => {

      const date =
        new Date(
          item.expense_date
        );

      return (
        date.getMonth() ===
          currentMonth &&
        date.getFullYear() ===
          currentYear
      );
    })
    .reduce(
      (sum, item) =>
        sum +
        Number(item.amount),
      0
    );

  const { hasFeature, setShowSubscriptionModal } = useSubscriptionContext();

  return (
    <MainLayout>
      <SubscriptionGate
        feature="expenses"
        hasAccess={hasFeature("expenses")}
        onUpgrade={() => setShowSubscriptionModal(true)}
      >
      <h2 className="mb-4">
        Expenses
      </h2>

      {/* Summary Cards */}

      <div className="row mb-4">

        <div className="col-6 col-md-3">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h6>Total Expenses</h6>
              <h3>₹{totalExpenses}</h3>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h6>Today's Expense</h6>
              <h3>₹{todayExpense}</h3>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h6>This Month</h6>
              <h3>₹{monthlyExpense}</h3>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h6>Total Entries</h6>
              <h3>{expenses.length}</h3>
            </div>
          </div>
        </div>

      </div>

      {/* Expense Form */}

      <div className="card">
        <div className="card-body">
          <h5 className="mb-3">
            {editingId
              ? "Edit Expense"
              : "Add Expense"}
          </h5>

          <form
            onSubmit={handleSubmit}
          >
            <div className="mb-3">
              <label>
                Amount
              </label>

              <input
                type="number"
                className="form-control"
                name="amount"
                value={
                  formData.amount
                }
                onChange={
                  handleChange
                }
                required
              />
            </div>
            <div className="mb-3">
              <label>
                Expense Date
              </label>

              <input
                type="date"
                className="form-control"
                name="expense_date"
                value={formData.expense_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label>
                Category
              </label>

              <select
                className="form-select"
                name="category"
                value={
                  formData.category
                }
                onChange={
                  handleChange
                }
              >
                <option value="Food">
                  Food
                </option>

                <option value="Travel">
                  Travel
                </option>

                <option value="Shopping">
                  Shopping
                </option>

                <option value="Bills">
                  Bills
                </option>

                <option value="Health">
                  Health
                </option>

                <option value="Education">
                  Education
                </option>
              </select>
            </div>

            <div className="mb-3">
              <label>
                Note
              </label>

              <textarea
                className="form-control"
                rows={3}
                name="note"
                value={
                  formData.note
                }
                onChange={
                  handleChange
                }
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : editingId
                ? "Update Expense"
                : "Add Expense"}
            </button>

            {editingId && (
              <button
                type="button"
                className="btn btn-secondary ms-2"
                onClick={() => {
                  setEditingId(
                    null
                  );

                  setFormData({
                    amount: "",
                    category: "Food",
                    note: "",
                    expense_date: new Date()
                      .toISOString()
                      .split("T")[0],
                  });
                }}
              >
                Cancel
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Filters */}

      <div className="card mt-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <select
                className="form-select"
                value={
                  filterCategory
                }
                onChange={(e) =>
                  setFilterCategory(
                    e.target.value
                  )
                }
              >
                <option value="All">
                  All Categories
                </option>

                <option value="Food">
                  Food
                </option>

                <option value="Travel">
                  Travel
                </option>

                <option value="Shopping">
                  Shopping
                </option>

                <option value="Bills">
                  Bills
                </option>

                <option value="Health">
                  Health
                </option>

                <option value="Education">
                  Education
                </option>
              </select>
            </div>

            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search Notes..."
                value={
                  searchText
                }
                onChange={(e) =>
                  setSearchText(
                    e.target.value
                  )
                }
              />
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                value={fromDate}
                onChange={(e) =>
                  setFromDate(
                    e.target.value
                  )
                }
              />
            </div>

            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                value={toDate}
                onChange={(e) =>
                  setToDate(
                    e.target.value
                  )
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Expense List */}

      <div className="card mt-4">
        <div className="card-body">
          <h5 className="mb-3">
            Expense List
          </h5>

          <table className="table table-bordered">
            <thead>
              <tr>
                <th>ID</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Note</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredExpenses.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center"
                  >
                    No expenses found
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(
                  (expense) => (
                    <tr
                      key={
                        expense.id
                      }
                    >
                      <td>
                        {
                          expense.id
                        }
                      </td>

                      <td>
                        ₹
                        {
                          expense.amount
                        }
                      </td>

                      <td>
                        {
                          expense.category
                        }
                      </td>

                      <td>
                        {
                          expense.note
                        }
                      </td>

                      <td>{expense.expense_date}</td>

                      <td>
                        <button
                          className="btn btn-warning btn-sm me-2"
                          onClick={() =>
                            handleEdit(
                              expense
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            handleDelete(
                              expense.id
                            )
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
      </SubscriptionGate>
    </MainLayout>
  );
};

export default Expenses;