declare module 'suncalc' {
  interface SunTimes {
    sunrise: Date;
    sunset: Date;
    sunriseEnd: Date;
    sunsetStart: Date;
    dawn: Date;
    dusk: Date;
    nauticalDawn: Date;
    nauticalDusk: Date;
    nightEnd: Date;
    night: Date;
    goldenHourEnd: Date;
    goldenHour: Date;
    solarNoon: Date;
    nadir: Date;
  }

  interface SunPosition {
    altitude: number;
    azimuth: number;
  }

  interface MoonPosition {
    altitude: number;
    azimuth: number;
    distance: number;
    parallacticAngle: number;
  }

  interface MoonIllumination {
    fraction: number;
    phase: number;
    angle: number;
  }

  interface MoonTimes {
    rise?: Date;
    set?: Date;
    alwaysUp?: boolean;
    alwaysDown?: boolean;
  }

  export function getTimes(date: Date, latitude: number, longitude: number, height?: number): SunTimes;
  export function getPosition(date: Date, latitude: number, longitude: number): SunPosition;
  export function getMoonPosition(date: Date, latitude: number, longitude: number): MoonPosition;
  export function getMoonIllumination(date: Date): MoonIllumination;
  export function getMoonTimes(date: Date, latitude: number, longitude: number, inUTC?: boolean): MoonTimes;
  export function addTime(angle: number, riseName: string, setName: string): void;
}
