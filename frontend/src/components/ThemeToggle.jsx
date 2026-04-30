import { Sun, Moon } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
    const { theme, toggle } = useTheme();
    const isDark = theme === "dark";
    return (
        <Button
            variant="outline"
            size="icon"
            onClick={toggle}
            aria-label="Toggle theme"
            className="h-10 w-10 shrink-0"
            data-testid="theme-toggle-btn"
        >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
    );
}
