const CREST = "/brand/sports/crests";

const FILES: Record<string, string> = {
  "ac milan": `${CREST}/ac-milan.webp`,
  milan: `${CREST}/ac-milan.webp`,
  "inter milan": `${CREST}/inter-milan.webp`,
  inter: `${CREST}/inter-milan.webp`,
  juventus: `${CREST}/juventus.webp`,
  napoli: `${CREST}/napoli.webp`,
  roma: `${CREST}/roma.webp`,
  lazio: `${CREST}/lazio.webp`,
  atalanta: `${CREST}/atalanta.webp`,
  fiorentina: `${CREST}/fiorentina.webp`,
  bologna: `${CREST}/bologna.webp`,
  torino: `${CREST}/torino.webp`,
  genoa: `${CREST}/genoa.webp`,
  udinese: `${CREST}/udinese.webp`,
  cagliari: `${CREST}/cagliari.webp`,
  lecce: `${CREST}/lecce.webp`,
  parma: `${CREST}/parma.webp`,
  como: `${CREST}/como-1907.webp`,
  "como 1907": `${CREST}/como-1907.webp`,
  sassuolo: `${CREST}/sassuolo.webp`,
  venezia: `${CREST}/venezia-fc.webp`,
  monza: `${CREST}/ac-monza.webp`,
  arsenal: `${CREST}/arsenal.webp`,
  chelsea: `${CREST}/chelsea.webp`,
  liverpool: `${CREST}/liverpool-fc.webp`,
  "liverpool fc": `${CREST}/liverpool-fc.webp`,
  "manchester city": `${CREST}/manchester-city.webp`,
  "man city": `${CREST}/manchester-city.webp`,
  "manchester united": `${CREST}/manchester-united.webp`,
  "man united": `${CREST}/manchester-united.webp`,
  tottenham: `${CREST}/tottenham-hotspur.webp`,
  "tottenham hotspur": `${CREST}/tottenham-hotspur.webp`,
  "newcastle united": `${CREST}/newcastle-united.webp`,
  newcastle: `${CREST}/newcastle-united.webp`,
  "aston villa": `${CREST}/aston-villa.webp`,
  everton: `${CREST}/everton.webp`,
  fulham: `${CREST}/fulham.webp`,
  brentford: `${CREST}/brentford.webp`,
  brighton: `${CREST}/brighton-and-hove-albion.webp`,
  "crystal palace": `${CREST}/crystal-palace.webp`,
  bournemouth: `${CREST}/afc-bournemouth.webp`,
  "real madrid": `${CREST}/real-madrid.webp`,
  barcelona: `${CREST}/fc-barcelona.webp`,
  "fc barcelona": `${CREST}/fc-barcelona.webp`,
  "atletico madrid": `${CREST}/real-madrid.webp`,
  sevilla: `${CREST}/sevilla-fc.webp`,
  "real sociedad": `${CREST}/real-sociedad.webp`,
  "real betis": `${CREST}/real-betis-balompie.webp`,
  villarreal: `${CREST}/villarreal-cf.webp`,
  "celta vigo": `${CREST}/celta-vigo.webp`,
  "bayern munich": `${CREST}/bayern-munich.webp`,
  bayern: `${CREST}/bayern-munich.webp`,
  "borussia dortmund": `${CREST}/borussia-dortmund.webp`,
  dortmund: `${CREST}/borussia-dortmund.webp`,
  "bayer leverkusen": `${CREST}/bayer-leverkusen.webp`,
  "rb leipzig": `${CREST}/rb-leipzig.webp`,
  stuttgart: `${CREST}/vfb-stuttgart.webp`,
  "paris saint-germain": `${CREST}/paris-saint-germain-psg.webp`,
  psg: `${CREST}/paris-saint-germain-psg.webp`,
  ajax: `${CREST}/ajax.webp`,
  "psv eindhoven": `${CREST}/psv-eindhoven.webp`,
  psv: `${CREST}/psv-eindhoven.webp`,
  feyenoord: `${CREST}/feyenoord.webp`,
  porto: `${CREST}/fc-porto.webp`,
  "fc porto": `${CREST}/fc-porto.webp`,
  "sporting cp": `${CREST}/sporting-cp.webp`,
  sporting: `${CREST}/sporting-cp.webp`,
  galatasaray: `${CREST}/galatasaray.webp`,
  "shakhtar donetsk": `${CREST}/shakhtar-donetsk.webp`,
  "club brugge": `${CREST}/club-brugge.webp`,
  lille: `${CREST}/losc-lille.webp`,
};

const LEAGUES: Record<string, string> = {
  "serie a": `${CREST}/serie-a-italy.svg`,
  "premier league": `${CREST}/premier-league-england.webp`,
  "la liga": `${CREST}/laliga-spain.webp`,
  bundesliga: `${CREST}/bundesliga-germany.webp`,
  "champions league": `${CREST}/uefa-champions-league.svg`,
  "uefa champions league": `${CREST}/uefa-champions-league.svg`,
};

function key(name: string) {
  return name.trim().toLowerCase();
}

export function clubCrest(name: string): string | undefined {
  return FILES[key(name)];
}

export function leagueCrest(name: string): string | undefined {
  return LEAGUES[key(name)];
}
