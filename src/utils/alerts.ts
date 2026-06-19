import Swal from "sweetalert2";

export const confirmDelete = async (
  text: string
) => {
  const result = await Swal.fire({
    title: "Delete Item?",
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });

  return result.isConfirmed;
};

export const successAlert = (
  message: string
) => {
  Swal.fire({
    icon: "success",
    title: "Success",
    text: message,
    timer: 2000,
    showConfirmButton: false,
  });
};

export const errorAlert = (
  message: string
) => {
  Swal.fire({
    icon: "error",
    title: "Oops...",
    text: message,
  });
};