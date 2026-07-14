import {
  useEffect,
  useState
} from "react";

import {
  useSearchParams,
  Link
} from "react-router-dom";

import MainLayout
  from "../layouts/MainLayout";

import {
  searchUsers
} from "../services/postService";

function Search() {

  const [
    searchParams
  ] = useSearchParams();

  const query =
    searchParams.get("q");

  const [
    users,
    setUsers
  ] = useState([]);

  useEffect(() => {

    async function loadResults() {

      if (!query)
        return;

      try {

        const data =
          await searchUsers(
            query
          );

        setUsers(
          data
        );

      } catch (error) {

        console.error(
          error
        );

      }

    }

    loadResults();

  }, [query]);

  return (

    <MainLayout>

      <div className="search-page">

        <h1>

          Search Results

        </h1>

        <p>

          Results for "{query}"

        </p>

        <div className="search-results-page">

          {
            users.length > 0 ? (

              users.map(
                (user) => (

                  <Link
                    key={user.id}
                    to={`/profile/${user.id}`}
                    className="search-user-card"
                  >

                    <div className="avatar">

                      {user.name?.charAt(0)}

                    </div>

                    <div>

                      <h3>
                        {user.name}
                      </h3>

                      <p>
                        {user.faculty}
                      </p>

                    </div>

                  </Link>

                )
              )

            ) : (

              <p>

                No users found.

              </p>

            )
          }

        </div>

      </div>

    </MainLayout>

  );

}

export default Search;