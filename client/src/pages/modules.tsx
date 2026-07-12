import PlaceholderPage from "../components/PlaceholderPage";

/** One stub per module page — replaced one by one as slices M1-M8 land. */

export function FleetPage() {
  return (
    <PlaceholderPage
      title="Fleet"
      description="Vehicle registry with unique registration numbers, capacity, odometer, and status lifecycle."
      task="M1"
    />
  );
}

export function DriversPage() {
  return (
    <PlaceholderPage
      title="Drivers"
      description="Driver profiles with license expiry tracking, safety scores, and duty status."
      task="M2"
    />
  );
}

export function TripsPage() {
  return (
    <PlaceholderPage
      title="Trips"
      description="Trip dispatcher with the Draft to Dispatched to Completed lifecycle and capacity checks."
      task="M3"
    />
  );
}

export function MaintenancePage() {
  return (
    <PlaceholderPage
      title="Maintenance"
      description="Service records that automatically move vehicles in and out of the shop."
      task="M4"
    />
  );
}

export function ExpensesPage() {
  return (
    <PlaceholderPage
      title="Fuel & Expenses"
      description="Fuel logs, tolls, and the auto-computed operational cost per vehicle."
      task="M5"
    />
  );
}

export function AnalyticsPage() {
  return (
    <PlaceholderPage
      title="Analytics"
      description="Fuel efficiency, utilization, vehicle ROI, and CSV export."
      task="M6"
    />
  );
}

export function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Depot preferences and the role permission matrix."
      task="M8"
    />
  );
}
