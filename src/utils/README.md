# Communication Specification (Frontend, Backend)

--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 

# Frontend -> Backend
### Blacklist
Sent only when changes occur. Used for timer restriction logic.

```js
const blacklist = [
  {
    timerName: "timer1",
    maxTime: 60,
    items: [
      { name: "URL_NAME_1", url: "URL_1", active: true },
      { name: "URL_NAME_2", url: "URL_2", active: true },
      { name: "URL_NAME_3", url: "URL_3", active: false }
    ]
  },
  {
    timerName: "timer2",
    maxTime: 30,
    items: [
      { name: "URL_NAME_2", url: "URL_2", active: true },
      { name: "URL_NAME_1", url: "URL_1", active: false }
    ]
  },
  {
    timerName: "timer3",
    maxTime: 40,
    items: [
      { name: "URL_NAME_4", url: "URL_4", active: true },
      { name: "URL_NAME_2", url: "URL_2", active: false }
    ]
  }
];
```


### Presence
Frontend sends a periodic heartbeat signal.

--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 

# Backend Processing
### Parsed Timer Structure
Derived from blacklist. Inactive URLs are excluded.

```js
const parsed = {
  timers: {
    timer1: { limit: 60 },
    timer2: { limit: 30 },
    timer3: { limit: 40 }
  },

  urlToTimersMap: {
    "URL_1": ["timer1"],
    "URL_2": ["timer1", "timer2"],
    "URL_4": ["timer3"]
  }
};
```

--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 

# Backend -> Frontend
### Timer State
Remaining time per timer.

```js
const timerState = {
  timer1: { minutesRemaining: 22 },
  timer2: { minutesRemaining: 12 },
  timer3: { minutesRemaining: 12 }
};
```

--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 

### Recent Activity Stats
Per-visit log maintained in `logDomainTime`. A revisit within 5 minutes resumes
the latest entry; after 5 minutes a new entry is added (so a site can appear
twice). The dashboard reads the 10 most recent directly.

```js
const recentVisits = [
  {url: "URL_1", durationSeconds: 22, lastVisit: 1720440000000},
  {url: "URL_2", durationSeconds: 12, lastVisit: 1720439000000},
  ...
];
```

--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 

### Weekly + All-Time Statistics
Sent every 10 minutes or on page refresh (only when dashboard is open).

```js
const usageStats = {
  focusHours: 11.9,
  focusSessions: 8,
  scrollHours: 4.5,
  scrollAttempts: 17,
  scrollBlocks: 9,
  bestStreak: 4,
  blockedSites: 23,
  activeDays: 6,
  chart: {
    focus: [1.2, 2.5, 0.8, 3.0, 4.1, 0.0, 0.3],
    scroll: [0.5, 1.0, 0.2, 1.8, 0.9, 0.1, 0.0]
  }
};
```