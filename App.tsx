
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import MasterDataLayout from './components/layout/MasterDataLayout';
import MainLayout from './components/layout/MainLayout';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import PlaceholderPage from './components/ui/PlaceholderPage';

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <ToastProvider>
                <HashRouter>
                    <Routes>
                        <Route path="/" element={<MainLayout />}>
                            <Route index element={<Navigate to="/masterData/companyMaster" replace />} />

                            <Route path="dashboard" element={<PlaceholderPage />} />
                            <Route path="reports-and-insights" element={<PlaceholderPage />} />
                            <Route path="advanced-reports" element={<PlaceholderPage />} />
                            <Route path="profit-and-loss" element={<PlaceholderPage />} />
                            <Route path="employee-management" element={<PlaceholderPage />} />
                            <Route path="lead-management" element={<PlaceholderPage />} />
                            <Route path="customers" element={<PlaceholderPage />} />
                            <Route path="task-management" element={<PlaceholderPage />} />
                            <Route path="policy-list" element={<PlaceholderPage />} />
                            <Route path="mutual-funds" element={<PlaceholderPage />} />
                            <Route path="upselling" element={<PlaceholderPage />} />
                            <Route path="calendar" element={<PlaceholderPage />} />
                            <Route path="notes" element={<PlaceholderPage />} />
                            <Route path="action-hub" element={<PlaceholderPage />} />
                            <Route path="services-hub" element={<PlaceholderPage />} />
                            <Route path="location-services" element={<PlaceholderPage />} />
                            <Route path="chatbot" element={<PlaceholderPage />} />
                            <Route path="my-profile" element={<PlaceholderPage />} />

                            <Route path="masterData/*" element={<MasterDataLayout />} />
                            
                            <Route path="*" element={<div className="p-8 text-center">Page not found.</div>} />
                        </Route>
                    </Routes>
                </HashRouter>
            </ToastProvider>
        </ThemeProvider>
    );
};

export default App;
