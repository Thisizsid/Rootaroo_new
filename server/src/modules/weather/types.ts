export interface WeatherQuery {
  lat: number;
  lon: number;
}

export interface WeatherResponse {
  tempC: number;
  condition: string;
  emoji: string;
}
