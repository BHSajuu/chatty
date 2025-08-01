import { Globe, LogOut, MessageSquare, Settings, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import TranslationStatus from "./TranslationStatus";
import { useTranslationStore } from "../store/useTranslationStore";
import { useCallStore } from "../store/useCallStore";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  const { translationEnabled, preferredLanguage, toggleTranslation } = useTranslationStore();
  const {isActive} = useCallStore();

  return (
    <header
      className="bg-base-100/80 border-b border-base-300 fixed w-full top-0 z-40 lg:z-50  
    backdrop-blur-lg">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-all">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Chatty</h1>
            </Link>
          </div>

          <div className="hidden lg:block relative top-8 left-30 hover:cursor-pointer">
            {translationEnabled && !isActive && <TranslationStatus onClick={() => toggleTranslation()} translationEnabled={translationEnabled} preferredLanguage={preferredLanguage}  />}
          </div>
          <div className="lg:hidden">
            <div className="flex items-center space-x-1 mt-1">
              <Globe className="w-3 h-3 text-emerald-300" />
              <span className="text-emerald-200 text-xs font-medium">
                {preferredLanguage}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5 mr-4">
            <Link
              to={"/settings"}
              className={`
              btn btn-sm gap-2 transition-colors   
              `}>
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>

            {authUser && (
              <>
                <Link to={"/profile"} className={`btn btn-sm gap-2`}>
                  <User className="size-5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                <button className="flex gap-2 items-center" onClick={logout}>
                  <LogOut className="size-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
