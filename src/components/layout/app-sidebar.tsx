"use client";
import { AudioWaveform, BookOpen, Bot, Building2, Cctv, Command, GalleryVerticalEnd, Settings, SquareTerminal, User } from "lucide-react";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { useUserSession } from "@/providers/session-provider";
import { NavAdmin } from "./nav/nav-admin";
import { NavMain } from "./nav/nav-main";
import { NavProjects } from "./nav/nav-projects";
import { NavUser } from "./nav/nav-user";


const data = {
  navMain: [
    // {
    //   title: "Blogs",
    //   url: "/dashboard/blogs",
    //   icon: SquareTerminal,
    //   isActive: true,
    //   items: [
    //     {
    //       title: "All Posts",
    //       url: "/dashboard/blogs",
    //     },
    //     {
    //       title: "Drafts",
    //       url: "/dashboard/blogs/drafts",
    //     },
    //     {
    //       title: "Categories",
    //       url: "/dashboard/blogs/categories",
    //     },
    //     {
    //       title: "Tags",
    //       url: "/dashboard/blogs/tags",
    //     },
    //     {
    //       title: "Reactions",
    //       url: "/dashboard/blogs/reactions",
    //     },
    //   ],
    // },
    // {
    //   title: "Pages",
    //   url: "/dashboard/pages",
    //   icon: Bot,
    //   items: [
    //     {
    //       title: "All Pages",
    //       url: "/dashboard/pages",
    //     },
    //     {
    //       title: "Drafts",
    //       url: "/dashboard/pages/drafts",
    //     },
    //   ],
    // },
    // {
    //   title: "Events",
    //   url: "/dashboard/events",
    //   icon: BookOpen,
    //   items: [
    //     {
    //       title: "All Events",
    //       url: "/dashboard/events",
    //     },
    //     {
    //       title: "Drafts",
    //       url: "/dashboard/events/drafts",
    //     },
    //     {
    //       title: "Categories",
    //       url: "/dashboard/events/categories",
    //     },
    //   ],
    // },
  ],

  projects: [
    // {
    //   name: "User Management",
    //   url: "/dashboard/users",
    //   icon: User,
    // },
    // {
    //   name: "Settings",
    //   url: "/dashboard/settings",
    //   icon: Settings
    // },
    // {
    //   name: "Roles",
    //   url: "/dashboard/projects/roles",
    //   icon: Cctv,
    // },
  ],
  admin: [
    // {
    //   name: "Tenants",
    //   url: "/dashboard/tenants",
    //   icon: Building2,
    // },
    {
      name: "Users",
      url: "/dashboard/admin/users",
      icon: User,
    },
  ],
};

export function AppSidebar() {
  const { userSession } = useUserSession();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {/* <TeamSwitcher teams={data.teams} /> */}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        {userSession?.global_roles && userSession.global_roles.some((role) => role === "system_admin") && <NavAdmin projects={data.admin} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userSession!.user_info} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
