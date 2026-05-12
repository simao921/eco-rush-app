import React, { createContext, useContext, useState } from "react";

const PERSISTENT_KEY = "eco_classroom_persistent";
const DAYS_30 = 30 * 24 * 60 * 60 * 1000;

const ClassroomContext = createContext(null);

export function ClassroomProvider({ children }) {
  // Inicializar o estado diretamente do storage para evitar redirecionamentos no refresh
  const [classroom, setClassroom] = useState(() => {
    if (typeof window === "undefined") return null;
    
    const session = sessionStorage.getItem("eco_classroom");
    if (session) {
      try {
        return JSON.parse(session);
      } catch {
        return null;
      }
    }

    const persistent = localStorage.getItem(PERSISTENT_KEY);
    if (persistent) {
      try {
        const { data, expiresAt } = JSON.parse(persistent);
        if (Date.now() < expiresAt) {
          // Guardar também na sessão para consistência
          sessionStorage.setItem("eco_classroom", JSON.stringify(data));
          return data;
        } else {
          localStorage.removeItem(PERSISTENT_KEY);
        }
      } catch {
        localStorage.removeItem(PERSISTENT_KEY);
      }
    }
    return null;
  });

  const enterClassroom = (classroomData) => {
    setClassroom(classroomData);
    sessionStorage.setItem("eco_classroom", JSON.stringify(classroomData));
  };

  const saveSessionLong = (classroomData) => {
    const payload = {
      data: classroomData,
      expiresAt: Date.now() + DAYS_30,
    };
    localStorage.setItem(PERSISTENT_KEY, JSON.stringify(payload));
    sessionStorage.setItem("eco_classroom", JSON.stringify(classroomData));
    setClassroom(classroomData);
  };

  const exitClassroom = () => {
    setClassroom(null);
    sessionStorage.removeItem("eco_classroom");
    localStorage.removeItem(PERSISTENT_KEY);
  };

  return (
    <ClassroomContext.Provider value={{ classroom, enterClassroom, exitClassroom, saveSessionLong }}>
      {children}
    </ClassroomContext.Provider>
  );
}

export function useClassroom() {
  return useContext(ClassroomContext);
}