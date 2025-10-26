export interface DayWindow {
  day: string; // ISO date e.g. "2025-05-07"
  startTime: string; // "HH:mm" when you can begin sightseeing that day
  endTime: string; // "HH:mm" when you must stop that day
}

export type Requirements = {
  days: DayWindow[];
  startLocation?: string;
  endLocation?: string;
  placesToVisit?: { place_id: string }[];
  placesVisitDays?: { place_id: string; day: string }[];
};

export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export interface OpeningHour {
  day: DayOfWeek;
  open?: string; // "HH:mm"
  close?: string; // "HH:mm"
}

export type Place = {
  name: string;
  place_id: string;
  average_visit_time: number;
  opening_hours: OpeningHour[];
};

export type Distance = {
  from: string;
  destinations: {
    to: string;
    duration: number; // Changed to number
  }[];
};

export type ItineraryLogicRequestType = {
  requirements: Requirements;
  places: Place[];
  distances: Distance[];
};

export type VisitPlan = {
  placeId: string;
  placeName: string;
  arrivalTime: string; // "YYYY-MM-DD HH:mm"
  startVisitTime: string; // "YYYY-MM-DD HH:mm"
  endVisitTime: string; // "YYYY-MM-DD HH:mm"
  timeTravelled: number;
};

export type ItineraryPlan = {
  visits: VisitPlan[];
  totalTravelMinutes: number;
  suggestions?: string[];
};

export const example: ItineraryLogicRequestType = {
  requirements: {
    placesVisitDays: [
      {
        place_id: "ChIJwSjue0L_sUAR3K2rAviJECs",
        day: "2025-05-08",
      },
    ],
    days: [
      {
        startTime: "09:00",
        endTime: "12:00",
        day: "2025-05-07",
      },
      {
        startTime: "09:00",
        endTime: "12:00",
        day: "2025-05-08",
      },
      {
        startTime: "09:00",
        endTime: "12:00",
        day: "2025-05-09",
      },
      {
        startTime: "09:00",
        endTime: "12:00",
        day: "2025-05-10",
      },
    ],
  },
  places: [
    // Japanos Aviatorilor
    {
      name: "Japanos Aviatorilor",
      place_id: "ChIJp2UUNgACskARMipN3hwIIEU",
      average_visit_time: 90,
      opening_hours: [
        { day: "Monday", open: "12:00", close: "22:00" },
        { day: "Tuesday", open: "12:00", close: "22:00" },
        { day: "Wednesday", open: "12:00", close: "22:00" },
        { day: "Thursday", open: "12:00", close: "22:00" },
        { day: "Friday", open: "12:00", close: "22:00" },
        { day: "Saturday", open: "12:00", close: "22:00" },
        { day: "Sunday", open: "12:00", close: "22:00" },
      ],
    },
    // Palace of Parliament
    {
      name: "Palace of Parliament",
      place_id: "ChIJwSjue0L_sUAR3K2rAviJECs",
      average_visit_time: 45,
      opening_hours: [
        { day: "Monday", open: "09:00", close: "17:00" },
        { day: "Tuesday", open: "09:00", close: "17:00" },
        { day: "Wednesday", open: "09:00", close: "17:00" },
        { day: "Thursday", open: "09:00", close: "17:00" },
        { day: "Friday", open: "09:00", close: "17:00" },
        { day: "Saturday", open: "09:00", close: "17:00" },
        { day: "Sunday", open: "09:00", close: "17:00" },
      ],
    },
    // Grigore Antipa Museum
    {
      name: "Grigore Antipa National Museum of Natural History",
      place_id: "ChIJ5e62fv8BskARHchO5C-RCxI",
      average_visit_time: 120,
      opening_hours: [
        { day: "Monday" }, // closed
        { day: "Tuesday", open: "10:00", close: "19:00" },
        { day: "Wednesday", open: "10:00", close: "19:00" },
        { day: "Thursday", open: "10:00", close: "19:00" },
        { day: "Friday", open: "10:00", close: "19:00" },
        { day: "Saturday", open: "10:00", close: "19:00" },
        { day: "Sunday", open: "10:00", close: "19:00" },
      ],
    },
    // Youth Park
    {
      name: "Youth Park",
      place_id: "ChIJ_9zV0qr_sUARjk_kKHWdIpw",
      average_visit_time: 150,
      opening_hours: [
        { day: "Monday", open: "00:00", close: "23:59" },
        { day: "Tuesday", open: "00:00", close: "23:59" },
        { day: "Wednesday", open: "00:00", close: "23:59" },
        { day: "Thursday", open: "00:00", close: "23:59" },
        { day: "Friday", open: "00:00", close: "23:59" },
        { day: "Saturday", open: "00:00", close: "23:59" },
        { day: "Sunday", open: "00:00", close: "23:59" },
      ],
    },
    // Bucharest Henri Coandă International Airport
    {
      name: "Bucharest Henri Coandă International Airport",
      place_id: "ChIJd49YtoEcskARfodtna1dThE",
      average_visit_time: 45,
      opening_hours: [
        { day: "Monday", open: "09:00", close: "23:30" },
        { day: "Tuesday", open: "09:00", close: "23:30" },
        { day: "Wednesday", open: "09:00", close: "23:30" },
        { day: "Thursday", open: "09:00", close: "23:30" },
        { day: "Friday", open: "09:00", close: "23:30" },
        { day: "Saturday", open: "09:00", close: "23:30" },
        { day: "Sunday", open: "09:00", close: "23:30" },
      ],
    },
  ],

  distances: [
    // from Japanos
    {
      from: "ChIJp2UUNgACskARMipN3hwIIEU",
      destinations: [
        { to: "ChIJwSjue0L_sUAR3K2rAviJECs", duration: 16 },
        { to: "ChIJ5e62fv8BskARHchO5C-RCxI", duration: 8 },
        { to: "ChIJ_9zV0qr_sUARjk_kKHWdIpw", duration: 16 },
        { to: "ChIJd49YtoEcskARfodtna1dThE", duration: 18 },
      ],
    },
    // from Palace
    {
      from: "ChIJwSjue0L_sUAR3K2rAviJECs",
      destinations: [
        { to: "ChIJp2UUNgACskARMipN3hwIIEU", duration: 13 },
        { to: "ChIJ5e62fv8BskARHchO5C-RCxI", duration: 15 },
        { to: "ChIJ_9zV0qr_sUARjk_kKHWdIpw", duration: 9 },
        { to: "ChIJd49YtoEcskARfodtna1dThE", duration: 29 },
      ],
    },
    // from Antipa
    {
      from: "ChIJ5e62fv8BskARHchO5C-RCxI",
      destinations: [
        { to: "ChIJp2UUNgACskARMipN3hwIIEU", duration: 2 },
        { to: "ChIJwSjue0L_sUAR3K2rAviJECs", duration: 12 },
        { to: "ChIJ_9zV0qr_sUARjk_kKHWdIpw", duration: 12 },
        { to: "ChIJd49YtoEcskARfodtna1dThE", duration: 20 },
      ],
    },
    // from Youth Park
    {
      from: "ChIJ_9zV0qr_sUARjk_kKHWdIpw",
      destinations: [
        { to: "ChIJp2UUNgACskARMipN3hwIIEU", duration: 12 },
        { to: "ChIJwSjue0L_sUAR3K2rAviJECs", duration: 11 },
        { to: "ChIJ5e62fv8BskARHchO5C-RCxI", duration: 16 },
        { to: "ChIJd49YtoEcskARfodtna1dThE", duration: 29 },
      ],
    },
    // from Airport
    {
      from: "ChIJd49YtoEcskARfodtna1dThE",
      destinations: [
        { to: "ChIJp2UUNgACskARMipN3hwIIEU", duration: 22 },
        { to: "ChIJwSjue0L_sUAR3K2rAviJECs", duration: 31 },
        { to: "ChIJ5e62fv8BskARHchO5C-RCxI", duration: 24 },
        { to: "ChIJ_9zV0qr_sUARjk_kKHWdIpw", duration: 31 },
      ],
    },
  ],
};

// ChIJp2UUNgACskARMipN3hwIIEU - Japanos
// ChIJwSjue0L_sUAR3K2rAviJECs - Palatul Parlamentului
// ChIJ5e62fv8BskARHchO5C-RCxI - Muzeul Antipa
