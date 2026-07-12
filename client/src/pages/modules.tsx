import PlaceholderPage from "../components/PlaceholderPage";

/** One stub per module page — replaced one by one as slices M1-M8 land.
 *  FleetPage (M1), TripsPage (M3), DriversPage (M2), MaintenancePage (M4),
 *  ExpensesPage (M5), AnalyticsPage (M6) shipped and moved to their own folders. */

export function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Depot preferences and the role permission matrix."
      task="M8"
    />
  );
}
