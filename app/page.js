'use client';

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FaBookOpen, FaStar, FaFilter, FaUniversity } from "react-icons/fa";

export default function Landing() {
  const router = useRouter();

  const handleSignIn = () => {
    router.push('/sign-in'); // Redirect to the sign-in page
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SignedIn>
        <div className="absolute top-4 right-4">
          <UserButton />
        </div>
      </SignedIn>
      
      <main className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 flex flex-col items-center justify-center text-white">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold mb-4">Welcome to Rate My Prof</h1>
          <p className="text-lg mb-8">
            Discover and review professors at your university. Get insights from
            fellow students, sort by ratings, and make informed decisions!
          </p>
          <div className="space-x-4">
            <SignedIn>
              <Button
                onClick={() => router.push('/dashboard')} // Redirect to dashboard
                variant="solid"
                className="bg-purple-500 hover:bg-purple-700 text-white px-6 py-3 rounded-full text-lg"
              >
                Go to Dashboard
              </Button>
            </SignedIn>
            <SignedOut>
              <Button
                onClick={handleSignIn}
                variant="solid"
                className="bg-purple-500 hover:bg-purple-700 text-white px-6 py-3 rounded-full text-lg"
              >
                Sign In
              </Button>
            </SignedOut>
          </div>
        </motion.div>
      </main>

      <section id="features" className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white">
  <h2 className="text-4xl font-bold mb-8">Features</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl">
    <div className="p-6 bg-white/20 backdrop-blur-sm rounded-lg shadow-md text-center">
      <FaBookOpen className="text-4xl text-purple-200 mb-4" />
      <h3 className="text-xl font-bold">Discover Professors</h3>
      <p className="mt-2">Explore detailed profiles of professors from various universities.</p>
    </div>
    <div className="p-6 bg-white/20 backdrop-blur-sm rounded-lg shadow-md text-center">
      <FaStar className="text-4xl text-yellow-200 mb-4" />
      <h3 className="text-xl font-bold">Read and Write Reviews</h3>
      <p className="mt-2">Share your experiences and read reviews from other students.</p>
    </div>
    <div className="p-6 bg-white/20 backdrop-blur-sm rounded-lg shadow-md text-center">
      <FaFilter className="text-4xl text-green-200 mb-4" />
      <h3 className="text-xl font-bold">Sort by Ratings</h3>
      <p className="mt-2">Find the best professors by sorting based on student ratings.</p>
    </div>
    <div className="p-6 bg-white/20 backdrop-blur-sm rounded-lg shadow-md text-center">
      <FaUniversity className="text-4xl text-blue-200 mb-4" />
      <h3 className="text-xl font-bold">Filter by Department</h3>
      <p className="mt-2">Narrow down your search by filtering professors by their department.</p>
    </div>
  </div>
</section>




      <footer className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>© 2024 Rate My Prof. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
