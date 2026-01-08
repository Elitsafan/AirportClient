# Airport Client

Angular frontend for the Airport Management System - provides real-time flight tracking and airport visualization.

> **Note**: This is the standalone frontend repository. For the complete system including backend, API, and simulator, see the [AirportRevised repository](https://github.com/Elitsafan/AirportRevised).

---

## Features

- Real-time flight and airport status visualization
- SignalR integration for live updates
- Angular 16+ architecture
- Bootstrap 5 UI with responsive design
- Comprehensive unit and integration tests with Jasmine/Karma

---

## Quick Start

### Prerequisites

- [Node.js 16+](https://nodejs.org/)
- [npm](https://www.npmjs.com/)

### Installation

```sh
npm install
npm start
```

The app will be available at [http://localhost:4200](http://localhost:4200)

---

## Configuration

Configure the backend API URL in `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5005'  // Your backend API URL
};
```

---

## Testing

Run tests:
```sh
npm test
```

---

## Live Demo

**Frontend**: [https://airport.view.elitzafan.com](https://airport.view.elitzafan.com)

---

## Related Repositories

- **Full System**: [AirportRevised](https://github.com/Elitsafan/AirportRevised) - Complete Airport Management System with backend, API, database, and simulator

---

## Contact

For questions, contact [elitsafan@gmail.com](mailto:elitsafan@gmail.com)
