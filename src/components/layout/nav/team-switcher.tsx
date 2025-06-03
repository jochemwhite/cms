// "use client";

// import * as React from "react";
// import { ChevronsUpDown, Plus } from "lucide-react";
// import { cn } from "@/lib/utils";

// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuShortcut,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
// import { useUserSession } from "@/providers/session-provider";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// export function TeamSwitcher() {
//   const { isMobile } = useSidebar();
//   const { userSession } = useUserSession();
//   const [activeTeam, setActiveTeam] = React.useState(userSession?.available_tenants[0]);

//   const hasDropdown = userSession && userSession?.available_tenants.length > 1;
  

//   return (
//     <SidebarMenu>
//       <SidebarMenuItem>
//         <DropdownMenu >
//           <DropdownMenuTrigger asChild>
//             <SidebarMenuButton
//               disabled={!hasDropdown}
//               size="lg"
//               className={cn(
//                 "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground ",
//                 !hasDropdown && "cursor-default hover:bg-transparent disabled:cursor-default disabled:hover:bg-transparent disabled:opacity-100"
//               )}
//             >
//               <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
//                 <Avatar>
//                   <AvatarImage src={activeTeam?.tenant_logo} />
//                   <AvatarFallback>{activeTeam?.tenant_name.charAt(0)}</AvatarFallback>
//                 </Avatar>
//               </div>
//               <div className="grid flex-1 text-left text-sm leading-tight">
//                 <span className="truncate font-semibold">{activeTeam?.tenant_name}</span>
//               </div>
//               {hasDropdown && <ChevronsUpDown className="ml-auto" />}
//             </SidebarMenuButton>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent
//             className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
//             align="start"
//             side={isMobile ? "bottom" : "right"}
//             sideOffset={4}
//           >
//             <DropdownMenuLabel className="text-xs text-muted-foreground">Organizations</DropdownMenuLabel>
//             {userSession?.available_tenants.map((team, index) => (
//               <DropdownMenuItem key={team.tenant_id} onClick={() => setActiveTeam(team)} className="gap-2 p-3">
//                 <div className="flex size-6 items-center justify-center rounded-sm border">
//                   <Avatar className="mr-2">
//                     <AvatarImage src={team.tenant_logo} />
//                     <AvatarFallback>{team.tenant_name.charAt(0)}</AvatarFallback>
//                   </Avatar>
//                 </div>
//                 {team.tenant_name}
//                 <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
//               </DropdownMenuItem>
//             ))}
//             {/* <DropdownMenuSeparator /> */}
//             {/* <DropdownMenuItem className="gap-2 p-2">
//               <div className="flex size-6 items-center justify-center rounded-md border bg-background">
//                 <Plus className="size-4" />
//               </div>
//               <div className="font-medium text-muted-foreground">Add team</div>
//             </DropdownMenuItem> */}
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </SidebarMenuItem>
//     </SidebarMenu>
//   );
// }
