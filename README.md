# Frontend

A static, no-build site (plain HTML/CSS/JS) — deploy this whole folder as-is.

`api-config.js` sets `window.CEE_API_URL`, which `quiz.js` uses to talk to the
backend. After you deploy the backend on Render, update the URL inside
`api-config.js` to your Render URL, e.g.:

```js
window.CEE_API_URL = 'https://cee-saturday-api.onrender.com/api';
```

Then redeploy the frontend (push to Git — Vercel redeploys automatically).
