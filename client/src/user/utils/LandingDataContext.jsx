import { createContext, useContext, useEffect, useState } from "react";
import { fetchLandingData } from "./parseLandingXml";

const LandingDataContext = createContext(null);

export function LandingDataProvider({ children }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchLandingData().then(setData);
  }, []);

  return (
    <LandingDataContext.Provider value={data}>
      {children}
    </LandingDataContext.Provider>
  );
}

export function useLandingData() {
  return useContext(LandingDataContext);
}
