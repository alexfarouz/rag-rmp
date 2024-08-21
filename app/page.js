'use client';

import { SignIn, SignedIn, SignedOut, useClerk } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '../firebase'; // Import Firestore instance
import { doc, setDoc } from 'firebase/firestore';

export default function Home() {
  const router = useRouter();
  const { user } = useClerk();
  const [redirecting, setRedirecting] = useState(false);

  // Function to store user data in Firestore
  const storeUserInDatabase = async (user) => {
    try {
      await setDoc(doc(db, 'users', user.id), {
        name: user.fullName,
        email: user.emailAddresses[0].emailAddress,
        createdAt: new Date(),
      });
      console.log('User stored in Firestore');
    } catch (error) {
      console.error('Error storing user in Firestore:', error);
    }
  };

  // Check if the user is logged in and wants to go to the dashboard
  useEffect(() => {
    if (user && redirecting) {
      // Store user data in Firestore
      storeUserInDatabase(user);
      router.push("/dashboard");
    }
  }, [user, redirecting, router]);

  const handleRedirect = () => {
    setRedirecting(true);
  };

  return (
    <>
      <div className="absolute top-0 z-[-2] h-screen w-screen bg-white 
      bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      <div className="flex items-center justify-center min-h-screen">
        <SignedOut><SignIn routing="hash" /></SignedOut>
        <SignedIn>
          <button
            onClick={handleRedirect}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Go to Dashboard
          </button>
        </SignedIn>
      </div>
    </>
  );
}
