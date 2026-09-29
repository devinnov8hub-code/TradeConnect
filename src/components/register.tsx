import React, { useState } from "react";
import { User, LockKeyholeIcon, Mail, Eye, EyeClosed } from "lucide-react";
import { useAuthStore } from "../lib/context";
import { type RegisterData } from "../lib/types/auth";
import { getErrorMessage } from "../lib/getErrorMessage";
import { useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import AuthTabs from "./AuthTabs";

const Register = () => {
  const navigate = useNavigate();
  const handleRegister = useAuthStore((state: any) => state.register);

  const [formData, setFormData] = useState<RegisterData>({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "user",
  });
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "firstName") {
      setFirstName(value);
      setFormData((prev: RegisterData) => ({
        ...prev,
        name: `${value} ${lastName}`.trim(),
      }));
      return;
    }

    if (name === "lastName") {
      setLastName(value);
      setFormData((prev: RegisterData) => ({
        ...prev,
        name: `${firstName} ${value}`.trim(),
      }));
      return;
    }

    setFormData((prev: RegisterData) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name");
      return;
    }

    if (
      !formData.email ||
      !formData.password ||
      !formData.password_confirmation
    ) {
      setError("Please input all fields");
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setError("Passwords don't match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Passwords should be at least 8 digits");
      return;
    }
    setLoading(true);

    try {
      const registrationData: RegisterData = {
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        role: "user",
      };

      await handleRegister(registrationData);
      navigate("/login");
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      cardTitle="Create an Account"
      cardSubtitle={
        <>
          Get started with{" "}
          <span className="font-semibold text-primary">Trade Connect</span>{" "}
          operations.
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthTabs active="signup" />

        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-primary">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:border-primary">
            <User className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              name="firstName"
              type="text"
              placeholder="First name"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              value={firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:border-primary">
            <User className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              name="lastName"
              type="text"
              placeholder="Last name"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              value={lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:border-primary">
          <Mail className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:border-primary">
          <LockKeyholeIcon className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((pass) => !pass)}
            className="shrink-0 text-slate-400 hover:text-slate-600"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeClosed className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:border-primary">
          <LockKeyholeIcon className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            name="password_confirmation"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm password"
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            value={formData.password_confirmation}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((pass) => !pass)}
            className="shrink-0 text-slate-400 hover:text-slate-600"
            tabIndex={-1}
          >
            {showConfirmPassword ? (
              <EyeClosed className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-base font-semibold"
        >
          {loading && <div className="loader" />}
          {loading ? "Creating your account" : "Sign Up"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Register;
