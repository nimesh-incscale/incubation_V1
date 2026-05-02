import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import Dashboard from "@/pages/Dashboard";
import { Toaster } from "@/components/ui/sonner";


function App() {
    return (
        <ThemeProvider>
            <div className="App font-body">
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                    </Routes>
                </BrowserRouter>
                <Toaster position="bottom-right" richColors />
            </div>
        </ThemeProvider>
    );
}

export default App;
