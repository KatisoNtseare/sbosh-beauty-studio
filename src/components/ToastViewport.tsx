"use client";

import { ToastContainer } from "react-toastify";

export default function ToastViewport() {
  return <ToastContainer position="top-center" autoClose={4500} newestOnTop closeOnClick pauseOnFocusLoss pauseOnHover theme="light" limit={4} />;
}
