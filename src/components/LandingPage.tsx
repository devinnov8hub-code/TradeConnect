import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo.png";

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("Redirecting to login page...");
      navigate("/login");
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-global-bg ">
      {/* Background Glow */}
      <div className="absolute h-96 w-96 rounded-full bg-primary/20 blur-[120px] animate-pulse" />
      <div className="absolute h-72 w-72 rounded-full bg-global-bg/10 blur-[100px] animate-ping" />
      {/* Content */}
      <div className="z-10 flex flex-col items-center">
        {/* Glowing Circle */}
        <div className="flex h-40 w-40 items-center justify-center rounded-full bg-primary/5 backdrop-blur-md shadow-[0_0_80px_rgba((149, 50, 28,0.1)] animate-pulse">
          <img src={logo} alt="Logo" className="" />
        </div>
        <h1 className="text-3xl font-bold text-primary mt-12">
          Welcome to Trade Connect
        </h1>
      </div>
    </div>
  );
};

export default LandingPage;
