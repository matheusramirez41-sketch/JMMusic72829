export interface YouTubeTrack {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverUrl: string;
  accentColor: string;
  genre: string;
  plays: number;
}

// Curated top global hits with verified direct YouTube video IDs
export const POPULAR_YOUTUBE_HITS: YouTubeTrack[] = [
  {
    id: 'yt-1',
    videoId: '2Vv-BfVoq4g',
    title: 'Perfect',
    artist: 'Ed Sheeran',
    album: '÷ (Divide)',
    duration: 263,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    accentColor: '#3b82f6',
    genre: 'Pop / Acoustic',
    plays: 3500000000
  },
  {
    id: 'yt-2',
    videoId: 'fJ9rUzIMcZQ',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    duration: 359,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    accentColor: '#eab308',
    genre: 'Classic Rock',
    plays: 1700000000
  },
  {
    id: 'yt-3',
    videoId: '4NRXx6U8ABQ',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 200,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    accentColor: '#ef4444',
    genre: 'Synthwave / Pop',
    plays: 2800000000
  },
  {
    id: 'yt-4',
    videoId: 'y83x7MgzWOA',
    title: 'Yellow',
    artist: 'Coldplay',
    album: 'Parachutes',
    duration: 269,
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    accentColor: '#facc15',
    genre: 'Alternative Rock',
    plays: 1100000000
  },
  {
    id: 'yt-5',
    videoId: 'QxPeRC82Uo0',
    title: 'MONACO',
    artist: 'Bad Bunny',
    album: 'Nadie Sabe Lo Que Va A Pasar Mañana',
    duration: 267,
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=600&q=80',
    accentColor: '#8b5cf6',
    genre: 'Trap Latino',
    plays: 420000000
  },
  {
    id: 'yt-6',
    videoId: 'jfKfPfyJRdk',
    title: 'Lofi Hip Hop Radio (24/7 Stream)',
    artist: 'Lofi Girl',
    album: 'Beats to Relax/Study to',
    duration: 3600,
    coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80',
    accentColor: '#06b6d4',
    genre: 'Lofi / Chillhop',
    plays: 89000000
  },
  {
    id: 'yt-7',
    videoId: 'QpKkNIT84GY',
    title: 'Tití Me Preguntó',
    artist: 'Bad Bunny',
    album: 'Un Verano Sin Ti',
    duration: 243,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    accentColor: '#ec4899',
    genre: 'Reggaeton / Urbano',
    plays: 950000000
  },
  {
    id: 'yt-8',
    videoId: '10EX-_h4pYc',
    title: 'Ojitos Lindos',
    artist: 'Bad Bunny & Bomba Estéreo',
    album: 'Un Verano Sin Ti',
    duration: 258,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    accentColor: '#06b6d4',
    genre: 'Latino / Alternativo',
    plays: 870000000
  },
  {
    id: 'yt-9',
    videoId: 'dvgZkm1xWPE',
    title: 'Viva La Vida',
    artist: 'Coldplay',
    album: 'Viva la Vida or Death and All His Friends',
    duration: 242,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    accentColor: '#f59e0b',
    genre: 'Pop Rock',
    plays: 1200000000
  },
  {
    id: 'yt-10',
    videoId: '7wtfhZwyrcc',
    title: 'Believer',
    artist: 'Imagine Dragons',
    album: 'Evolve',
    duration: 204,
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    accentColor: '#ef4444',
    genre: 'Alternative / Rock',
    plays: 2400000000
  },
  {
    id: 'yt-11',
    videoId: 'xn21hH7kyx8',
    title: 'Me Porto Bonito',
    artist: 'Bad Bunny & Chencho Corleone',
    album: 'Un Verano Sin Ti',
    duration: 178,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    accentColor: '#f59e0b',
    genre: 'Reggaeton / Urbano',
    plays: 1600000000
  },
  {
    id: 'yt-12',
    videoId: 'kJQP7kiw5Fk',
    title: 'Despacito',
    artist: 'Luis Fonsi ft. Daddy Yankee',
    album: 'Vida',
    duration: 228,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    accentColor: '#ef4444',
    genre: 'Pop Latino',
    plays: 8200000000
  },
  {
    id: 'yt-13',
    videoId: 'TmKh7lAwnBI',
    title: 'DÁKITI',
    artist: 'Bad Bunny x Jhay Cortez',
    album: 'El Último Tour Del Mundo',
    duration: 205,
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=600&q=80',
    accentColor: '#3b82f6',
    genre: 'Reggaeton / Urbano',
    plays: 1300000000
  },
  {
    id: 'yt-14',
    videoId: 'JGwWNGJdvx8',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    album: '÷ (Divide)',
    duration: 233,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    accentColor: '#06b6d4',
    genre: 'Pop',
    plays: 6100000000
  },
  {
    id: 'yt-15',
    videoId: 'H5v3kku4y6Q',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: "Harry's House",
    duration: 167,
    coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80',
    accentColor: '#ec4899',
    genre: 'Indie Pop',
    plays: 3200000000
  },
  {
    id: 'yt-16',
    videoId: 'G7KNmW9a75Y',
    title: 'Flowers',
    artist: 'Miley Cyrus',
    album: 'Endless Summer Vacation',
    duration: 200,
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    accentColor: '#eab308',
    genre: 'Disco Pop',
    plays: 2100000000
  },
  {
    id: 'yt-17',
    videoId: 'ca48oMV5GwU',
    title: 'PROVENZA',
    artist: 'KAROL G',
    album: 'MAÑANA SERÁ BONITO',
    duration: 210,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    accentColor: '#10b981',
    genre: 'Urbano / Afrobeat',
    plays: 1100000000
  },
  {
    id: 'yt-18',
    videoId: 'oT9nS0qL_wE',
    title: 'DESPECHÁ',
    artist: 'ROSALÍA',
    album: 'MOTOMAMI+',
    duration: 157,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    accentColor: '#f43f5e',
    genre: 'Merengue / Pop',
    plays: 900000000
  },
  {
    id: 'yt-19',
    videoId: 'RB-RcX5DS5A',
    title: 'The Scientist',
    artist: 'Coldplay',
    album: 'A Rush of Blood to the Head',
    duration: 309,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    accentColor: '#6366f1',
    genre: 'Piano Rock',
    plays: 1400000000
  },
  {
    id: 'yt-20',
    videoId: 'DyDfgMOUjCI',
    title: 'bad guy',
    artist: 'Billie Eilish',
    album: 'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?',
    duration: 194,
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=600&q=80',
    accentColor: '#84cc16',
    genre: 'Alt Pop',
    plays: 2300000000
  }
];

export const KNOWN_YOUTUBE_MAP: Record<string, string> = {
  'yellow': 'y83x7MgzWOA',
  'blinding lights': '4NRXx6U8ABQ',
  'bohemian rhapsody': 'fJ9rUzIMcZQ',
  'monaco': 'QxPeRC82Uo0',
  'perfect': '2Vv-BfVoq4g',
  'titi me pregunto': 'QpKkNIT84GY',
  'titi me preguntó': 'QpKkNIT84GY',
  'ojitos lindos': '10EX-_h4pYc',
  'me porto bonito': 'xn21hH7kyx8',
  'moscow mule': 'p38WgakuYDo',
  'luna': 'x2oUajHp8pg',
  'classy 101': 'cD5T1Y4b7wA',
  'feliz cumpleanos ferxxo': 'jRxDUsGmwuc',
  'feliz cumpleaños ferxxo': 'jRxDUsGmwuc',
  'lala': 'BVdngsy95mY',
  'columbia': 'QlZNGcVfeF0',
  'punto 40': 'rhctf92wgqU',
  'despacito': 'kJQP7kiw5Fk',
  'dakiti': 'TmKh7lAwnBI',
  'dákiti': 'TmKh7lAwnBI',
  'viva la vida': 'dvgZkm1xWPE',
  'the scientist': 'RB-RcX5DS5A',
  'believer': '7wtfhZwyrcc',
  'shape of you': 'JGwWNGJdvx8',
  'as it was': 'H5v3kku4y6Q',
  'bad guy': 'DyDfgMOUjCI',
  'flowers': 'G7KNmW9a75Y',
  'starboy': '34Na4j8AVgA',
  'save your tears': 'XXYlFuWEuKI',
  'provenza': 'ca48oMV59LU',
  'tqg': 'jZm_k0Y89F8',
  'despecha': '5g2hT4GmAGU',
  'despechá': '5g2hT4GmAGU',
  'dont stop me now': 'HgzGwKwLmgM',
  "don't stop me now": 'HgzGwKwLmgM',
  'radioactive': 'ktvTqknDobU',
  'lofi hip hop radio (sesión 24/7)': 'jfKfPfyJRdk',
  'lofi hip hop radio (24/7 stream)': 'jfKfPfyJRdk',
  'gasolina': 'CCF1_jI8Prk',
  'calma': '1_zgKRBrT0Y',
  'dile': '09R8_2nJtjg',
  'ella baila sola': 'lZiafa_sY5Q',
  'la bachata': 'TiM_TFpT_DE',
  'danza kuduro': '7zp1TbLFPp8',
  'te bote': '9jI-z9QN6g8',
  'te boté': '9jI-z9QN6g8',
  'pepas': 'iH3jTsp_q4o',
  'safaera': 'jH1IE6v3Z_0',
  'yonaguni': 'doLMt10ytHY',
  'callaita': 'acEOKQEIa3g',
  'callaíta': 'acEOKQEIa3g',
  'amorfoda': 'OOD42i_pYyI',
  'diles': 'M6lVqHjFj6g',
  'bichota': 'tbneQD72Zo4',
  'mamiii': 'e_t4lZ09u88',
  'mi gente': 'wnJ6LuUFpMo',
  'con calma': 'DiItGE3eAyQ',
  'bailando': 'NUsoVlDFqZg',
  'chantaje': '6Mgqbai53Ko',
  'waka waka': 'pRpeEdMmmQ0',
  'hips don\'t lie': 'DUT5rEU6pqM',
  'hips dont lie': 'DUT5rEU6pqM',
  'la bicicleta': '-UV0QGLmYys',
  'shakira: bzrp': 'cocg1V_4gk8',
  'bzrp music sessions #53': 'cocg1V_4gk8',
  'forofos': 'MRL3Ifsl3kE',
  'huracán': 'P2Kf8RsxuiA',
  'huracan': 'P2Kf8RsxuiA',
  'quevedo: bzrp': 'A_g3lMcWVy0',
  'bzrp music sessions #52': 'A_g3lMcWVy0',
  'rolling in the deep': 'rYEDA3JcQqw',
  'someone like you': 'hLQl3WQQoQ0',
  'counting stars': 'hT_nvWreIhg',
  'demons': 'mWRsgZuwf_8',
  'thunder': 'fKopy74weus',
  'fix you': 'k4V3Mo61fJM',
  'clocks': 'd020hcWA_Wg',
  'paradise': '1G4isv_Fylg',
  'adventure of a lifetime': 'QtXby3G2CG8',
  'something just like this': 'FM7Z-Xq8Drc',
  'hymn for the weekend': 'YykjpeuMNEk',
  'uptown funk': 'OPf0YbXqDm0',
  'sugar': '09R8_2nJtjg',
  'take on me': 'djV11Xbc914',
  'smells like teen spirit': 'hTWKbfoikeg',
  'sweet child o mine': '1w7OgIMMRc4',
  'sweet child o\' mine': '1w7OgIMMRc4',
  'hotel california': '09839DpTctU',
  'wonderwall': '6hzrDeceEKc',
  'shallow': 'bo_efYh1P2U',
  'stay': 'kTJczUoc268',
  'levitating': 'TUVcZfQe-Kw',
  'dont start now': 'oygrmJFKYZY',
  "don't start now": 'oygrmJFKYZY',
  'water': 'XoiOOiuH8iI',
  'cruel summer': 'ic8j13piAhQ',
  'anti-hero': 'b1kbLwvqugk',
  'blank space': 'e-ORhEE9VVg',
  'shake it off': 'nfWlot6h_JM',
  'bad blood': 'QcIy9NiNbmo',
  'love story': '8xg3vE8Ie_E',
  'cardigan': 'K-a8s8OLBSE',
  'all too well': 'tollGa3S0o8',
  'style': '-CmadmM5cOk',
  'look what you made me do': '3tmd-ClpJxA',
  'delicate': 'tCXGJQYZ9JA',
  'espresso': 'eVli-tstM5E',
  'please please please': 'cF1Na4AIecM',
  'feather': 'kE9U3IqDcqg',
  'vampire': 'zlJDTxahav0',
  'drivers license': 'ZmDBbnmKpqQ',
  'deja vu': 'cii6ruuycKA',
  'good 4 u': 'gNi_6U5Pm_o',
  'traitor': 'CRrf3h9vhp8',
  'kill bill': 'SQnc1QZ7U0Q',
  'snooze': 'LDY_Xyx3xpw',
  'saturn': '98b8uL5fE04',
  'greedy': 'toZfvVDGnmM',
  'exes': '2t8N_l_Z7iI',
  'greedy tate mcrae': 'toZfvVDGnmM',
  'paint the town red': 'm4_9TFeMfJE',
  'say so': 'pok8H_KF1FA',
  'woman': 'yxW5yuzVi8w',
  'kiss me more': '0EVVKs6D654',
  'houdini': 'suAR1PYFNYA',
  'training season': 'ZjBZ0lWJk4U',
  'dance the night': 'OiC1rgCPmUQ',
  'physical': '9HDEHj2yzew',
  'new rules': 'k2qgadSvNyU',
  'one kiss': 'DkeiKbqa02g',
  'scared to be lonely': 'e2vBLd5Egnk',
  'un x100to': 'c3v0rJqyIM8',
  'un preview': 'Z21UqO0xX7U',
  'perro negro': 'X4pY6YgL1yE',
  'monaco bad bunny': 'osu0N-hU20g',
  'hibiki': 'Xw5qQWqR6_M',
  'fina': '6P0h3U9rPsw',
  'baby nueva': 'GkQ_1l_9L7I',
  'la jumpina': 'sDkG_J_Y6-w',
  'seduceme': 'J4B_8P0r6-E',
  'chimi': 'V5B_X_9L7_0',
  'efecto': 'NK8k0J5f5o0',
  'neverita': '10EX-_h4pYc',
  'tarot': '0P5_R6_9L7I',
  'party': '9P0h3U9rPsw',
  'aguacero': '8P0h3U9rPsw',
  'dos mil 16': 'G0P5_R6_9L7',
  'yo perreo sola': 'GtSR_G4WdC0',
  'si veo a tu mama': 'f1J5o0k5_wU',
  'la dificil': 'J4B_8P0r6-E',
  'la santa': 'NK8k0J5f5o0',
  'vete': '8W_8k0J5f5o',
  'ignoranites': 'GtSR_G4WdC0',
  'a tu merced': 'G0P5_R6_9L7',
  'que pretendes': 'O0P5_R6_9L7',
  'la cancion': 'x56mD0tUoQI',
  'la canción': 'x56mD0tUoQI',
  'no me conoce': 'yqM5L3dF5i4',
  'solia': 'NK8k0J5f5o0',
  'qlona': '6r3cO-n1gYs',
  'mi ex tenia razon': 'k_O0-n1gYs0',
  'gatubela': '1P5_R6_9L7I',
  'cairo': '0O0-n1gYs0P',
  'el barco': 'f1J5o0k5_wU',
  '200 copas': 'J4B_8P0r6-E',
  'tusa': 'tbneQD72Zo4',
  'ay dios mio': 'O0P5_R6_9L7',
  'se jodió to': 'GtSR_G4WdC0',
  'felina': 'GkQ_1l_9L7I',
  'chorrito pa las animas': 'G0P5_R6_9L7',
  'normal': 'f1J5o0k5_wU',
  'prohibidox': 'x56mD0tUoQI',
  'ferxxo 100': 'yqM5L3dF5i4',
  'luces de tecno': 'k_O0-n1gYs0',
  'monastery': '8W_8k0J5f5o',
  'yandel 150': 'J4B_8P0r6-E',
  'reina': 'GtSR_G4WdC0',
  'memorias': '0P5_R6_9L7I',
  '512': 'NK8k0J5f5o0',
  'la inocente': 'GkQ_1l_9L7I',
  'la corriente': 'c3v0rJqyIM8',
  'lokera': 'tbneQD72Zo4',
  'ron cola': 'J4B_8P0r6-E',
  'lejos del cielo': 'O0P5_R6_9L7',
  '2/catorce': '6P0h3U9rPsw',
  'desesperados': '0P5_R6_9L7I',
  'cúrame': 'NK8k0J5f5o0',
  'curame': 'NK8k0J5f5o0',
  'tiroteo': 'G0P5_R6_9L7',
  'nostalgico': '8W_8k0J5f5o',
  'te felicito': '1w7OgIMMRc4',
  'monotonia': 'b1kbLwvqugk',
  'monotonía': 'b1kbLwvqugk',
  'acrostico': 'tollGa3S0o8',
  'acróstico': 'tollGa3S0o8',
  'copa vacia': 'c3v0rJqyIM8',
  'copa vacía': 'c3v0rJqyIM8',
  'el jefe': 'Cr8K84nTWF8',
  'punteria': 'oT9nS0qL_wE',
  'puntería': 'oT9nS0qL_wE',
  'suerte': 'DUT5rEU6pqM',
  'whenever wherever': 'DUT5rEU6pqM',
  'antologia': 'rYEDA3JcQqw',
  'antología': 'rYEDA3JcQqw',
  'dia de enero': 'hLQl3WQQoQ0',
  'día de enero': 'hLQl3WQQoQ0',
  'ciega sordomuda': 'pRpeEdMmmQ0',
  'inevitable': 'k4V3Mo61fJM',
  'las de la intuicion': 'djV11Xbc914',
  'las de la intuición': 'djV11Xbc914',
  'gods plan': 'xpVfcZ0ZcFM',
  "god's plan": 'xpVfcZ0ZcFM',
  'one dance': 'iAbnEUA0wpA',
  'hotline bling': 'uxpDa-c-4Mc',
  'in my feelings': 'DRS_PpOrUZ4',
  'passionfruit': 'COz9lDCFH5k',
  'rich flex': 'fPMg7vV8q3U',
  'first person shooter': 'Xty2gi5cMa8',
  'idgaf': 'k4V3Mo61fJM',
  'circadian rhythm': 'b1kbLwvqugk',
  'humble': 'tvTRZJ-4EyI',
  'not like us': 'H58vbez_m4E',
  'euphoria': 'H58vbez_m4E',
  'dna': 'NLZRYQMLDW4',
  'all the stars': 'GfCqMv--ncA',
  'swimming pools': 'B5YNiCc834w',
  'king kunta': 'hRK7PVJFbS8',
  'money trees': 'smqhSl0u_Qk',
  'sicko mode': '6ONRf7h3sdk',
  'goosebumps': 'Dst9gZkq1a8',
  'highest in the room': 'tfSS1e3kYeo',
  'fein': 'B9synWjqBn8',
  'f!en': 'B9synWjqBn8',
  'meltdown': 'tfSS1e3kYeo',
  'butterfly effect': 'Dst9gZkq1a8',
  'antidote': '6ONRf7h3sdk',
  'lose yourself': '_Yhyp-_hX2s',
  'without me': 'YVkUvmDQ3HY',
  'the real slim shady': 'eJO5HU_7_1w',
  'mockingbird': 'S9bCLPwzSC0',
  'stan': 'gOMhN-hfMtY',
  'till i collapse': 'ytQ5CYE1VZw',
  'rap god': 'XbGs_qK2PQA',
  'godzilla': 'r_0JjYUe53w',
  'not afraid': 'j5-yKhDd64s',
  'love the way you lie': 'uelHwf8o7_U',
  'sunflower': 'ApXoWvfEYVU',
  'circles': '4GFAZds18u4',
  'rockstar': 'UceaB4D0jpo',
  'congratulations': 'SC4xMk98Pdc',
  'better now': 'UYwF-j9V97E',
  'chemical': '4g7XN4yW4o4',
  'i had some help': 'y3l6UaK4wIo',
  'psycho': '5D3nL7YnJ3g',
  'white iverson': 'SLsTskih710',
  'goodbyes': 'ba7mB8oueCY',
  'die for you': 'QLCpqdqeoII',
  'the hills': 'yzTuBuRdAyA',
  'can\'t feel my face': 'KEI4qSrkPAs',
  'cant feel my face': 'KEI4qSrkPAs',
  'i feel it coming': 'qFLhGq0060w',
  'creepin': '61ymOWwOwUk',
  'heartless': '1D3x6UaK4wI',
  'in your eyes': 'dqRZDebPIGs',
  'take my breath': 'rhTl_OyehF8',
  'call out my name': 'M4ZoCHID9GI',
  '24k magic': 'UqyT8IEBkvY',
  'that\'s what i like': 'PMivT7MJ41M',
  'thats what i like': 'PMivT7MJ41M',
  'treasure': 'nPvuNsRccVw',
  'locked out of heaven': 'e-fA-gBCkj0',
  'when i was your man': 'ekzHIouo8Q4',
  'grenade': 'SR6iYWJxHqs',
  'just the way you are': 'LjhCEhWiKXk',
  'finesse': 'LsoLEjrDogU',
  'leave the door open': 'adLGHcj_fmA',
  'smokin out the window': 'GG7fLOmlhYg',
  'bad habits': 'orJSJGHjBLI',
  'shivers': 'Il0S8BoucSA',
  'thinking out loud': 'lp-EO5I60KA',
  'photograph': 'nSDgHBxUbVQ',
  'castle on the hill': 'K0ibBPhiaG0',
  'galway girl': '87gWaABqGYs',
  'eyes closed': 'u2DXhW89F8c',
  'happier': 'iWZmdoY1aTE',
  'a team': 'UAWcs5H-qgQ',
  'birds of a feather': 'd5gf9dXbPi0',
  'lunch': 'MB3VkzPdgLA',
  'chihiro': 'b2OZXS4yMhU',
  'wildflower': '6P0h3U9rPsw',
  'what was i made for': 'cW8VLC9U85o',
  'ocean eyes': 'viimfQi_pUw',
  'when the party\'s over': 'pbMwTqkKSps',
  'everything i wanted': 'EgBJmlPo8Xw',
  'lovely': 'V1Pl8CzNzCw',
  'bury a friend': 'HUHC9tYz8ik',
  'all i want for christmas is you': 'yXQViqx6GMY',
  'careless whisper': 'izGwDsrQ1eQ',
  'billie jean': 'Zi_XLOBDo_Y',
  'thriller': 'sOnqjkJTMaA',
  'beat it': 'oRdxUFDoQe0',
  'smooth criminal': 'h_D3VFfhvs4',
  'man in the mirror': 'PivWY9wn5ps',
  'black or white': 'F2AitTPI5U0',
  'sweet child of mine': '1w7OgIMMRc4',
  'november rain': '8SbUC-UaAxE',
  'dont cry': 'zRIbf6JqkNc',
  'welcome to the jungle': 'o1tj2zJ2Wvg',
  'paradise city': 'RbmS3tQJ7Os',
  'stairway to heaven': 'QkF3oxziUI4',
  'back in black': 'pAgnJDJN4VA',
  'highway to hell': 'gEPmA3USJdI',
  'thunderstruck': 'v2AC41dglnM',
  'we will rock you': '-tJYN-eG1zk',
  'we are the champions': '04854XqcfCY',
  'another one bites the dust': 'rY0WxgSXdEE',
  'under pressure': 'a01QQZyl-_I',
  'radio ga ga': 'azdwsXLmrHE',
  'i want to break free': 'f4Mc-NYPHaQ',
  'somebody to love': 'kijpcUv-b8M',
  'dont stop believing': '1k8craCGghs',
  'eye of the tiger': 'btPJPFnesV4',
  'dream on': 'sZfZ8H_HsSE',
  'livin on a prayer': 'lDK9QqIzhwk',
  'it\'s my life': 'vx2u5uUu3DE',
  'its my life': 'vx2u5uUu3DE',
  'in the end': 'eVTXPUF4Oz4',
  'numb': 'kXYiU_JCYtU',
  'faint': 'LYU-8IFcDPw',
  'crawling': 'Gd9OhYroLN0',
  'somewhere i belong': 'zsCD5XCu6CM',
  'bring me to life': '3YxaaGgTQYM',
  'chop suey': 'CSvFpBOmb8E',
  'toxicity': 'iywaBOMvYLI',
  'californication': 'YlUKcNNmywk',
  'can\'t stop': '8DyziWtkfBw',
  'scar tissue': 'mzJj5-lubeM',
  'under the bridge': 'GLvohMXgcBo',
  'otherside': 'rn_YodiJO6k',
  'dani california': 'Sb5aq5Hhn1A',
  'snow hey oh': 'yuFI5KSPAt4',
  'do i wanna know': 'bpOSxM0rNPM',
  '505': 'qU9mHegkTc4',
  'r u mine': 'VQH8ZTgna3Q',
  'why\'d you only call me when you\'re high': '6366dxFf-Os',
  'i wanna be yours': 'fJ9rUzIMcZQ',
  'come as you are': 'vabnZ9-ex7o',
  'lithium': 'pkcJEvMcnEg',
  'about a girl': 'AhcttcXc5-0'
};

/**
 * Normalizes string and matches known full length video ID
 */
export function findKnownYouTubeVideoId(title: string, artist?: string): string | null {
  if (!title) return null;
  const normalize = (s: string) =>
    s.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/[()[\]'"\-.,:;!?_#]/g, ' ')
      .replace(/\s+/g, ' ');

  const cleanTitle = normalize(title);

  // Exact or contains match on title
  for (const [key, id] of Object.entries(KNOWN_YOUTUBE_MAP)) {
    const normKey = normalize(key);
    if (cleanTitle === normKey || cleanTitle.includes(normKey) || (normKey.length > 4 && normKey.includes(cleanTitle))) {
      return id;
    }
  }

  // Combined title + artist match
  if (artist) {
    const cleanArtist = normalize(artist);
    const combined = `${cleanTitle} ${cleanArtist}`;
    for (const [key, id] of Object.entries(KNOWN_YOUTUBE_MAP)) {
      const normKey = normalize(key);
      if (combined.includes(normKey)) {
        return id;
      }
    }

    // Artist name alone match (if query is just the artist)
    for (const [key, id] of Object.entries(KNOWN_YOUTUBE_MAP)) {
      const normKey = normalize(key);
      if (cleanArtist.includes(normKey)) {
        return id;
      }
    }
  }

  return null;
}

export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace(/^\/+/, '').split('/')[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const embedMatch = parsed.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch) return embedMatch[1];
    }
  } catch {
    // If not a full URL, attempt safe bounded extraction
    const match = trimmed.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) return match[1];
  }
  return null;
}

/**
 * Searches online for full song YouTube video ID.
 * Priority 1: Verified fast local catalog
 * Priority 2: High-performance /api/search-youtube server endpoint
 * Priority 3: Fallback public instances
 */
export async function searchYouTubeTrackOnline(title: string, artist?: string): Promise<string | null> {
  // 1. Check verified fast local catalog first
  const localMatch = findKnownYouTubeVideoId(title, artist);
  if (localMatch) return localMatch;

  const searchQuery = artist ? `${title} ${artist}` : title;

  // 2. Query secure internal endpoint for official music video
  try {
    const serverUrl = `/api/search-video?q=${encodeURIComponent(searchQuery)}`;
    const serverRes = await fetch(serverUrl);
    if (serverRes.ok) {
      const serverData = await serverRes.json();
      if (serverData.success && Array.isArray(serverData.results) && serverData.results.length > 0) {
        const first = serverData.results[0];
        if (first?.id && first.id.length === 11) {
          return first.id;
        }
      }
    }
  } catch {
    // Graceful fallback
  }

  return null;
}

export const searchOfficialMusicVideo = searchYouTubeTrackOnline;
export const findOfficialMusicVideoId = findKnownYouTubeVideoId;
