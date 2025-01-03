  // Replace this with your actual IMDb JSON
  const movies = [];

  const apiToken = ""; // Replace with your actual API token
  const baseUrl = "https://utp.to/api/torrents/filter";

(async () => {
  const delay = 5000; // Wait time between requests in milliseconds
  const collectedIds = []; // To store the collected torrent IDs

  // Helper function to wait for a specified amount of time
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  // Total number of movies to process
  const totalMovies = movies.length;

  // Loop through each movie and make an API call
  for (let index = 0; index < totalMovies; index++) {
    const movie = movies[index];
    const imdbId = movie.id.replace("tt", ""); // Convert IMDb ID to numeric format
    const url = `${baseUrl}?api_token=${apiToken}&imdbId=${imdbId}`;

    try {
      // Fetch data from the API
      const response = await fetch(url);
      const data = await response.json();

      // Define the priority order for matching torrents
      const priorities = [
        { type: "Remux", resolution: "1080p", key: "remux1080" },
        { type: "Remux", resolution: "2160p", key: "remux2160" },
        { type: "WEB-DL", resolution: "2160p", key: "webdl2160" },
        { type: "WEB-DL", resolution: "1080p", key: "webdl1080" },
        { type: "WEB-DL", resolution: "any", key: "webdlany" },
        { type: "Encode", resolution: "2160p", key: "encode2160" },
        { type: "Encode", resolution: "1080p", key: "encode1080" },
      ];

      // Initialize fields for the movie
      movie.torrentId = null;
      movie.notInQuality = false;

      // Loop through the priorities to find the first matching torrent
      for (const priority of priorities) {
        const matchingTorrent = data.data.find((torrent) => {
          const matchesType = torrent.attributes.type === priority.type;
          const matchesResolution =
            priority.resolution === "any" ||
            torrent.attributes.resolution === priority.resolution;
          return matchesType && matchesResolution;
        });

        if (matchingTorrent) {
          movie[priority.key] = matchingTorrent.id;
          if (!movie.torrentId) {
            movie.torrentId = matchingTorrent.id; // Populate torrentId with the first match
          }
        } else {
          movie[priority.key] = null;
        }
      }

      // If no matches were found for any combination, set notInQuality to true
      if (!movie.torrentId) {
        movie.notInQuality = true;
      }
    } catch (error) {
      console.error(`Error fetching data for IMDb ID ${imdbId}:`, error);
      movie.torrentId = null; // Handle error by setting torrentId to null
      movie.notInQuality = true;
    }

    // Display progress in the console
    console.log(`Processed ${index + 1} of ${totalMovies} movies (${((index + 1) / totalMovies * 100).toFixed(2)}%).`);

    // Wait for 5 seconds before making the next request
    await wait(delay);
  }

  // Output the collected IDs as a comma-separated string in the console
  console.log("Collected Torrent IDs:", collectedIds.join(","));

  // Create a downloadable JSON file with the updated movies
  const updatedJson = JSON.stringify(movies, null, 2);
  console.log(updatedJson);
  const blob = new Blob([updatedJson], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "updated_movies.json";
  a.click();
  URL.revokeObjectURL(url);
})();
