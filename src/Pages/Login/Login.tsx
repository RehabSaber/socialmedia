import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LoginSchema } from "./../../Schemas/auth.schema";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../../Context/AuthContext";
import { FiUser, FiKey } from "react-icons/fi";

interface userData {
  email: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const [apiError, setapiError] = useState<string | null>(null);
  const [isLoading, setisLoading] = useState(false);
  const { setUserLogin } = useContext(AuthContext);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<userData>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(LoginSchema),
    mode: "onTouched",
  });

  function handleLogin(values: userData) {
    setisLoading(true);
    setapiError(null);

    axios
      .post(`https://route-posts.routemisr.com/users/signin`, values)
      .then((res) => {
        if (res.data.message === "success" || res.data.token || res.data.data?.token) {
          const token = res.data.token || res.data.data?.token;
          if (token) {
            localStorage.setItem("userToken", token);
            setUserLogin(token);
            navigate("/");
          }
        }
      })
      .catch((err) => {
        setapiError(err?.response?.data?.message || "Error During Login");
      })
      .finally(() => {
        setisLoading(false);
      });
  }

  return (
    <div className="w-full min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-sm border border-gray-100">
        
    
        <div className="bg-[#f0f4f8] p-1 rounded-xl flex mb-6">
          <button className="w-1/2 py-2 bg-white rounded-lg font-semibold text-[#002d8f] shadow-xs text-center transition-all">
            Login
          </button>
          <Link
            to="/Register"
            className="w-1/2 py-2 text-center text-gray-500 font-semibold hover:text-gray-700 transition-all flex items-center justify-center"
          >
            Register
          </Link>
        </div>

   
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Log in to Route Posts</h1>
          <p className="text-sm text-gray-400 mt-1">Log in and continue your social journey.</p>
        </div>

     
        {apiError && (
          <div className="bg-red-50 text-red-600 text-sm font-medium p-3 rounded-xl text-center mb-4 border border-red-200">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
          
          <div>
            <div className="relative flex items-center">
              <FiUser className="absolute left-3.5 text-gray-400 text-lg" />
              <input
                {...register("email")}
                type="email"
                id="email"
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#002d8f] focus:bg-white transition-all"
                placeholder="Email or username"
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-500 font-medium pl-1">{errors.email.message}</p>
            )}
          </div>

       
          <div>
            <div className="relative flex items-center">
              <FiKey className="absolute left-3.5 text-gray-400 text-lg" />
              <input
                {...register("password")}
                type="password"
                id="password"
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#002d8f] focus:bg-white transition-all"
                placeholder="Password"
              />
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-500 font-medium pl-1">{errors.password.message}</p>
            )}
          </div>

       
          <button
            disabled={isLoading}
            type="submit"
            className="w-full bg-[#002d8f] hover:bg-[#002270] text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm mt-2"
          >
            {isLoading ? "Logging in..." : "Log In"}
          </button>

    
          <div className="text-center mt-4">
            <a href="#" className="text-sm font-semibold text-[#002d8f] hover:underline">
              Forgot password?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}