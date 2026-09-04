# CEE Saturday Frontend

Static responsive frontend for the CEE Saturday API.

## Run

Use a local static server (do not open the HTML files directly with `file://`):

```bash
python3 -m http.server 5500
```

Then visit `http://localhost:5500`. Set the deployed backend URL in `api-config.js`, or replace the default URL there.

The frontend includes working login/register/logout, profile editing, practice progress, dynamic tests/repeated questions, online-student count, an automatically synced MEC notice section, responsive navigation, and a dismissible sticky announcement banner.
