function AuthLayout({ children }) {
  return (
    <div className="
      min-h-screen
      bg-slate-50
      text-slate-950
      dark:bg-slate-950
      dark:text-slate-50
    ">
      <div className="
        relative
        flex
        min-h-screen
        items-center
        justify-center
        overflow-hidden
        px-4
        py-10
        sm:px-6
      ">

        {/* Background decoration */}

        <div className="
          pointer-events-none
          absolute
          -left-32
          -top-32
          h-72
          w-72
          rounded-full
          bg-indigo-500/10
          blur-3xl
        " />

        <div className="
          pointer-events-none
          absolute
          -bottom-32
          -right-32
          h-72
          w-72
          rounded-full
          bg-violet-500/10
          blur-3xl
        " />

        <div className="
          relative
          z-10
          w-full
          max-w-md
        ">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;