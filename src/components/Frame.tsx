"use client";

import { useState, useEffect } from "react";
import MiniApp from "~/components/MiniApp";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import {
  ROUND_STORAGE_KEY,
  USDC_CONTRACT_ADDRESS,
  ESCROW_CONTRACT_ADDRESS,
  FEEDBACK_COST,
} from "~/lib/constants";
import { useAccount, useConnect } from "wagmi";
import { ethers } from "ethers";
import ERC20ABI from "~/lib/abi/ERC20.json";

interface Feedback {
  content: string;
  createdAt: number;
}

interface RoundData {
  id: string;
  prompt: string;
  contentLink: string;
  createdAt: number;
  feedback: Feedback[];
}

function FeedbackPage({ roundId }: { roundId: string }) {
  const [round, setRound] = useState<RoundData | null>(null);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  useEffect(() => {
    const rounds: RoundData[] = JSON.parse(
      localStorage.getItem(ROUND_STORAGE_KEY) || "[]"
    );
    const found = rounds.find((r) => r.id === roundId);
    if (found) {
      setRound(found);
      setFeedbackList(found.feedback || []);
    }
  }, [roundId]);

  const handleSubmit = () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    if (!isConnected) {
      setIsSubmitting(false);
      return;
    }
    const newFeedback: Feedback = {
      content: content.trim(),
      createdAt: Date.now(),
    };
    const rounds: RoundData[] = JSON.parse(
      localStorage.getItem(ROUND_STORAGE_KEY) || "[]"
    );
    const updatedRounds = rounds.map((r) =>
      r.id === roundId
        ? { ...r, feedback: [...(r.feedback || []), newFeedback] }
        : r
    );
    localStorage.setItem(ROUND_STORAGE_KEY, JSON.stringify(updatedRounds));
    setFeedbackList((prev) => [...prev, newFeedback]);
    setContent("");
    setIsSubmitting(false);
  };

  const handlePayment = async () => {
    setIsSubmitting(true);
    if (!(window as any).ethereum) {
      console.error("Ethereum provider not found");
      setIsSubmitting(false);
      return;
    }
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const usdcContract = new ethers.Contract(
      USDC_CONTRACT_ADDRESS,
      ERC20ABI,
      signer
    );
    const tx = await usdcContract.transfer(
      ESCROW_CONTRACT_ADDRESS,
      ethers.parseUnits(FEEDBACK_COST, 6)
    );
    await tx.wait();
    setHasPaid(true);
    setIsSubmitting(false);
  };

  if (!round) {
    return <div className="p-4">Round not found.</div>;
  }

  if (!isConnected) {
    return (
      <div className="w-[400px] mx-auto py-2 px-2 space-y-4">
        <button
          onClick={() => connect({ connector: connectors[0] })}
          className="px-4 py-2 text-white bg-blue-500 rounded-md"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (!hasPaid) {
    return (
      <div className="w-[400px] mx-auto py-2 px-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Payment Required</CardTitle>
            <CardDescription>
              Pay {FEEDBACK_COST} USDC to leave anonymous feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <button
              onClick={handlePayment}
              disabled={isSubmitting}
              className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isSubmitting ? "Processing..." : `Pay ${FEEDBACK_COST} USDC`}
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-[400px] mx-auto py-2 px-2 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Leave Feedback</CardTitle>
          <CardDescription>{round.prompt}</CardDescription>
        </CardHeader>
        <CardContent>
          {round.contentLink && (
            <div className="mb-4">
              <a
                href={round.contentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View Content
              </a>
            </div>
          )}
          <div className="flex flex-col gap-4 mb-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your feedback..."
              disabled={isSubmitting}
              className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Previous Feedback</h3>
            {feedbackList.length === 0 ? (
              <p className="text-gray-500">No feedback yet.</p>
            ) : (
              <ul className="space-y-2">
                {feedbackList.map((fb, idx) => (
                  <li
                    key={idx}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-md"
                  >
                    <p className="text-gray-800">{fb.content}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(fb.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Frame() {
  const [route, setRoute] = useState<"home" | "feedback">("home");
  const [roundId, setRoundId] = useState<string>("");

  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/feedback\/(.+)/);
    if (match) {
      setRoute("feedback");
      setRoundId(match[1]);
    }
  }, []);

  if (route === "feedback") {
    return <FeedbackPage roundId={roundId} />;
  }

  return <MiniApp />;
}
