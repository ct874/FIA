import DashboardOverview from '../components/DashboardOverview'
import CompletedSchoolsSection from '../components/CompletedSchoolsSection'
import RegisteredSchoolsSection from '../components/RegisteredSchoolsSection'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <DashboardOverview />

      <div className="mt-8">
        <CompletedSchoolsSection />
      </div>
      <RegisteredSchoolsSection />
    </div>
  )
}
