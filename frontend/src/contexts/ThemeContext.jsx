import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

const ThemeContext =
  createContext();

export function ThemeProvider({
  children
}) {

  const [darkMode, setDarkMode] =
    useState(() => {
      const savedTheme =
        localStorage.getItem("darkMode");

      return savedTheme === null
        ? true
        : savedTheme === "true";
    });

  useEffect(() => {

    document.body.classList.toggle(
      "dark-mode",
      darkMode
    );

    localStorage.setItem(
      "darkMode",
      String(darkMode)
    );

  }, [darkMode]);

  function toggleDarkMode() {

    setDarkMode(
      previous => !previous
    );

  }

  return (

    <ThemeContext.Provider
      value={{
        darkMode,
        toggleDarkMode
      }}
    >

      {children}

    </ThemeContext.Provider>

  );

}

export function useTheme() {

  return useContext(
    ThemeContext
  );

}