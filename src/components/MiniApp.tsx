"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import { DaimoPayButton } from "@daimo/pay";
import { useFrameSDK } from "~/hooks/useFrameSDK";
import { baseUSDC } from "@daimo/contract";
import { getAddress } from "viem";
import { FEEDBACK_COST, PROTOCOL_GUILD_ADDRESS } from "~/lib/constants";

function FeedbackForm({ onSubmit }: { onSubmit: (feedback: string) => void }) {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!feedback.trim()) return;
    setIsSubmitting(true);
    onSubmit(feedback);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Anonymous Feedback</CardTitle>
        <CardDescription>
          Pay {FEEDBACK_COST} USDC to submit feedback. If your feedback is selected, you&apos;ll receive all collected USDC!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your feedback here..."
            rows={4}
            disabled={isSubmitting}
          />
          <button
            onClick={handleSubmit}
            disabled={!feedback.trim() || isSubmitting}
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentComponent({ feedback }: { feedback: string }) {
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle');

  const handlePaymentStarted = (e: any) => {
    console.log('Payment started:', e);
    setPaymentStatus('pending');
    // Here we would store the feedback + transaction hash in local storage
    localStorage.setItem('pendingFeedback', JSON.stringify({
      feedback,
      txHash: e.txHash,
      timestamp: Date.now()
    }));
  };

  const handlePaymentCompleted = (e: any) => {
    console.log('Payment completed:', e);
    setPaymentStatus('completed');
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Payment</CardTitle>
        <CardDescription>Pay {FEEDBACK_COST} USDC on Base to submit your feedback</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex justify-center">
          <DaimoPayButton
            appId="pay-demo"
            toChain={baseUSDC.chainId}
            toUnits={FEEDBACK_COST}
            toToken={getAddress(baseUSDC.token)}
            toAddress={PROTOCOL_GUILD_ADDRESS}
            onPaymentStarted={handlePaymentStarted}
            onPaymentCompleted={handlePaymentCompleted}
            disabled={paymentStatus !== 'idle'}
          />
        </div>
        {paymentStatus === 'pending' && (
          <p className="text-center text-yellow-600">Payment in progress...</p>
        )}
        {paymentStatus === 'completed' && (
          <p className="text-center text-green-600">Payment completed! Your feedback has been submitted.</p>
        )}
        {paymentStatus === 'failed' && (
          <p className="text-center text-red-600">Payment failed. Please try again.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function MiniApp() {
  const { isSDKLoaded } = useFrameSDK();
  const [currentFeedback, setCurrentFeedback] = useState("");
  const [showPayment, setShowPayment] = useState(false);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  const handleFeedbackSubmit = (feedback: string) => {
    setCurrentFeedback(feedback);
    setShowPayment(true);
  };

  return (
    <div className="w-[400px] mx-auto py-2 px-2 space-y-4">
      <FeedbackForm onSubmit={handleFeedbackSubmit} />
      {showPayment && <PaymentComponent feedback={currentFeedback} />}
    </div>
  );
}
