import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

export default function InvoicePage() {
  const { paymentId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoice();
  }, []);

  const loadInvoice = async () => {
    try {
      const res = await axios.get(
        `/api/transactions/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      setInvoice(res.data);
    } catch (err) {
      toast.error("Failed to load invoice.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    window.open(`${baseURL}/invoices/invoice-${paymentId}.pdf`, "_blank");
  };

  if (loading) return <div className="text-center p-10">Loading invoice...</div>;

  if (!invoice)
    return (
      <div className="text-center p-10 text-red-500">
        Invoice not found.
      </div>
    );

  return (
    <div className="max-w-xl mx-auto bg-white shadow-md p-8 rounded-lg mt-10">
      <h1 className="text-3xl font-bold text-center mb-6">Invoice</h1>

      <div className="space-y-4">
        <div className="flex justify-between border-b pb-2">
          <span className="font-semibold">Payment ID:</span>
          <span>{invoice.paymentId}</span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <span className="font-semibold">Appointment ID:</span>
          <span>{invoice.appointmentId}</span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <span className="font-semibold">User ID:</span>
          <span>{invoice.userId}</span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <span className="font-semibold">Amount Paid:</span>
          <span className="font-bold text-green-600">৳{invoice.amount}</span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <span className="font-semibold">Date:</span>
          <span>{new Date(invoice.timestamp).toLocaleString()}</span>
        </div>
      </div>

      {/* Download button */}
      <div className="mt-8 text-center">
        <button
          className="btn btn-primary"
          onClick={downloadPDF}
        >
          Download Invoice PDF
        </button>
      </div>
    </div>
  );
}
