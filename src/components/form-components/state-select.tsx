import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Country } from "@/types/api/restcountries";
import React, { useState } from "react";

export const CountrySelect = ({ onChange, value }: { onChange: (value: string) => void; value: string }) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [fetched, setFetched] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const fetchCountries = async () => {
    try {
      setLoading(true);
      const response = await fetch("https://restcountries.com/v3.1/all");
      const data: Country[] = await response.json();
      setCountries((data || []).sort((a, b) => a.name.common.localeCompare(b.name.common)));
    } catch (error) {
      console.error("Error fetching countries:", error);
      setCountries([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCountries = countries.filter((country) => country.name.common.toLowerCase().includes(search.toLowerCase()));
  const selectedCountry = countries.find((country) => country.cca2 === value);

  return (
    <Select
      value={value}
      onOpenChange={async (open) => {
        if (open && !fetched) {
          await fetchCountries();
        }
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a country">{selectedCountry ? selectedCountry.name.common : "Select a country"}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <Command shouldFilter={false} className="p-0">
          <CommandInput placeholder="Search users..." value={search} onValueChange={setSearch} autoFocus />
          <CommandList>
            {loading ? (
              <div className="p-2 text-sm text-muted-foreground">Loading...</div>
            ) : (
              <>
                <CommandEmpty>No countries found.</CommandEmpty>
                {filteredCountries.map((country) => (
                  <CommandItem
                    key={country.cca2}
                    value={country.cca2}
                    onSelect={() => {
                      onChange(country.cca2);
                    }}
                  >
                    {country.name.common}
                  </CommandItem>
                ))}
                <CommandItem value="__create_new__" className="text-primary font-semibold border-t mt-2 pt-2">
                  + Create new country…
                </CommandItem>
              </>
            )}
          </CommandList>
        </Command>
      </SelectContent>
    </Select>
  );
};
