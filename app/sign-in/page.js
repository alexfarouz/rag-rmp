'use client';

import { SignIn, SignedIn, SignedOut, useClerk, UserButton } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '../../firebase'; // Import Firestore instance
import { doc, setDoc } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";

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
      router.push("/dashboard"); // Redirect to the dashboard after sign-in
    }
  }, [user, redirecting, router]);

  const handleRedirect = () => {
    setRedirecting(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md mx-auto"
      >

          <CardContent className="p-6">
            <SignedOut>
        

              <SignIn routing="hash" />
            </SignedOut>
            <SignedIn>

                Hi {user?.fullName}, you are signed in!

              <div className="flex justify-between items-center">
                <UserButton afterSignOutUrl="/" />
                <Button onClick={handleRedirect} variant="solid" className="bg-blue-500 text-white hover:bg-blue-700">
                  Go to Dashboard
                </Button>
              </div>
            </SignedIn>
          </CardContent>
   
      </motion.div>
    </div>
  );
}
