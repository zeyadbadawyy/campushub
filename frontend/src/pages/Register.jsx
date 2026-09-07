import { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  motion,
} from "framer-motion";

import {
  GraduationCap,
  UserRound,
  Mail,
  Lock,
  BookOpen,
  FileText,
  ArrowRight,
  Loader2,
} from "lucide-react";

import AuthLayout from "../layouts/AuthLayout";

import {
  registerUser,
} from "../services/auth";

function Register() {
  const navigate =
    useNavigate();

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      password: "",
      bio: "",
      faculty: "",
    });

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (loading) {
      return;
    }

    try {
      setLoading(true);

      await registerUser(
        formData
      );

      alert(
        "Registration successful!"
      );

      navigate("/login");
    } catch (error) {
      console.error(error);

      alert(
        "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]:
        e.target.value,
    }));
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.35,
        }}
        className="
          overflow-hidden
          rounded-3xl
          border
          border-slate-200/80
          bg-white
          p-6
          shadow-xl
          shadow-slate-900/5
          dark:border-slate-800
          dark:bg-slate-900
          sm:p-8
        "
      >

        {/* Brand */}

        <div className="
          mb-7
          text-center
        ">
          <div className="
            mx-auto
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            bg-indigo-600
            text-white
            shadow-lg
            shadow-indigo-600/20
          ">
            <GraduationCap
              size={27}
            />
          </div>

          <h1 className="
            mt-5
            text-2xl
            font-bold
            tracking-tight
          ">
            Create your account
          </h1>

          <p className="
            mt-2
            text-sm
            text-slate-500
            dark:text-slate-400
          ">
            Join your campus community on CampusHub.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          <AuthField
            id="register-name"
            name="name"
            type="text"
            label="Full Name"
            placeholder="Your full name"
            value={formData.name}
            onChange={handleChange}
            icon={UserRound}
            required
          />

          <AuthField
            id="register-email"
            name="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            icon={Mail}
            required
          />

          <AuthField
            id="register-password"
            name="password"
            type="password"
            label="Password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            icon={Lock}
            required
          />

          <AuthField
            id="register-faculty"
            name="faculty"
            type="text"
            label="Faculty"
            placeholder="e.g. Computer Science"
            value={formData.faculty}
            onChange={handleChange}
            icon={BookOpen}
            required
          />

          <div>
            <label
              htmlFor="register-bio"
              className="
                mb-2
                flex
                items-center
                gap-2
                text-sm
                font-medium
              "
            >
              <FileText size={15} />
              Bio
            </label>

            <textarea
              id="register-bio"
              name="bio"
              rows={3}
              placeholder="Tell people a little about yourself..."
              value={formData.bio}
              onChange={handleChange}
              className="
                min-h-[90px]
                w-full
                resize-none
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                p-3
                text-sm
                leading-6
                outline-none
                transition
                focus:border-indigo-500
                focus:bg-white
                focus:ring-4
                focus:ring-indigo-500/10
                dark:border-slate-700
                dark:bg-slate-950
                dark:focus:bg-slate-950
              "
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="
              mt-2
              flex
              h-12
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-indigo-600
              text-sm
              font-semibold
              text-white
              shadow-sm
              shadow-indigo-600/20
              transition
              hover:bg-indigo-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {loading ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight
                  size={17}
                />
              </>
            )}
          </button>
        </form>

        <div className="
          mt-6
          border-t
          border-slate-100
          pt-6
          text-center
          dark:border-slate-800
        ">
          <p className="
            text-sm
            text-slate-500
            dark:text-slate-400
          ">
            Already have an account?{" "}
            <Link
              to="/login"
              className="
                font-semibold
                text-indigo-600
                hover:text-indigo-700
                dark:text-indigo-400
              "
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}

function AuthField({
  id,
  name,
  type,
  label,
  placeholder,
  value,
  onChange,
  icon: Icon,
  required = false,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="
          mb-2
          flex
          items-center
          gap-2
          text-sm
          font-medium
        "
      >
        <Icon size={15} />
        {label}
      </label>

      <div className="
        flex
        h-12
        items-center
        gap-3
        rounded-xl
        border
        border-slate-200
        bg-slate-50
        px-3
        transition
        focus-within:border-indigo-500
        focus-within:bg-white
        focus-within:ring-4
        focus-within:ring-indigo-500/10
        dark:border-slate-700
        dark:bg-slate-950
        dark:focus-within:bg-slate-950
      ">
        <Icon
          size={17}
          className="
            shrink-0
            text-slate-400
          "
        />

        <input
          id={id}
          name={name}
          type={type}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="
            min-w-0
            flex-1
            bg-transparent
            text-sm
            outline-none
            placeholder:text-slate-400
          "
        />
      </div>
    </div>
  );
}

export default Register;