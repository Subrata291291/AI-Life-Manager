import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import {
  createBill,
  getBills,
  deleteBill,
  updateBill,
  markBillPaid,
} from "../../services/billService";
import {
  confirmDelete,
  successAlert,
  errorAlert,
} from "../../utils/alerts";

interface Bill {
  id: number;
  bill_name: string;
  amount: string;
  due_date: string;
  recurring: string;
  status: string;
  display_status: string;
}

const Bills = () => {

  const [bills, setBills] =
    useState<Bill[]>([]);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [formData, setFormData] =
    useState({
      bill_name: "",
      amount: "",
      due_date: "",
      recurring: "monthly",
      reminder_days: 3,
    });

    const [searchText, setSearchText] =
      useState("");

    const [statusFilter, setStatusFilter] =
      useState("all");

    const filteredBills =
      bills.filter((bill) => {

        const searchMatch =
          bill.bill_name
            .toLowerCase()
            .includes(
              searchText.toLowerCase()
            );

        const statusMatch =
          statusFilter === "all"
            ? true
            : bill.display_status === statusFilter;

        return (
          searchMatch &&
          statusMatch
        );
    });

    const fetchBills = async () => {
      try {

        const data =
          await getBills();

        setBills(data);

      } catch (error) {

        console.error(error);

      }
    };

    useEffect(() => {
      fetchBills();
    }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement
    >
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

        await updateBill({
          id: editingId,
          ...formData,
        });

        setEditingId(null);

      } else {

        await createBill(
          formData
        );

      }

      setFormData({
        bill_name: "",
        amount: "",
        due_date: "",
        recurring: "monthly",
        reminder_days: 3,
      });

      fetchBills();

    } catch (error) {

      console.error(error);

    }
  };

  const handleEdit = (
    bill: Bill
  ) => {

    setEditingId(bill.id);

    setFormData({
      bill_name: bill.bill_name,
      amount: bill.amount,
      due_date: bill.due_date,
      recurring: bill.recurring,
      reminder_days: 3,
    });
  };

  const handlePaid = async (
    id: number
  ) => {

    try {

      await markBillPaid(id);

      fetchBills();

    } catch (error) {

      console.error(error);

    }
  };

  const handleDelete = async (
    id: number
  ) => {

    const confirmed =
      await confirmDelete(
        "This bill will be permanently removed."
      );

    if (!confirmed) {
      return;
    }

    try {

      await deleteBill(id);

      fetchBills();

      successAlert(
        "Bill deleted successfully."
      );

    } catch (error) {

      console.error(error);

      errorAlert(
        "Failed to delete bill."
      );
    }
  };

  return (
    <MainLayout>

      <h2 className="mb-4">
        Bills
      </h2>

      <div className="row mb-4">

        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">

              <h6>Total Bills</h6>

              <h3>
                {bills.length}
              </h3>

            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">

              <h6>Pending Amount</h6>

              <h3 className="text-warning">

                ₹
                {
                  bills
                    .filter(
                      bill =>
                        bill.display_status !== "paid"
                    )
                    .reduce(
                      (sum, bill) =>
                        sum + Number(bill.amount),
                      0
                    )
                }

              </h3>

            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">

              <h6>Overdue Bills</h6>

              <h3 className="text-danger">
                {
                  bills.filter(
                    bill =>
                      bill.display_status === "overdue"
                  ).length
                }
              </h3>

            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">

              <h6>Total Amount</h6>

              <h3>
                ₹
                {
                  bills.reduce(
                    (sum, bill) =>
                      sum +
                      Number(bill.amount),
                    0
                  )
                }
              </h3>

            </div>
          </div>
        </div>

      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="mb-3">
            {editingId
              ? "Edit Bill"
              : "Add New Bill"}
          </h5>

          <form
            onSubmit={
              handleSubmit
            }
          >

            <div className="row">

              <div className="col-md-4 mb-3">

                <label>
                  Bill Name
                </label>

                <input
                  type="text"
                  className="form-control"
                  name="bill_name"
                  value={
                    formData.bill_name
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>

              <div className="col-md-4 mb-3">

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

              <div className="col-md-4 mb-3">

                <label>
                  Due Date
                </label>

                <input
                  type="date"
                  className="form-control"
                  name="due_date"
                  value={
                    formData.due_date
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
                  Recurring
                </label>

                <select
                  className="form-select"
                  name="recurring"
                  value={
                    formData.recurring
                  }
                  onChange={
                    handleChange
                  }
                >
                  <option value="monthly">
                    Monthly
                  </option>

                  <option value="quarterly">
                    Quarterly
                  </option>

                  <option value="yearly">
                    Yearly
                  </option>

                  <option value="none">
                    One Time
                  </option>

                </select>

              </div>

            </div>

            <button
              type="submit"
              className="btn btn-primary"
            >
              {editingId
                ? "Update Bill"
                : "Save Bill"}
            </button>

          </form>

        </div>
      </div>

      <div className="row mb-3">

        <div className="col-md-4">

          <input
            type="text"
            className="form-control"
            placeholder="Search Bill..."
            value={searchText}
            onChange={(e) =>
              setSearchText(
                e.target.value
              )
            }
          />

        </div>

        <div className="col-md-3">

          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
          >
            <option value="all">
              All Status
            </option>

            <option value="paid">
              Paid
            </option>

            <option value="upcoming">
              Upcoming
            </option>

            <option value="today">
              Due Today
            </option>

            <option value="overdue">
              Overdue
            </option>

          </select>

        </div>

      </div>

      <div className="card">
        <div className="card-body">

          <h5>
            Upcoming Bills
          </h5>

          <table className="table table-bordered">

            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Recurring</th>
                <th>Status</th>
                <th>Due In</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {bills.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    No bills found
                  </td>
                </tr>
              ) : (
                filteredBills.map(
                  (bill) => (
                    <tr
                      key={bill.id}
                    >
                      <td>
                        {bill.id}
                      </td>

                      <td>
                        {bill.bill_name}
                      </td>

                      <td>
                        ₹{bill.amount}
                      </td>

                      <td>
                        {bill.due_date}
                      </td>

                      <td>
                        {bill.recurring}
                      </td>

                      <td>
                        {bill.display_status === "paid" && (
                          <span className="badge bg-success">
                            Paid
                          </span>
                        )}

                        {bill.display_status === "overdue" && (
                          <span className="badge bg-danger">
                            Overdue
                          </span>
                        )}

                        {bill.display_status === "today" && (
                          <span className="badge bg-warning text-dark">
                            Due Today
                          </span>
                        )}

                        {bill.display_status === "upcoming" && (
                          <span className="badge bg-primary">
                            Upcoming
                          </span>
                        )}

                      </td>

                      <td>
                        {
                          bill.display_status === "paid"
                            ? "-"
                            : `${Math.max(
                                0,
                                Math.ceil(
                                  (
                                    new Date(bill.due_date).getTime() -
                                    new Date().getTime()
                                  ) /
                                  (1000 * 60 * 60 * 24)
                                )
                              )} days`
                        }

                      </td>

                      <td>

                        <button
                          className="btn btn-warning btn-sm me-2"
                          onClick={() =>
                            handleEdit(
                              bill
                            )
                          }
                        >
                          Edit
                        </button>

                        {bill.display_status !== "paid" && (
                          <button
                            className="btn btn-success btn-sm me-2"
                            onClick={() => handlePaid(bill.id)}
                          >
                            Mark Paid
                          </button>
                        )}

                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            handleDelete(
                              bill.id
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

    </MainLayout>
  );
};

export default Bills;