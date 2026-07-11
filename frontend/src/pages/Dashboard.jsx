import MainLayout from "../layouts/MainLayout";
import StatCard from "../components/StatCard";

function Dashboard() {

  return (

    <MainLayout>

      <div className="dashboard-page">

        <div className="dashboard-header">

          <h1>
            Dashboard
          </h1>

          <p>
            Overview of your CampusHub activity.
          </p>

        </div>

        <div className="stats-grid">

          <StatCard
            title="Posts"
            value="24"
          />

          <StatCard
            title="Followers"
            value="186"
          />

          <StatCard
            title="Following"
            value="93"
          />

          <StatCard
            title="Messages"
            value="12"
          />

        </div>

      </div>

    </MainLayout>

  );

}

export default Dashboard;