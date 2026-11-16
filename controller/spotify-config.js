/* SpotifyNinja configuration.
   clientId is your Spotify app's Client ID from https://developer.spotify.com/dashboard.
   A Client ID is public (it is sent to Spotify in the login URL), so it is safe to commit.
   NEVER put a client secret here or anywhere in GoldenSunDJ: the PKCE login flow does not use one.
   Leave it empty and visitors (or you) can paste a Client ID in the Spotify tab instead; that copy is kept in this browser only. */
window.GSDJ_SPOTIFY = { clientId: "" };
