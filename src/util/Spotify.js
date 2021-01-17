import { SearchBar } from '../Components/SearchBar/SearchBar';

let accessToken;
const clientId = '';
const spotifyAuthorizeUrl = 'https://accounts.spotify.com/authorize';
const redirectUri = 'http://localhost:3000/';
const Spotify = {
  getAccessToken() {
    if (accessToken) {
      return accessToken;
    }

    const accessTokenMatch = window.location.href.match(
      /access_token=([^&]*)/,
    );
    const expiresInMatch = window.location.href.match(
      /expires_in=([^&]*)/,
    );

    if (accessTokenMatch && expiresInMatch) {
      accessToken = accessTokenMatch[1];
      const expiresIn = Number(expiresInMatch[1]);
      window.setTimeout(
        () => (accessTokenMatch = ''),
        expiresIn * 1000,
      );
      window.history.pushState('Access Token', null, '/');
      return accessToken;
    } else {
      window.location = `${spotifyAuthorizeUrl}?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
    }
  },
  search(term) {
    const accessToken = Spotify.getAccessToken();
    return fetch(
      `https://api.spotify.com/v1/search?type=track&q=${term}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )
      .then((response) => {
        return response.json();
      })
      .then((jsonResponse) => {
        if (!jsonResponse.tracks) {
          return [];
        }
        return jsonResponse.tracks.items.map((track) => {
          return {
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            album: track.album.name,
            uri: track.uri,
          };
        });
      });
  },
  savePlaylist(playlistName, trackUris) {
    if (!playlistName && !trackUris) {
      return;
    }
    const accessToken = Spotify.getAccessToken();
    const headers = { Authorization: `Bearer ${accessToken}` };
    let userId;

    return fetch(`https://api.spotify.com/v1/me`, {
      headers: headers,
    })
      .then((response) => {
        return response.json();
      })
      .then((jsonResponse) => {
        userId = jsonResponse.id;
        return fetch(
          `https://api.spotify.com/v1/users/${userId}/playlists`,
          {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ name: playlistName }),
          },
        )
          .then((response) => {
            return response.json();
          })
          .then((jsonResponse) => {
            const playlistID = jsonResponse.id;
            return fetch(
              `https://api.spotify.com/v1/playlists/${playlistID}/tracks`,
              {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ uris: trackUris }),
              },
            );
          });
      });
  },
};

export default Spotify;
