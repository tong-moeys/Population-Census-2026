import React, { createContext, useContext } from 'react';

interface ReportVisibilityContextValue {
  hideHeaderFooter: boolean;
}

const ReportVisibilityContext = createContext<ReportVisibilityContextValue>({
  hideHeaderFooter: false,
});

export const ReportVisibilityProvider: React.FC<{
  hideHeaderFooter: boolean;
  children: React.ReactNode;
}> = ({ hideHeaderFooter, children }) => (
  <ReportVisibilityContext.Provider value={{ hideHeaderFooter }}>
    {children}
  </ReportVisibilityContext.Provider>
);

export const useReportVisibility = () => useContext(ReportVisibilityContext);
