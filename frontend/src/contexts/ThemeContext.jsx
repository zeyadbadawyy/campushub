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
    useState(false);

  useEffect(() => {

    const savedTheme =
      localStorage.getItem(
        "darkMode"
      );

    if (
      savedTheme === "true"
    ) {

      setDarkMode(true);

      document.body.classList.add(
        "dark-mode"
      );

    }

  }, []);

  function toggleDarkMode() {

    const newValue =
      !darkMode;

    setDarkMode(
      newValue
    );

    localStorage.setItem(
      "darkMode",
      newValue
    );

    document.body.classList.toggle(
      "dark-mode",
      newValue
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