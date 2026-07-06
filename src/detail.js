import './style.css';

// api stuff
const TBA_BASE = 'https://www.thebluealliance.com/api/v3';
const TBA_KEY = import.meta.env.VITE_XTBAAUTHKEY;

async function tbaFetch(endpoint) {
  const res = await fetch(`${TBA_BASE}${endpoint}`, {
    headers: { 'X-TBA-Auth-Key': TBA_KEY },
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}


// fetch elements
const teamTitle = document.getElementById('team-title');
const teamInfo = document.getElementById('team-info');
const mediaGallery = document.getElementById('media-gallery');

const urlParams = new URLSearchParams(window.location.search);
const teamKey = urlParams.get('team')
console.log(urlParams.get('team').replace('frc', ''))

//nullcheck
if (!teamKey) {
  teamTitle.textContent = "No team specified.";
} else {
  loadDetailPage();
}

async function loadDetailPage() {
  try {
    // fetch images and stuff at the same time
    // this year
    const currentYear = 2026; 
    
    const [teamData, mediaData] = await Promise.all([
      tbaFetch(`/team/${teamKey}`),
      tbaFetch(`/team/${teamKey}/media/${currentYear}`)
    ]);

    // header info
    teamTitle.textContent = `Team ${teamData.team_number} - ${teamData.nickname || ''}`;
    teamInfo.innerHTML = `
      <p><strong>Sponsors:</strong> ${teamData.name.replaceAll('/', ', ')}</p>
      <p><strong>Location:</strong> ${teamData.city}, ${teamData.state_prov}, ${teamData.country}</p>
      ${teamData.website ? `<p><strong>Website:</strong> <a href="${teamData.website}" target="_blank">${teamData.website}</a></p>` : ''}
    `;

    // media
    displayMedia(mediaData);

  } catch (err) {
    teamTitle.textContent = "Error loading data";
    teamInfo.innerHTML = `<p style="color: red;">${err.message}</p>`;
  }
}

function displayMedia(mediaList) {
  mediaGallery.innerHTML = "";

  const supportedTypes = ["imgur", "avatar", "image"];

  const images = mediaList.filter(m =>
    supportedTypes.includes(m.type)
  );

  if (!images.length) {
    mediaGallery.innerHTML =
      "<p>No robot media found for this team for the selected year.</p>";
    return;
  }

  images.forEach(media => {
    let src = "";

    // check for directurl, if available use that for src part
    if (media.direct_url) {
      src = media.direct_url;
    }
    // fallback
    else if (media.details?.thumbnail_url) {
      src = media.details.thumbnail_url;
    }
    else if (media.view_url) {
      src = media.view_url;
    }

    // Skip media with no usable image URL
    if (!src) return;

    const img = document.createElement("img");

    img.src = src;
    img.width = 355;
    img.height = 355;
    img.loading = "lazy";
    img.style.objectFit = "cover";
    img.style.borderRadius = "8px";
    img.style.border = "1px solid #ccc";

    img.onerror = () => img.remove();

    mediaGallery.appendChild(img);
  });
}


const teamData = await tbaFetch(`/team/${teamKey}`);
document.title = teamData.nickname;