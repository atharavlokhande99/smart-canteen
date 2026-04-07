import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";

const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("checking"); // checking, success, failed
  const [paymentDetails, setPaymentDetails] = useState(null);
  const navigate = useNavigate();
  const hasPolled = useRef(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus("failed");
      return;
    }

    if (hasPolled.current) return;
    hasPolled.current = true;

    pollPaymentStatus(sessionId);
  }, [searchParams]);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus("failed");
      return;
    }

    try {
      const response = await axios.get(`${API}/orders/payment-status/${sessionId}`, {
        withCredentials: true
      });
      
      setPaymentDetails(response.data);

      if (response.data.payment_status === "paid") {
        setStatus("success");
        return;
      } else if (response.data.status === "expired") {
        setStatus("failed");
        return;
      }

      // Continue polling
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error("Error checking payment status:", error);
      if (attempts < maxAttempts - 1) {
        setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
      } else {
        setStatus("failed");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center animate-slide-up">
        {status === "checking" && (
          <>
            <div className="w-24 h-24 rounded-full bg-[#81B29A]/20 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-12 h-12 text-[#81B29A] animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-[#264653] mb-2">Processing Payment</h1>
            <p className="text-[#5C7582]">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-24 h-24 rounded-full bg-[#2A9D8F]/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-[#2A9D8F]" />
            </div>
            <h1 className="text-2xl font-bold text-[#264653] mb-2">Order Confirmed!</h1>
            <p className="text-[#5C7582] mb-6">
              Your order has been placed successfully. You'll receive updates on your order status.
            </p>
            {paymentDetails && (
              <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 mb-6 text-left">
                <h3 className="font-semibold text-[#264653] mb-3">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#5C7582]">Status</span>
                    <span className="text-[#2A9D8F] font-medium">Paid</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5C7582]">Amount</span>
                    <span className="text-[#264653] font-medium">
                      ${(paymentDetails.amount_total / 100).toFixed(2)} {paymentDetails.currency?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                data-testid="view-orders-btn"
                onClick={() => navigate('/my-orders')}
                className="flex-1 bg-[#D95D39] hover:bg-[#C84C2A] text-white rounded-xl"
              >
                View My Orders
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                data-testid="continue-ordering-btn"
                onClick={() => navigate('/menu')}
                variant="outline"
                className="flex-1 border-[#E5E0D8] rounded-xl"
              >
                Continue Ordering
              </Button>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-24 h-24 rounded-full bg-[#E63946]/20 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-[#E63946]" />
            </div>
            <h1 className="text-2xl font-bold text-[#264653] mb-2">Payment Failed</h1>
            <p className="text-[#5C7582] mb-6">
              We couldn't process your payment. Please try again or contact support.
            </p>
            <Button
              data-testid="try-again-btn"
              onClick={() => navigate('/menu')}
              className="bg-[#D95D39] hover:bg-[#C84C2A] text-white rounded-xl"
            >
              Back to Menu
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderSuccessPage;
