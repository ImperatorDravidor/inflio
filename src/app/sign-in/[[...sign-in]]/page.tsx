"use client";

import { SignIn } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";

export default function Page() {
  const { isLoaded, isSignedIn, userId } = useAuth();

  // If already signed in, show a message
  if (isLoaded && isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">You are already signed in</h1>
          <p className="mb-4">User ID: {userId}</p>
          <a href="/dashboard" className="text-blue-500 hover:underline">
            Go to Dashboard →
          </a>
          <br />
          <a href="/sign-out-test" className="text-red-500 hover:underline mt-2 inline-block">
            Sign Out →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {/* Sign in component */}
      <div className="w-full max-w-md">
        {!isLoaded ? (
          <div className="text-center">
            <p>Loading Clerk...</p>
          </div>
        ) : (
          <SignIn 
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-none",
              },
            }}
          />
        )}
      </div>
    </div>
  );
}