(() => {
  // Get the current URL
  const currentUrl = window.location.href;

  // Initialize an array to store the movies
  const movies = [];

  // Utility function to extract movie data
  const extractMovies = (listItems, titleSelector, linkSelector) => {
    listItems.forEach((item) => {
      // Extract the movie title
      const titleElement = item.querySelector(titleSelector);
      const movieTitle = titleElement ? titleElement.textContent.trim() : null;

      // Extract the movie ID from the href attribute
      const linkElement = item.querySelector(linkSelector);
      const movieHref = linkElement ? linkElement.getAttribute('href') : null;
      const movieIdMatch = movieHref ? movieHref.match(/\/title\/(tt\d+)\//) : null;
      const movieId = movieIdMatch ? movieIdMatch[1] : null;

      // If both title and ID are found, add them to the movies array
      if (movieTitle && movieId) {
        movies.push({ name: movieTitle, id: movieId });
      }
    });
  };

  // Check if the URL matches the IMDb Top 250 page
  if (currentUrl.includes('/chart/top/')) {
    // Select all list items containing movie information for the Top 250 page
    const movieListItems = document.querySelectorAll('li.ipc-metadata-list-summary-item');
    extractMovies(movieListItems, 'h3.ipc-title__text', 'a.ipc-lockup-overlay');
  }
  // Check if the URL matches an actor's page
  else if (currentUrl.includes('/name/')) {
    // Select all list items containing movie information for an actor's page
    const movieListItems = document.querySelectorAll('li.ipc-metadata-list-summary-item');
    extractMovies(movieListItems, 'a.ipc-metadata-list-summary-item__t', 'a.ipc-metadata-list-summary-item__t');
  }

  // Output the result as JSON
  console.log(JSON.stringify(movies, null, 2));
})();
