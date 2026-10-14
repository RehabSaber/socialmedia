import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { RegisterSchema } from "./../../Schemas/auth.schema";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FiUser, FiMail, FiCalendar, FiKey, FiUsers } from "react-icons/fi";

interface userData {
  name: string;
  email: string;
  dateOfBirth: string;
  gender: "male" | "female";
  password: string;
  rePassword: string;
}

export default function Register() {
  const navigate = useNavigate();
  const [apiError, setapiError] = useState<string | null>(null);
  const [isLoading, setisLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<userData>({
    defaultValues: {
      name: "",
      email: "",
      dateOfBirth: "",
      gender: "male",
      password: "",
      rePassword: "",
    },
    resolver: zodResolver(RegisterSchema),
    mode: "onTouched",
  });

  function handleRegister(values: userData) {
    setisLoading(true);
    setapiError(null);

    axios
      .post(`https://route-posts.routemisr.com/users/signup`, values)
      .then((res) => {
        if (res.data.success || res.data.message === "success") {
          navigate("/Login");
        }
      })
      .catch((err) => {
        setapiError(err?.response?.data?.message || "Error during Create account");
      })
      .finally(() => {
        setisLoading(false);
      });
  }

  return (
   <div className="w-full min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-sm border border-gray-100 my-6">
       
        <div className="bg-[#f0f4f8] p-1 rounded-xl flex mb-6">
          <Link
            to="/login"
            className="w-1/2 py-2 text-center text-gray-500 font-semibold hover:text-gray-700 transition-all flex items-center justify-center"
          >
            Login
          </Link>
          <button className="w-1/2 py-2 bg-white rounded-lg font-semibold text-[#002d8f] shadow-xs text-center transition-all">
            Register
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create a new account</h1>
          <p className="text-sm text-gray-400 mt-1">It is quick and easy.</p>
        </div>

        {apiError && (
          <div className="bg-red-50 text-red-600 text-sm font-medium p-3 rounded-xl text-center mb-4 border border-red-200">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(handleRegister)} className="space-y-4">
          
   
          <div>
            <div className="relative flex items-center">
              <FiUser className="absolute left-3.5 text-gray-400 text-lg" />
              <input
                {...register("name")}
                type="text"
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#002d8f] focus:bg-white transition-all"
                placeholder="Full name"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-xs text-red-500 font-medium pl-1">{errors.name.message}</p>
            )}
          </div>

    
          <div>
            <div className="relative flex items-center">
              <FiMail className="absolute left-3.5 text-gray-400 text-lg" />
              <input
                {...register("email")}
                type="email"
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#002d8f] focus:bg-white transition-all"
                placeholder="Email address"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-500 font-medium pl-1">{errors.email.message}</p>
            )}
          </div>

    
          <div>
            <div className="relative flex items-center">
              <FiUsers className="absolute left-3.5 text-gray-400 text-lg pointer-events-none" />
              <select
                {...register("gender")}
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-700 focus:outline-none focus:border-[#002d8f] focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            {errors.gender && (
              <p className="mt-1 text-xs text-red-500 font-medium pl-1">{errors.gender.message}</p>
            )}
          </div>

    
          <div>
            <div className="relative flex items-center">
              <FiCalendar className="absolute left-3.5 text-gray-400 text-lg pointer-events-none" />
              <input
                {...register("dateOfBirth")}
                type="date"
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-700 focus:outline-none focus:border-[#002d8f] focus:bg-white transition-all"
              />
            </div>
            {errors.dateOfBirth && (
              <p className="mt-1 text-xs text-red-500 font-medium pl-1">{errors.dateOfBirth.message}</p>
            )}
          </div>

          <div>
            <div className="relative flex items-center">
              <FiKey className="absolute left-3.5 text-gray-400 text-lg" />
              <input
                {...register("password")}
                type="password"
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#002d8f] focus:bg-white transition-all"
                placeholder="Password"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500 font-medium pl-1">{errors.password.message}</p>
            )}
          </div>

       
          <div>
            <div className="relative flex items-center">
              <FiKey className="absolute left-3.5 text-gray-400 text-lg" />
              <input
                {...register("rePassword")}
                type="password"
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#002d8f] focus:bg-white transition-all"
                placeholder="Confirm password"
              />
            </div>
            {errors.rePassword && (
              <p className="mt-1 text-xs text-red-500 font-medium pl-1">{errors.rePassword.message}</p>
            )}
          </div>

      
          <button
            disabled={isLoading}
            type="submit"
            className="w-full bg-[#002d8f] hover:bg-[#002270] text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm mt-2"
          >
            {isLoading ? "Creating account..." : "Create New Account"}
          </button>
        </form>
      </div>
    </div>
  );
}