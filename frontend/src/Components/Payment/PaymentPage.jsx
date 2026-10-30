import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";

export default function PaymentPage() {
  const { appointmentId, amount } = useParams();
  const navigate = useNavigate();
  const [cardNumber, setCardNumber] = useState("");

  const handlePayment = async () => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const type = searchParams.get("type") || "normal";

      const res = await axios.post(
        `/api/payment/charge?type=${type}`,
        {
          appointmentId,
          amount,
          paymentInfo: { cardNumber }
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );

      toast.success("Payment Successful!");

      console.log("Payment ID:", res.data.paymentId);

      // Navigate to Invoice Page
      navigate(`/invoice/${res.data.paymentId}`);
      // window.open(`/invoice/${res.data.paymentId}`, "_blank");

    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }
      toast.error(
        err.response?.data?.error ||
        "Transaction failed. Please check your card or network."
      );
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-10">
      <h1 className="text-2xl font-bold">Payment</h1>

      <p className="text-lg">
        Amount Payable: <strong>৳{amount}</strong>
      </p>

      <input
        type="text"
        placeholder="Enter card number"
        className="input input-bordered w-full max-w-xs"
        value={cardNumber}
        onChange={(e) => setCardNumber(e.target.value)}
      />

      <button
        className="btn btn-primary w-full max-w-xs"
        onClick={handlePayment}
      >
        Pay Now
      </button>
    </div>
  );
}
