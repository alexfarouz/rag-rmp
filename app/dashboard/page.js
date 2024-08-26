import Dashboard from '../components/Dashboard';
import { SignedIn, SignedOut, SignIn } from '@clerk/nextjs';

export default function Home() {

  return (
    <>
      <SignedIn>
        <div className="absolute top-0 z-[-2] h-screen w-screen bg-white 
        bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(223,223,223,0.3))]"></div>
        <Dashboard />
      </SignedIn>
      <SignedOut> <SignIn /> </SignedOut>
    </>

  );
}
