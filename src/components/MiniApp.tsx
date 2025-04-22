"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import { useFrameSDK } from "~/hooks/useFrameSDK";
import { ROUND_STORAGE_KEY } from "~/lib/constants";

function CreateRoundForm() {
  const [prompt, setPrompt] = useState("");
  const [contentLink, setContentLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roundId, setRoundId] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    setIsSubmitting(true);
    
    // Generate a unique roundId
    const newRoundId = `round_${Date.now()}`;
    
    // Store round data in localStorage
    const roundData = {
      id: newRoundId,
      prompt: prompt.trim(),
      contentLink: contentLink.trim(),
      createdAt: Date.now(),
      feedback: []
    };
    
    const existingRounds = JSON.parse(localStorage.getItem(ROUND_STORAGE_KEY) || "[]");
    localStorage.setItem(ROUND_STORAGE_KEY, JSON.stringify([...existingRounds, roundData]));
    
    setRoundId(newRoundId);
    setIsSubmitting(false);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Feedback Request</CardTitle>
        <CardDescription>
          Create a new round to receive anonymous feedback
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What would you like feedback about?"
              rows={4}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content Link (optional)
            </label>
            <input
              type="url"
              value={contentLink}
              onChange={(e) => setContentLink(e.target.value)}
              className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
              disabled={isSubmitting}
            />
          </div>
          {!roundId ? (
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isSubmitting}
              className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isSubmitting ? "Creating..." : "Create Feedback Round"}
            </button>
          ) : (
            <div className="flex flex-col gap-2 items-center p-4 bg-green-50 rounded-md">
              <p className="text-green-600 font-medium">Round Created!</p>
              <div className="w-full p-3 bg-white rounded-lg border border-gray-200 mt-2">
                <p className="font-medium mb-2">📝 Looking for anonymous feedback:</p>
                <p className="text-gray-600 mb-2">{prompt}</p>
                <p className="text-sm text-gray-500">
                  Leave feedback at:
                  {` ${window.location.origin}/feedback/${roundId}`}
                </p>
              </div>
              <button
                onClick={() => {
                  // Format text for Farcaster cast
                  const castText = `📝 Looking for anonymous feedback:\n\n${prompt}\n\nLeave feedback at:\n${window.location.origin}/feedback/${roundId}`;
                  const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds%5B%5D=${encodeURIComponent(window.location.origin)}`;
                  window.open(shareUrl, "_blank");
                }}
                className="mt-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
              >
                Share as Cast
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MiniApp() {
  const { isSDKLoaded } = useFrameSDK();

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-[400px] mx-auto py-2 px-2 space-y-4">
      <CreateRoundForm />
    </div>
  );
}
