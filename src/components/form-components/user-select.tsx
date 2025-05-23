import React from "react";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/supabaseClient";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";

export interface UserSelectProps {
  value: string | undefined;
  onChange: (value: string) => void;
  onCreateNew: () => void;
  placeholder?: string;
}

export const UserSelect: React.FC<UserSelectProps> = ({ value, onChange, onCreateNew, placeholder }) => {
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [fetched, setFetched] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email")
        .order("first_name", { ascending: true });
      if (error) throw error;
      setUsers(data || []);
      setFetched(true);
    } catch (e) {
      // Optionally handle error
    }
    setLoading(false);
  };

  // Filter users by search
  const filteredUsers =
    search.trim().length === 0
      ? users
      : users.filter((user) =>
          `${user.first_name} ${user.last_name} ${user.email}`
            .toLowerCase()
            .includes(search.toLowerCase())
        );

  return (
    <Select
      value={value}
      onValueChange={(val) => {
        if (val === "__create_new__") {
          onCreateNew();
        } else {
          onChange(val);
        }
      }}
      onOpenChange={async (open) => {
        if (open && !fetched) {
          await fetchUsers();
        }
      }}
    >
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder={placeholder || "Select a user"} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        <Command shouldFilter={false} className="p-0">
          <CommandInput
            placeholder="Search users..."
            value={search}
            onValueChange={setSearch}
            autoFocus
          />
          <CommandList>
            {loading ? (
              <div className="p-2 text-sm text-muted-foreground">Loading...</div>
            ) : (
              <>
                <CommandEmpty>No users found.</CommandEmpty>
                {filteredUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.id}
                    onSelect={() => onChange(user.id)}
                  >
                    {user.first_name} {user.last_name} ({user.email})
                  </CommandItem>
                ))}
                <CommandItem
                  value="__create_new__"
                  onSelect={() => onCreateNew()}
                  className="text-primary font-semibold border-t mt-2 pt-2"
                >
                  + Create new user…
                </CommandItem>
              </>
            )}
          </CommandList>
        </Command>
      </SelectContent>
    </Select>
  );
}; 