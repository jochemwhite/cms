export interface CountriesPositionResponse {
  error: boolean;
  msg: string;
  data: CountryPosition[];
}

export interface CountryPosition {
  name: string;
  iso2: string;
  long: number;
  lat: number;
}

export interface StatesByCountryResponse {
  error: boolean;
  msg: string;
  data: CountryWithStates;
}

export interface CountryWithStates {
  name: string;
  states: State[];
}

export interface State {
  name: string;
  state_code: string;
}
