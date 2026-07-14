import './style.css';

const TBA_BASE = 'https://www.thebluealliance.com/api/v3';
const TBA_KEY = import.meta.env.VITE_XTBAAUTHKEY;

async function tbaFetch(endpoint) {
  const res = await fetch(`${TBA_BASE}${endpoint}`, {
    headers: { 'X-TBA-Auth-Key': TBA_KEY },
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

const teamTitle = document.getElementById('team-title');
const teamInfo = document.getElementById('team-info');
const mediaGallery = document.getElementById('media-gallery');

const urlParams = new URLSearchParams(window.location.search);
const teamKey = urlParams.get('team');

if (!teamKey) {
  teamTitle.textContent = 'No team specified.';
  mediaGallery.innerHTML = '<div class="media-empty">No team key provided in the URL.</div>';
} else {
  loadDetailPage();
}

async function loadDetailPage() {
  try {
    const currentYear = 2026;
    const [teamData, mediaData] = await Promise.all([
      tbaFetch(`/team/${teamKey}`),
      tbaFetch(`/team/${teamKey}/media/${currentYear}`),
    ]);

    document.title = `${teamData.team_number} - ${teamData.nickname || 'FRC Team'}`;
    teamTitle.innerHTML = `Team ${teamData.team_number} <span class="team-number">${teamData.nickname || ''}</span>`;

    const metaParts = [];
    metaParts.push(`<span>${teamData.city}, ${teamData.state_prov}, ${teamData.country}</span>`);
    metaParts.push(`<span class="meta-divider">|</span>`);
    metaParts.push(`<span>Sponsors: ${teamData.name.replaceAll('/', ', ')}</span>`);
    if (teamData.website) {
      metaParts.push(`<span class="meta-divider">|</span>`);
      metaParts.push(`<span>🌐 <a href="${teamData.website}" target="_blank" style="color:var(--link)">${teamData.website}</a></span>`);
    }
    teamInfo.innerHTML = metaParts.join('');

    displayMedia(mediaData);
  } catch (err) {
    teamTitle.textContent = 'Error loading data';
    teamInfo.innerHTML = `<span style="color:var(--error-text)">${err.message}</span>`;
    mediaGallery.innerHTML = '';
  }
}

function displayMedia(mediaList) {
  mediaGallery.innerHTML = '';

  const supportedTypes = ['imgur', 'avatar', 'image'];
  const images = mediaList.filter(m => supportedTypes.includes(m.type));

  if (!images.length) {
    mediaGallery.innerHTML = '<div class="media-empty">No robot media found for this team for the selected year.</div>';
    return;
  }

  images.forEach(media => {
    let src = '';
    if (media.direct_url) {
      src = media.direct_url;
    } else if (media.details?.thumbnail_url) {
      src = media.details.thumbnail_url;
    } else if (media.view_url) {
      src = media.view_url;
    }

    if (!src) return;

    const img = document.createElement('img');
    img.src = src;
    img.alt = `Robot media for team ${teamKey?.replace('frc', '') || 'unknown'}`;
    img.loading = 'lazy';
    img.onerror = () => img.remove();
    mediaGallery.appendChild(img);
  });
}
