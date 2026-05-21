const profileSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="820" viewBox="0 0 1280 820">
  <rect width="1280" height="820" fill="#f8fafc"/>
  <rect x="70" y="70" width="1140" height="680" rx="28" fill="#ffffff" stroke="#d7dee8" stroke-width="4"/>
  <text x="112" y="144" font-family="Arial, sans-serif" font-size="44" font-weight="700" fill="#102033">Synthetic team profile</text>
  <text x="112" y="190" font-family="Arial, sans-serif" font-size="24" fill="#5b677a">Fake people, fake labels, generated only for redaction demos</text>
  <g transform="translate(125 250)">
    <circle cx="130" cy="90" r="70" fill="#f5c6a5"/>
    <path d="M55 78c18-65 127-78 150 0-24-18-58-18-75-4-28-15-50-9-75 4z" fill="#20242f"/>
    <circle cx="108" cy="92" r="8" fill="#20242f"/><circle cx="154" cy="92" r="8" fill="#20242f"/>
    <path d="M103 126c32 19 62 18 83-2" stroke="#a94d3a" stroke-width="8" fill="none" stroke-linecap="round"/>
    <rect x="30" y="205" width="200" height="34" rx="8" fill="#e0f2fe"/>
    <text x="60" y="229" font-family="Arial, sans-serif" font-size="22" fill="#0f172a">Name: Person A</text>
  </g>
  <g transform="translate(510 250)">
    <circle cx="130" cy="90" r="70" fill="#c6d7f2"/>
    <path d="M61 78c10-45 55-76 101-61 34 11 58 39 65 72-38-20-72-21-104-5-25-12-45-14-62-6z" fill="#4b5563"/>
    <circle cx="108" cy="95" r="8" fill="#111827"/><circle cx="154" cy="95" r="8" fill="#111827"/>
    <path d="M103 126c29 14 55 14 79 0" stroke="#4f46e5" stroke-width="8" fill="none" stroke-linecap="round"/>
    <rect x="30" y="205" width="220" height="34" rx="8" fill="#dcfce7"/>
    <text x="52" y="229" font-family="Arial, sans-serif" font-size="22" fill="#0f172a">Role: Reviewer</text>
  </g>
  <g transform="translate(885 250)">
    <circle cx="130" cy="90" r="70" fill="#f7d2df"/>
    <path d="M62 88c2-72 128-89 146-12-42-13-79-9-109 11-13-6-25-6-37 1z" fill="#6b4423"/>
    <circle cx="108" cy="95" r="8" fill="#111827"/><circle cx="154" cy="95" r="8" fill="#111827"/>
    <path d="M106 130c26 13 52 13 74-1" stroke="#be123c" stroke-width="8" fill="none" stroke-linecap="round"/>
    <rect x="16" y="205" width="240" height="34" rx="8" fill="#fef3c7"/>
    <text x="38" y="229" font-family="Arial, sans-serif" font-size="22" fill="#0f172a">Badge: SAMPLE-427A</text>
  </g>
</svg>`

const screenshotSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="820" viewBox="0 0 1280 820">
  <rect width="1280" height="820" fill="#eef2f7"/>
  <rect x="64" y="64" width="1152" height="692" rx="24" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
  <rect x="64" y="64" width="1152" height="90" rx="24" fill="#102033"/>
  <text x="104" y="121" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff">Project access review</text>
  <text x="104" y="210" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#102033">Private fields to redact before sharing</text>
  <g font-family="Arial, sans-serif" font-size="25" fill="#102033">
    <text x="104" y="280">Name: Alex Example</text>
    <text x="104" y="336">Contact: alex [at] example [dot] org</text>
    <text x="104" y="392">Account: SAMPLE-USER-0187</text>
    <text x="104" y="448">Folder: public-demo/redaction-fixture</text>
  </g>
  <rect x="680" y="238" width="430" height="268" rx="18" fill="#f8fafc" stroke="#cbd5e1"/>
  <text x="710" y="292" font-family="Arial, sans-serif" font-size="24" fill="#475569">Screenshot-like fixture</text>
  <text x="710" y="350" font-family="Arial, sans-serif" font-size="22" fill="#475569">Mask names, contacts, IDs,</text>
  <text x="710" y="390" font-family="Arial, sans-serif" font-size="22" fill="#475569">and other private regions.</text>
  <rect x="104" y="560" width="1006" height="78" rx="14" fill="#ecfeff" stroke="#67e8f9"/>
  <text x="132" y="610" font-family="Arial, sans-serif" font-size="25" fill="#155e75">All text here is synthetic. Review exported images manually.</text>
</svg>`

export function sampleFiles() {
  return [
    new File([profileSvg], 'synthetic-profile-card.svg', { type: 'image/svg+xml' }),
    new File([screenshotSvg], 'synthetic-private-screenshot.svg', { type: 'image/svg+xml' }),
  ]
}
