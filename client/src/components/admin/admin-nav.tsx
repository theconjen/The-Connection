import { useLocation, Link } from "wouter";
import { useState } from "react";
import {
  BarChart,
  Users,
  Book,
  ChevronDown,
  ChevronRight,
  Laptop,
  Settings,
  ShieldCheck,
  Shield,
  GraduationCap,
  BookOpen,
  TrendingUp
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "../ui/collapsible";
import { cn } from "../../lib/utils";

export function AdminNav() {
  const [location] = useLocation();
  const [applicationsOpen, setApplicationsOpen] = useState(true);
  const [usersOpen, setUsersOpen] = useState(true);
  const [apologeticsOpen, setApologeticsOpen] = useState(true);

  // Navigation items for admin - updated to match actual features
  const navItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: <BarChart className="h-4 w-4 mr-2" />,
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      icon: <TrendingUp className="h-4 w-4 mr-2" />,
    },
    {
      title: "Content Moderation",
      href: "/admin/moderation",
      icon: <Shield className="h-4 w-4 mr-2" />,
    },
    {
      title: "Applications",
      icon: <GraduationCap className="h-4 w-4 mr-2" />,
      openState: applicationsOpen,
      setOpenState: setApplicationsOpen,
      children: [
        {
          title: "Apologist Scholar",
          href: "/admin/apologist-scholar-applications",
          icon: <Book className="h-4 w-4 mr-2" />,
        },
      ],
    },
    {
      title: "Users",
      icon: <Users className="h-4 w-4 mr-2" />,
      openState: usersOpen,
      setOpenState: setUsersOpen,
      children: [
        {
          title: "Directory",
          href: "/admin/users",
          icon: <Users className="h-4 w-4 mr-2" />,
        },
        {
          title: "Admin Users",
          href: "/admin/admin-users",
          icon: <ShieldCheck className="h-4 w-4 mr-2" />,
        },
      ],
    },
    {
      title: "Apologetics",
      icon: <BookOpen className="h-4 w-4 mr-2" />,
      openState: apologeticsOpen,
      setOpenState: setApologeticsOpen,
      children: [
        {
          title: "Resources",
          href: "/admin/apologetics-resources",
          icon: <Book className="h-4 w-4 mr-2" />,
        },
      ],
    },
    {
      title: "Platform Settings",
      href: "/admin/settings",
      icon: <Settings className="h-4 w-4 mr-2" />,
    },
    {
      title: "Return to Site",
      href: "/",
      icon: <Laptop className="h-4 w-4 mr-2" />,
      className: "mt-auto text-muted-foreground hover:text-primary",
    },
  ];

  return (
    <div className="flex flex-col h-full border-r bg-card">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
      </div>

      <nav className="flex-1 overflow-auto p-3">
        <ul className="space-y-1">
          {navItems.map((item, index) => {
            // For items with children (submenus)
            if (item.children) {
              const isOpen = item.openState;
              const setOpen = item.setOpenState;
              return (
                <li key={index}>
                  <Collapsible
                    open={isOpen}
                    onOpenChange={setOpen}
                    className="w-full"
                  >
                    <CollapsibleTrigger className="flex items-center w-full p-2 hover:bg-accent rounded-md text-sm font-medium">
                      {item.icon}
                      <span className="flex-1 text-left">{item.title}</span>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <ul className="pl-4 mt-1 space-y-1">
                        {item.children.map((child, childIndex) => (
                          <li key={childIndex}>
                            <Link href={child.href}>
                              <div className={cn(
                                "flex items-center p-2 hover:bg-accent rounded-md text-sm cursor-pointer",
                                location === child.href ? "bg-accent/50 font-medium" : ""
                              )}>
                                {child.icon}
                                {child.title}
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                </li>
              );
            }

            // For regular menu items without children
            return (
              <li key={index}>
                <Link href={item.href!}>
                  <div className={cn(
                    "flex items-center p-2 hover:bg-accent rounded-md text-sm cursor-pointer",
                    item.className,
                    location === item.href ? "bg-accent/50 font-medium" : ""
                  )}>
                    {item.icon}
                    {item.title}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}