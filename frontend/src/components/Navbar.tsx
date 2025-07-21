import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, ChevronLeft, Search, X, Moon, Sun, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { getUsers, type UserListItem } from "@/services/api";
import { useTheme } from "@/ThemeProvider";

interface NavbarProps {
  title?: string;
  showBackButton?: boolean;
  showRulesButton?: boolean;
  showSearch?: boolean;
  showTheme?: boolean;
  isStaff?: boolean;
  onLogout?: () => void;
  customTitle?: string;
}

export function Navbar({ 
  title = "ЛФМШ 38",
  showBackButton = false, 
  showRulesButton = false,
  showSearch = false,
  showTheme = false,
  isStaff = false,
  onLogout,
  customTitle
}: NavbarProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserListItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login", { replace: true });
  };

  // Поиск пионеров
  useEffect(() => {
    const searchPioneers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      try {
        const users = await getUsers();
        const filtered = users.filter(user => 
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filtered);
        setShowSearchResults(true);
      } catch (error) {
        console.error("Ошибка поиска:", error);
      }
    };

    const timeoutId = setTimeout(searchPioneers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Закрытие результатов поиска при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUserSelect = (user: UserListItem) => {
    navigate(`/user/${user.username}`);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="w-full bg-secondary-background sticky top-0 z-10 border-b-2 border-black">
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Left side */}
        <div className="flex items-center gap-2">
          {showBackButton && (
            <Button
              variant="text"
              size="sm"
              className="mr-2"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="text-l font-bold">
            {customTitle || title}
          </div>
        </div>

        {/* Center - Search */}
        {showSearch && isStaff && (
          <div className="flex-1 max-w-md mx-4 relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Поиск"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-transparent border-0"
              />
              {searchQuery && (
                <Button
                  variant="text"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={clearSearch}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto z-20">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="px-4 py-2 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">@{user.username}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          { showTheme && (
          <Button
            variant="text"
            size="sm"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          )}
          {showRulesButton && !isStaff && (
            <Button
              variant="text"
              className="bg-primary hover:bg-primary/90 flex justify-end"
              onClick={() => navigate('/rules')}
            >
              <FileText className="h-4 w-4 mr-1" />
            </Button>
          )}
          {onLogout && (
            <Button variant="text" onClick={onLogout || handleLogout} size="sm">
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
} 