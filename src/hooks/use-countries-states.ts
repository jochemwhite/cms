import { CountriesPositionResponse, CountryPosition, State, StatesByCountryResponse } from "@/types/api/countriesnow";
import { useEffect, useState } from "react";

export function useCountriesAndStates() {
  const [countries, setCountries] = useState<CountryPosition[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);

  useEffect(() => {
    setLoadingCountries(true);
    fetch("https://countriesnow.space/api/v0.1/countries/positions")
      .then((res) => res.json())
      .then((data: CountriesPositionResponse) => {
        setCountries(data.data);
        setLoadingCountries(false);
      });
  }, []);

  const fetchStates = (iso2: string) => {
    if (!iso2) {
      setStates([]);
      setLoadingStates(false);
      return;
    }

    setLoadingStates(true);
    fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ iso2 }),
    })
      .then((res) => res.json())
      .then((data: StatesByCountryResponse) => {
        setStates(data.data.states);
        setLoadingStates(false);
      });
  };

  return { countries, states, loadingCountries, loadingStates, fetchStates };
}
