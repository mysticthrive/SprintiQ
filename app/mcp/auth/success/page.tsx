"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function MCPAuthSuccess() {
  const searchParams = useSearchParams();
  const [connectionId, setConnectionId] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const connId = searchParams.get("connectionId");
    const userEmail = searchParams.get("email");

    if (connId) setConnectionId(connId);
    if (userEmail) setEmail(userEmail);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            MCP Authorization Successful!
          </h2>

          <p className="mt-2 text-gray-600">
            You are now authorized to use SprintIQ MCP features.
          </p>

          {email && (
            <p className="mt-4 text-sm text-gray-500">
              Authorized email: <strong>{email}</strong>
            </p>
          )}

          {connectionId && (
            <p className="mt-1 text-sm text-gray-500">
              Connection ID:{" "}
              <code className="bg-gray-100 px-1 rounded">{connectionId}</code>
            </p>
          )}

          <div className="mt-6 space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900">
                What's Next?
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                You can now use MCP clients like Claude Desktop to interact with
                your SprintIQ workspace.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-900">
                Available Features
              </h3>
              <ul className="text-sm text-green-700 mt-1 space-y-1">
                <li>• Generate user stories</li>
                <li>• Analyze task priorities</li>
                <li>• Manage team assignments</li>
                <li>• Access workspace data</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              onClick={() => window.close()}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              Close Window
            </button>

            <a
              href="/dashboard"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-center"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
