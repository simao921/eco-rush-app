import React, { createContext, useContext, useState } from "react";

const PERSISTENT_KEY = "eco_classroom_persistent";
const DAYS_30 = 30 * 24 * 60 * 60 * 1000;

const ClassroomContext = createContext(null);

export function ClassroomProvider({ children }) {
  const [classroom, setClassroom] = useState(null);

  const enterClassroom = (classroomData) => {
    setClassroom(classroomData);
    sessionStorage.setItem("eco_classroom", JSON.stringify(classroomData));
  };

  // Guardar sessão durante 30 dias no localStorage
  const saveSessionLong = (classroomData) => {
    const payload = {
      data: classroomData,
      expiresAt: Date.now() + DAYS_30,
    };
    localStorage.setItem(PERSISTENT_KEY, JSON.stringify(payload));
    sessionStorage.setItem("eco_classroom", JSON.stringify(classroomData));
    setClassroom(classroomData); // <-- atualiza o estado React
  };

  const exitClassroom = () => {
    setClassroom(null);
    sessionStorage.removeItem("eco_classroom");
    localStorage.removeItem(PERSISTENT_KEY);
  };

  // Restaurar sessão no arranque: primeiro sessionStorage, depois localStorage (30 dias)
  React.useEffect(() => {
    const session = sessionStorage.getItem("eco_classroom");
    if (session) {
      setClassroom(JSON.parse(session));
      return;
    }
    const persistent = localStorage.getItem(PERSISTENT_KEY);
    if (persistent) {
      try {
        const { data, expiresAt } = JSON.parse(persistent);
        if (Date.now() < expiresAt) {
          setClassroom(data);
          sessionStorage.setItem("eco_classroom", JSON.stringify(data));
        } else {
          localStorage.removeItem(PERSISTENT_KEY);
        }
      } catch {
        localStorage.removeItem(PERSISTENT_KEY);
      }
    }
  }, []);

  return (
    <ClassroomContext.Provider value={{ classroom, enterClassroom, exitClassroom, saveSessionLong }}>
      {children}
    </ClassroomContext.Provider>
  );
}

export function useClassroom() {
  return useContext(ClassroomContext);
}