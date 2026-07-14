// vite is so confusing, so ig importing style goes here 
import './style.css';

//api key stuff, TBA requires that data be fetched from this url and the key
const TBA_BASE = 'https://www.thebluealliance.com/api/v3';
const TBA_KEY = import.meta.env.VITE_XTBAAUTHKEY;

//Quick nullcheck to make sure there is an api key
if (!TBA_KEY) {
  document.getElementById('app').innerHTML = '<p style="color:#f66;padding:2rem">NO API KEY IN .ENV</p>';
  console.error("No api key")
  throw new Error('Missing XTBAAUTHKEY');
}

//get page elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsEl = document.getElementById('results');
const statusEl = document.getElementById('status');

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.className = isError ? 'error' : 'info';
}

// get info
async function tbaFetch(endpoint) {
  const res = await fetch(`${TBA_BASE}${endpoint}`, {
    headers: { 'X-TBA-Auth-Key': TBA_KEY },
  });
  if (!res.ok) {
    const msg = res.status === 401
      ? 'Invalid API key'
      : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return res.json();
}

// put team and basic info(sometimes sponsors part bugs out)
function renderTeam(team) {
  const card = document.createElement('div');
  card.className = 'team-card';
  card.innerHTML = `
    <h3>Team ${team.team_number}${team.nickname ? ` - ${team.nickname}` : ''}</h3>
    ${team.website ? `<p><strong>Website:</strong> <a href="${team.website}" target="_blank">${team.website}</a></p>` : ''}
    <div class="detail-btn-wrapper">
      <a href="detail.html?team=frc${team.team_number}" class="detail-btn">View Details & Media</a>
    </div>
  `;
  return card;
}

// used if there are errors
function renderError(msg) {
  resultsEl.innerHTML = `<div class="error-card">${msg}</div>`;
}

// if you search a team that doesnt exist
function renderResults(teams) {
  resultsEl.innerHTML = '';
  if (teams.length === 0) {
    resultsEl.innerHTML = '<div class="info-card">No teams found</div>';
    return;
  }
  teams.forEach(t => resultsEl.appendChild(renderTeam(t)));
}

function isNumeric(str) {
  return /^\d{1,5}$/.test(str.trim());
}

// search for a team based on their number (team 2658 are goated =D)
async function searchByNumber(num) {
  const data = await tbaFetch(`/team/frc${num}`);
  return [data];
}

async function fetchPage(page) {
  return tbaFetch(`/teams/${page}/simple`);
}

// Search for a team based on their team name
async function searchByName(query) {
  const q = query.toLowerCase();
  const allMatches = [];
  const BATCH = 10;
  const MAX_PAGES = 200;

  for (let start = 0; start < MAX_PAGES; start += BATCH) {
    const pages = Array.from({ length: BATCH }, (_, i) => start + i);
    const results = await Promise.all(pages.map(p => fetchPage(p)));

    for (const teams of results) {
      if (teams.length === 0) {
        setStatus(`Found ${allMatches.length} team(s)`);
        return allMatches.length > 50 ? allMatches.slice(0, 50) : allMatches;
      }
      const matches = teams.filter(t =>
        (t.nickname && t.nickname.toLowerCase().includes(q)) ||
        (t.city && t.city.toLowerCase().includes(q)) ||
        (t.state_prov && t.state_prov.toLowerCase().includes(q)) ||
        t.name.toLowerCase().includes(q)
      );
      allMatches.push(...matches);
    }

    setStatus(`Searched ${(start + BATCH) * 20} teams... found ${allMatches.length} match(es)`);

    if (allMatches.length >= 50) break;
  }

  return allMatches.length > 50 ? allMatches.slice(0, 50) : allMatches;
}

// search handler, calls functions for searching by name or team number
async function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) return;

  resultsEl.innerHTML = '';
  searchBtn.disabled = true;

  try {
    let teams;
    if (isNumeric(query)) {
      setStatus(`Fetching team ${query}...`);
      teams = await searchByNumber(query);
    } else {
      teams = await searchByName(query);
    }
    setStatus(`Found ${teams.length} team(s)`);
    renderResults(teams);
  } catch (err) {
    setStatus(err.message, true);
    renderError(err.message);
  } finally {
    searchBtn.disabled = false;
  }
}

// search handler stuff so you dont have to click the button each time
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleSearch();
});
