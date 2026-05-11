import React, { createContext, useContext, useState } from "react";

const ClassroomContext = createContext(null);

export function ClassroomProvider({ children }) {
  const [classroom, setClassroom] = useState(null);

  const enterClassroom = (classroomData) => {
    setClassroom(classroomData);
    sessionStorage.setItem("eco_classroom", JSON.stringify(classroomData));
  };

  const exitClassroom = () => {
    setClassroom(null);
    sessionStorage.removeItem("eco_classroom");
  };

  // Restore from session on mount
  React.useEffect(() => {
    const saved = sessionStorage.getItem("eco_classroom");
    if (saved) {
      setClassroom(JSON.parse(saved));
    }
  }, []);

  return (
    <ClassroomContext.Provider value={{ classroom, enterClassroom, exitClassroom }}>
      {children}
    </ClassroomContext.Provider>
  );
}

export function useClassroom() {
  return useContext(ClassroomContext);
}