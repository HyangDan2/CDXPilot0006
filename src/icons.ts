const shapes = [
  '<path d="M15 17Q10 25 23 37Q26 40 29 37Q42 24 36 17Z" fill="#e87f8e"/><path d="m26 18-9-7 9 3 3-8 3 8 8-1-8 6" fill="#7a9e7e"/><path d="m20 23 1 2m9-3 1 2m-6 6 1 2m9-7 1 2" stroke="#fff4d3" stroke-width="2.5"/>',
  '<path d="M15 18h23l-3 18H18Z" fill="#d7a66b"/><ellipse cx="26.5" cy="18" rx="11.5" ry="5" fill="#855b4c"/><path d="M20 17q7-3 13 0" stroke="#f6d29d" fill="none"/>',
  '<path d="M13 22h24v12q0 7-12 7t-12-7Z" fill="#bdcbc7"/><path d="M37 24h3q8 9-3 10" stroke="#91aba3" stroke-width="3" fill="none"/><path d="M20 9q-4 4 0 8m8-9q-4 4 0 8" stroke="#b9afa7" stroke-width="2" fill="none"/>',
  '<ellipse cx="26" cy="25" rx="15" ry="10" fill="#c4a6d6"/><path d="M12 24q14-5 28 0v6q-14 7-28 0Z" fill="#f9e8dc"/><path d="M11 24q15 5 30 0" stroke="#a886bc" fill="none"/>',
  '<path d="M12 32 19 15l20 18Z" fill="#f3cd9a"/><path d="m12 32 27 1v7H12Z" fill="#d38c91"/><path d="m15 27 22 2" stroke="#fff4e2" stroke-width="4"/><circle cx="22" cy="13" r="5" fill="#dd7f87"/>',
  '<path d="M14 28q-7-4-1-11 2-6 7-4 6-6 10 0 7-2 9 4 5 8-3 11Z" fill="#f5e2cd"/><path d="m15 27 4 13h15l4-13Z" fill="#b9b0d2"/><path d="m23 30 1 7m6-7-1 7" stroke="#f7f0e8" stroke-width="2"/>',
  '<circle cx="26" cy="26" r="16" fill="#d5a574"/><path d="M13 21q2-11 13-10t14 13q-4 4-7-1-4 6-7 0-4 6-8 0-3 4-5-2" fill="#e5acbc"/><circle cx="26" cy="26" r="5" fill="#faf6f1"/>',
  '<path d="m17 22 9 20 10-20" fill="#d7ad7f"/><path d="m20 25 10 10m-7-9 10 5" stroke="#b78860"/><circle cx="20" cy="18" r="8" fill="#ddadc1"/><circle cx="31" cy="18" r="8" fill="#c2b1d9"/>',
  '<circle cx="20" cy="31" r="9" fill="#d97884"/><circle cx="34" cy="29" r="9" fill="#e08d95"/><path d="M20 23 25 9l9 12M25 9q10-3 12 3-7 3-12-3" stroke="#789779" stroke-width="2" fill="#95b39a"/>',
  '<path d="M16 17h20l-3 23H19Z" fill="#b5c8ad"/><path d="M16 17q10-5 20 0" stroke="#faf1dc" stroke-width="5"/><path d="m29 18 4-12" stroke="#957b68" stroke-width="3"/>',
  '<path d="M10 28q0-9 9-9l5 8 5-8q12 0 13 11l-8 6-6-6-5 8-7-4Z" fill="#d6a26d"/><path d="m18 22 4 12m10-11-4 9" stroke="#b77c51" stroke-width="2"/>',
  '<path d="M15 14h23v24H15Z" fill="#98705e"/><path d="M15 22h23m-23 8h23M26 14v24" stroke="#c79d84" stroke-width="2"/>',
  '<rect x="12" y="10" width="29" height="32" rx="5" fill="#dab275"/><path d="M19 12v28m8-28v28m8-28v28M14 19h25M14 27h25M14 35h25" stroke="#a97a43" stroke-width="3"/><rect x="21" y="17" width="11" height="10" rx="2" fill="#ffe68a"/>',
  '<rect x="23" y="32" width="7" height="14" rx="3" fill="#cba77a"/><path d="M14 30V18a12 12 0 0124 0v12q-12 6-24 0" fill="#e1a6c5"/><path d="M14 22h24v10q-12 6-24 0" fill="#bd899f"/><path d="M20 13v12" stroke="#fff0e3" stroke-width="3" stroke-linecap="round"/>',
  '<path d="M26 19C10 0 0 25 18 37c15 12 28-12 15-20-9-5-16 21-3 22 18 1 22-29 8-29-5 0-10 5-12 9Z" fill="none" stroke="#bb824c" stroke-width="7"/><path d="m14 19 2 2m20-4 2 2m-15 13 2 2" stroke="#fff4dd" stroke-width="3"/>',
  '<rect x="14" y="16" width="25" height="26" rx="6" fill="#b76e83"/><rect x="12" y="10" width="29" height="9" rx="3" fill="#b7c7b0"/><rect x="18" y="23" width="17" height="13" rx="2" fill="#fff4df"/><path d="M22 26q5-5 9 1l-5 7Z" fill="#d7788d"/>',
  '<path d="M11 23 20 10h21v25l-10 9H11Z" fill="#d3a576"/><path d="M11 23h20v21H11Z" fill="#fff0d5"/><path d="M24 27c-13-4-12 15-2 11 7-3 1-9-3-6" fill="none" stroke="#c38e9b" stroke-width="3"/>',
  '<path d="m10 29 4 12h26l3-12" fill="#caa56b"/><ellipse cx="26" cy="29" rx="17" ry="8" fill="#fff1d7"/><g fill="#8d8ab2"><circle cx="18" cy="25" r="6"/><circle cx="29" cy="20" r="6"/><circle cx="35" cy="28" r="6"/><circle cx="24" cy="30" r="6"/></g><path d="M26 15q1-8 9-7-1 7-9 7" fill="#8ba681"/>',
];
export const names = [
  "딸기",
  "푸딩",
  "차",
  "마카롱",
  "케이크",
  "컵케이크",
  "도넛",
  "아이스크림",
  "체리",
  "말차",
  "크루아상",
  "초콜릿",
  "와플",
  "아이스바",
  "프레첼",
  "딸기잼",
  "롤케이크",
  "블루베리 타르트",
];
export function icon(n: number) {
  return `<svg viewBox="0 0 52 52" aria-hidden="true">${shapes[(n - 1) % shapes.length]}</svg>`;
}
export const flower =
  '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 13C2-1-3 20 12 18 2 32 26 35 20 20 36 28 37 5 20 12 26-5 7-3 16 13" fill="currentColor"/><circle cx="16" cy="16" r="3" fill="#faf6f1"/></svg>';
