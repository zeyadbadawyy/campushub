import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  motion,
} from "framer-motion";

import logo from "../assets/logo/t_full_logo.png";

import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
} from "lucide-react";

import AuthLayout from "../layouts/AuthLayout";

import {
  useAuth,
} from "../contexts/AuthContext";

function Login() {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const navigate =
    useNavigate();

  const { login } =
    useAuth();

  async function handleLogin(e) {
    e.preventDefault();

    if (loading) {
      return;
    }

    try {
      setLoading(true);

      await login(
        email,
        password
      );

      navigate("/dashboard");
    } catch (error) {
      console.error(error);

      alert(
        "Invalid credentials"
      );
    } finally {
      setLoading(false);
    }
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
          mb-8
          text-center
        ">
          <div className="        
            flex
            items-center
            justify-center
            rounded-2xl
          ">
            <img
              src={logo}
              alt="CampusHub"
              className="
                h-50
                w-50
                object-contain
              "
            />
          </div>

          <p className="
            text-sm
            text-slate-500
            dark:text-slate-400
          ">
            Sign in to your CampusHub account.
          </p>
        </div>

        {/* Form */}

        <form
          onSubmit={handleLogin}
          className="space-y-4"
        >

          {/* Email */}

          <div>
            <label
              htmlFor="login-email"
              className="
                mb-2
                block
                text-sm
                font-medium
              "
            >
              Email
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
              <Mail
                size={17}
                className="
                  shrink-0
                  text-slate-400
                "
              />

              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                placeholder="you@example.com"
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

          {/* Password */}

          <div>
            <label
              htmlFor="login-password"
              className="
                mb-2
                block
                text-sm
                font-medium
              "
            >
              Password
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
              <Lock
                size={17}
                className="
                  shrink-0
                  text-slate-400
                "
              />

              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="Enter your password"
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

          {/* Submit */}

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
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight
                  size={17}
                />
              </>
            )}
          </button>
        </form>

        {/* Register */}

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
            Don't have an account?{" "}
            <Link
              to="/register"
              className="
                font-semibold
                text-indigo-600
                hover:text-indigo-700
                dark:text-indigo-400
              "
            >
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}

export default Login;