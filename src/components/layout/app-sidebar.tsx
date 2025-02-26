"use client";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Building2,
  Cctv,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  User,
} from "lucide-react";
import * as React from "react";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { NavMain } from "./nav/nav-main";
import { NavProjects } from "./nav/nav-projects";
import { NavUser } from "./nav/nav-user";
import { TeamSwitcher } from "./nav/team-switcher";
import { NavAdmin } from "./nav/nav-admin";
import { getCurrentUserRoles } from "@/server/auth/getCurrentUserRoles";
import { Database } from "@/types/supabase";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],

  projects: [
    {
      name: "Users",
      url: "/dashboard/projects/users",
      icon: User,
    },
    {
      name: "Roles",
      url: "/dashboard/projects/roles",
      icon: Cctv,
    },

  ],
  admin: [
    {
      name: "Tenants",
      url: "/dashboard/tenants",
      icon: Building2,
    },
    {
      name: "Users",
      url: "/dashboard/admin/users",
      icon: User,
    },
  ],
};


interface Props {
  roles: Database["public"]["Enums"]["app_role"][];
  user: Database["public"]["Tables"]["users"]["Row"];
}

export function AppSidebar({ roles, user }: Props) {
  


  return (
    <Sidebar collapsible="icon" >
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        {roles.includes("system_admin") && <NavAdmin projects={data.admin} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
