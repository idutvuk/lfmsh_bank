import { Button } from "@/components/ui/button";
import { FileText, ChevronLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface NavbarProps {
  title?: string;
  showBackButton?: boolean;
  showRulesButton?: boolean;
  isStaff?: boolean;
  onLogout?: () => void;
}

export function Navbar({ 
  title = "Банк ЛФМШ 38",
  showBackButton = false, 
  showRulesButton = false, 
  isStaff = false,
  onLogout 
}: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentYear = new Date().getFullYear();
  
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login", { replace: true });
  };

  const defaultTitle = `Банк ЛФМШ ${currentYear - 1987}`;

  return (
    <header className="w-full bg-background sticky top-0 z-10 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Left side */}
        <div className="flex items-center gap-2">
          {showBackButton && (
            <Button
              variant="neutral"
              size="sm"
              className="mr-2"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
              {location.pathname === "/rules" ? "Назад" : null}
            </Button>
          )}
          <div className="text-l font-bold">
            {title || defaultTitle}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {showRulesButton && !isStaff && (
            <Button
              variant="default"
              className="bg-primary hover:bg-primary/90 flex justify-end"
              onClick={() => navigate('/rules')}
            >
              <FileText className="h-4 w-4 mr-1" />
              Правила
            </Button>
          )}
          {onLogout && (
            <Button onClick={onLogout || handleLogout} size="sm">
              Выйти
            </Button>
          )}
        </div>
      </div>
    </header>
  );
} 