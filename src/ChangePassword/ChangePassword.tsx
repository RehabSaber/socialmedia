import { useState } from "react";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { FiKey, FiEye, FiEyeOff } from "react-icons/fi";

const BASE_URL = "https://route-posts.routemisr.com";

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

interface ChangePasswordPayload {
  password: string;
  newPassword: string;
}

async function changePassword(payload: ChangePasswordPayload) {
  const token = localStorage.getItem("userToken") || "";
  const res = await axios.patch(`${BASE_URL}/users/change-password`, payload, {
    headers: {
      token,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return res.data;
}

function PasswordField({
  label,
  placeholder,
  value,
  onChange,
  hint,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className="block text-sm font-bold text-slate-900 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 pr-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
      {hint && <p className="text-xs text-slate-500 mt-2">{hint}</p>}
    </div>
  );
}

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: (data) => {
   
      const newToken = data?.data?.token || data?.token;
      if (newToken) localStorage.setItem("userToken", newToken);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFormError("");
      setSuccess("Your password has been updated successfully.");
    },
    onError: (err) => {
      setSuccess("");
      if (axios.isAxiosError(err)) {
        setFormError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Could not update password. Please try again."
        );
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    },
  });

  const handleSubmit = () => {
    setSuccess("");

    if (!PASSWORD_REGEX.test(newPassword)) {
      setFormError(
        "New password must be at least 8 characters with uppercase, lowercase, number, and special character."
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("New password and confirmation do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setFormError("New password must be different from the current one.");
      return;
    }

    setFormError("");
    mutation.mutate({ password: currentPassword, newPassword });
  };

  const isEmpty = !currentPassword || !newPassword || !confirmPassword;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xl shrink-0">
            <FiKey />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
              Change Password
            </h1>
            <p className="text-sm text-slate-500">
              Keep your account secure by using a strong password.
            </p>
          </div>
        </div>

        <PasswordField
          label="Current password"
          placeholder="Enter current password"
          value={currentPassword}
          onChange={setCurrentPassword}
        />

        <PasswordField
          label="New password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={setNewPassword}
          hint="At least 8 characters with uppercase, lowercase, number, and special character."
        />

        <PasswordField
          label="Confirm new password"
          placeholder="Re-enter new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
        />

        {formError && (
          <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {formError}
          </p>
        )}

        {success && (
          <p className="text-sm font-semibold text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            {success}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isEmpty || mutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full py-3.5 transition disabled:bg-blue-400/70 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? "Updating..." : "Update password"}
        </button>
      </div>
    </div>
  );
}