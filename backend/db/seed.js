const db = require('./index');

const entries = [
  // ── BBSes ──
  { name: 'Synchronet BBS Demo', host: 'demo.synchro.net', port: 23, protocol: 'telnet', description: 'Synchronet BBS software demo system — full-featured BBS experience', category: 'bbs', tags: '["synchronet","demo"]' },
  { name: 'Level 29', host: 'bbs.fozztexx.com', port: 23, protocol: 'telnet', description: 'Classic BBS with retro computing focus and vintage vibes', category: 'bbs', tags: '["retro","vintage"]' },
  { name: 'Particles! BBS', host: 'particlesbbs.dyndns.org', port: 6400, protocol: 'telnet', description: 'Long-running BBS with active community and door games', category: 'bbs', tags: '["games","community"]' },
  { name: 'Black Flag BBS', host: 'blackflagbbs.com', port: 23, protocol: 'telnet', description: 'Pirate-themed BBS running Mystic software', category: 'bbs', tags: '["mystic","pirate"]' },
  { name: 'Capitol Shrill', host: 'capitolshrill.com', port: 23, protocol: 'telnet', description: 'Political discussion BBS with a long history', category: 'bbs', tags: '["politics","discussion"]' },
  { name: 'Clutch BBS', host: 'clutchbbs.com', port: 23, protocol: 'telnet', description: 'Modern Mystic BBS with door games and message networks', category: 'bbs', tags: '["mystic","doors"]' },
  { name: 'The Cave BBS', host: 'cavebbs.homeip.net', port: 23, protocol: 'telnet', description: 'Underground BBS with echomail and file areas', category: 'bbs', tags: '["echomail","files"]' },
  { name: 'Xibalba BBS', host: 'xibalba.l33t.codes', port: 44510, protocol: 'telnet', description: 'ENiGMA½ BBS with ANSI art and modern features', category: 'bbs', tags: '["enigma","ansi-art"]' },

  // ── MUDs ──
  { name: 'Aardwolf', host: 'aardmud.org', port: 4000, protocol: 'telnet', description: 'One of the most popular MUDs — huge world, active community, great for beginners', category: 'mud', tags: '["fantasy","beginner-friendly"]' },
  { name: 'Achaea', host: 'achaea.com', port: 23, protocol: 'telnet', description: 'Iron Realms flagship — deep roleplay, complex combat, political systems', category: 'mud', tags: '["roleplay","pvp","iron-realms"]' },
  { name: 'Discworld MUD', host: 'discworld.starturtle.net', port: 4242, protocol: 'telnet', description: 'Based on Terry Pratchett\'s Discworld — witty, huge, and beloved', category: 'mud', tags: '["discworld","humor","fantasy"]' },
  { name: 'Alter Aeon', host: 'alteraeon.com', port: 3000, protocol: 'telnet', description: 'Accessible MUD with screen reader support and active development', category: 'mud', tags: '["accessible","fantasy"]' },
  { name: 'BatMUD', host: 'batmud.bat.org', port: 23, protocol: 'telnet', description: 'Finnish MUD running since 1990 — one of the oldest still active', category: 'mud', tags: '["classic","fantasy","finnish"]' },
  { name: 'Realms of Despair', host: 'realmsofdespair.com', port: 4000, protocol: 'telnet', description: 'Long-running SMAUG MUD with dedicated playerbase', category: 'mud', tags: '["smaug","fantasy","classic"]' },
  { name: 'Threshold RPG', host: 'threshold-rpg.com', port: 3333, protocol: 'telnet', description: 'Roleplay-enforced MUD with deep crafting and political systems', category: 'mud', tags: '["roleplay","crafting"]' },
  { name: 'Legends of the Jedi', host: 'legendsofthejedi.com', port: 5656, protocol: 'telnet', description: 'Star Wars themed MUD with timeline resets and space combat', category: 'mud', tags: '["star-wars","sci-fi","pvp"]' },
  { name: 'HellMOO', host: 'hellmoo.org', port: 7777, protocol: 'telnet', description: 'Post-apocalyptic MOO — gritty, funny, and deeply weird', category: 'mud', tags: '["post-apocalyptic","moo","dark-humor"]' },
  { name: 'Sindome', host: 'moo.sindome.org', port: 5555, protocol: 'telnet', description: 'Cyberpunk MOO — immersive roleplay in a dark future city', category: 'mud', tags: '["cyberpunk","roleplay","moo"]' },

  // ── Network Tools ──
  { name: 'wttr.in — Weather', host: 'wttr.in', port: 443, protocol: 'https', description: 'Curl-able weather forecast — try: curl wttr.in', category: 'network-tool', tags: '["weather","curl","api"]', url: 'https://wttr.in' },
  { name: 'ifconfig.me', host: 'ifconfig.me', port: 443, protocol: 'https', description: 'What\'s my IP? — try: curl ifconfig.me', category: 'network-tool', tags: '["ip","curl","api"]', url: 'https://ifconfig.me' },
  { name: 'Star Wars ASCII', host: 'towel.blinkenlights.nl', port: 23, protocol: 'telnet', description: 'The original Star Wars ASCII animation — a telnet classic', category: 'network-tool', tags: '["star-wars","ascii","animation","classic"]' },
  { name: 'MapSCII', host: 'mapscii.me', port: 23, protocol: 'telnet', description: 'Braille/ASCII world map in your terminal — zoom and scroll', category: 'network-tool', tags: '["map","ascii","interactive"]' },
  { name: 'ipinfo.io', host: 'ipinfo.io', port: 443, protocol: 'https', description: 'IP geolocation and ASN info — try: curl ipinfo.io', category: 'network-tool', tags: '["ip","geolocation","api"]', url: 'https://ipinfo.io' },
  { name: 'cheat.sh', host: 'cheat.sh', port: 443, protocol: 'https', description: 'Curl-able cheat sheets for any command — try: curl cheat.sh/tar', category: 'network-tool', tags: '["cheatsheet","curl","reference"]', url: 'https://cheat.sh' },
  { name: 'rate.sx', host: 'rate.sx', port: 443, protocol: 'https', description: 'Crypto exchange rates in terminal — try: curl rate.sx', category: 'network-tool', tags: '["crypto","finance","curl"]', url: 'https://rate.sx' },
  { name: 'qrenco.de', host: 'qrenco.de', port: 443, protocol: 'https', description: 'Generate QR codes in terminal — try: curl qrenco.de/hello', category: 'network-tool', tags: '["qr-code","curl","utility"]', url: 'https://qrenco.de' },

  // ── Tilde Servers / Sandboxes ──
  { name: 'tilde.town', host: 'tilde.town', port: 22, protocol: 'ssh', description: 'Intentional digital community — shared unix server for creativity', category: 'sandbox', tags: '["tilde","community","creative"]', url: 'https://tilde.town' },
  { name: 'tilde.club', host: 'tilde.club', port: 22, protocol: 'ssh', description: 'The original tilde server — public unix shell with web hosting', category: 'sandbox', tags: '["tilde","classic","unix"]', url: 'https://tilde.club' },
  { name: 'SDF Public Access UNIX', host: 'sdf.org', port: 22, protocol: 'ssh', description: 'Free public-access UNIX system since 1987 — shell, email, gopher, and more', category: 'sandbox', tags: '["unix","free","classic","public-access"]', url: 'https://sdf.org' },
  { name: 'tilde.team', host: 'tilde.team', port: 22, protocol: 'ssh', description: 'Part of the tildeverse — friendly community with IRC and services', category: 'sandbox', tags: '["tilde","community","irc"]', url: 'https://tilde.team' },
  { name: 'rawtext.club', host: 'rawtext.club', port: 22, protocol: 'ssh', description: 'Minimalist tilde focused on plain text and simplicity', category: 'sandbox', tags: '["tilde","minimalist","text"]', url: 'https://rawtext.club' },
  { name: 'Hashbang', host: 'hashbang.sh', port: 22, protocol: 'ssh', description: 'Free shell provider with modern tools and community', category: 'sandbox', tags: '["shell","free","community"]', url: 'https://hashbang.sh' },

  // ── Gopher ──
  { name: 'Floodgap Gopher', host: 'gopher.floodgap.com', port: 70, protocol: 'gopher', description: 'The Floodgap gopher server — gateway to the gopherspace', category: 'gopher', tags: '["gateway","directory"]' },
  { name: 'SDF Gopherspace', host: 'sdf.org', port: 70, protocol: 'gopher', description: 'SDF\'s gopher server — community phlog and resources', category: 'gopher', tags: '["sdf","community","phlog"]' },
  { name: 'Gopherpedia', host: 'gopherpedia.com', port: 70, protocol: 'gopher', description: 'Wikipedia over Gopher protocol — browse the encyclopedia in plaintext', category: 'gopher', tags: '["wikipedia","reference"]' },
  { name: 'quux.org Gopher', host: 'quux.org', port: 70, protocol: 'gopher', description: 'Classic gopher server with archives and computing history', category: 'gopher', tags: '["archive","history","classic"]' },

  // ── Gemini ──
  { name: 'geminiprotocol.net', host: 'geminiprotocol.net', port: 1965, protocol: 'gemini', description: 'The official Gemini protocol site — documentation and resources', category: 'gemini', tags: '["official","documentation"]' },
  { name: 'geminispace.info', host: 'geminispace.info', port: 1965, protocol: 'gemini', description: 'Gemini search engine and capsule directory', category: 'gemini', tags: '["search","directory"]' },
  { name: 'Kennedy (Gemini Search)', host: 'kennedy.gemi.dev', port: 1965, protocol: 'gemini', description: 'Full-text search engine for Geminispace', category: 'gemini', tags: '["search","index"]' },

  // ── IRC ──
  { name: 'Libera Chat', host: 'irc.libera.chat', port: 6697, protocol: 'raw', description: 'Successor to Freenode — largest open-source IRC network', category: 'irc', tags: '["foss","large","community"]', url: 'https://libera.chat' },
  { name: 'OFTC', host: 'irc.oftc.net', port: 6697, protocol: 'raw', description: 'Open and Free Technology Community IRC — Debian and friends', category: 'irc', tags: '["debian","foss","community"]', url: 'https://oftc.net' },
  { name: 'tilde.chat', host: 'irc.tilde.chat', port: 6697, protocol: 'raw', description: 'IRC network for the tildeverse community', category: 'irc', tags: '["tilde","community"]', url: 'https://tilde.chat' },
  { name: 'EFnet', host: 'irc.efnet.org', port: 6667, protocol: 'raw', description: 'One of the original IRC networks — raw, unregistered, old-school', category: 'irc', tags: '["classic","original","old-school"]' },
  { name: 'IRCnet', host: 'open.ircnet.net', port: 6667, protocol: 'raw', description: 'European IRC network dating back to the original IRC split', category: 'irc', tags: '["european","classic","original"]' },

  // ── Games ──
  { name: 'Telehack', host: 'telehack.com', port: 23, protocol: 'telnet', description: 'Simulated 1980s internet — explore ARPANET, hack, play games', category: 'game', tags: '["simulation","retro","hacking","classic"]' },
  { name: 'Nyan Cat Telnet', host: 'nyancat.dakko.us', port: 23, protocol: 'telnet', description: 'Nyan Cat animation in your terminal — meow', category: 'game', tags: '["nyan-cat","animation","fun"]' },
  { name: 'Nethack (alt.org)', host: 'alt.org', port: 23, protocol: 'telnet', description: 'Play Nethack online — the classic roguelike on a public server', category: 'game', tags: '["roguelike","nethack","classic"]' },
  { name: 'Greed — Terminal Game', host: 'greed.galois.com', port: 4242, protocol: 'telnet', description: 'Simple but addictive terminal number game', category: 'game', tags: '["puzzle","simple"]' },

  // ── ASCII Art ──
  { name: 'ASCII Art Server (ACME)', host: 'artscene.textfiles.com', port: 23, protocol: 'telnet', description: 'Massive archive of ANSI and ASCII art from the BBS era', category: 'ascii-art', tags: '["archive","ansi","bbs-era"]' },

  // ── APIs ──
  { name: 'httpbin.org', host: 'httpbin.org', port: 443, protocol: 'https', description: 'HTTP request/response testing service — great for debugging', category: 'api', tags: '["testing","http","debug"]', url: 'https://httpbin.org' },
  { name: 'icanhazdadjoke.com', host: 'icanhazdadjoke.com', port: 443, protocol: 'https', description: 'Curl-able dad jokes — try: curl -H "Accept: text/plain" icanhazdadjoke.com', category: 'api', tags: '["jokes","fun","curl"]', url: 'https://icanhazdadjoke.com' },
  { name: 'catfact.ninja', host: 'catfact.ninja', port: 443, protocol: 'https', description: 'Random cat facts API — try: curl catfact.ninja/fact', category: 'api', tags: '["cats","fun","api"]', url: 'https://catfact.ninja' },
  { name: 'dog.ceo', host: 'dog.ceo', port: 443, protocol: 'https', description: 'Random dog images API — try: curl dog.ceo/api/breeds/image/random', category: 'api', tags: '["dogs","images","api"]', url: 'https://dog.ceo' },
  { name: 'ASCII cows (cowsay)', host: 'cowsay.morecode.org', port: 443, protocol: 'https', description: 'Cowsay as a service — try: curl cowsay.morecode.org', category: 'api', tags: '["cowsay","fun","ascii"]', url: 'https://cowsay.morecode.org' },

  // ── Finger ──
  { name: 'Finger at SDF', host: 'sdf.org', port: 79, protocol: 'finger', description: 'SDF public finger server — see who\'s online', category: 'finger', tags: '["sdf","public-access"]' },
  { name: 'Finger at tilde.town', host: 'tilde.town', port: 79, protocol: 'finger', description: 'Finger server for tilde.town residents', category: 'finger', tags: '["tilde","community"]' },

  // ── Radio ──
  { name: 'SomaFM', host: 'somafm.com', port: 443, protocol: 'https', description: 'Listener-supported internet radio — Groove Salad, DEF CON radio, and more', category: 'radio', tags: '["music","streaming","listener-supported"]', url: 'https://somafm.com' },
  { name: 'Tilderadio', host: 'tilderadio.org', port: 443, protocol: 'https', description: 'Community radio station from the tildeverse', category: 'radio', tags: '["tilde","community","music"]', url: 'https://tilderadio.org' },

  // ── Chat ──
  { name: '2600 BBS', host: '2600.america.com', port: 23, protocol: 'telnet', description: '2600 magazine\'s BBS — hacker culture and discussion', category: 'chat', tags: '["hacker","2600","culture"]' },

  // ── Other ──
  { name: 'Bulletin (textfiles.com)', host: 'textfiles.com', port: 443, protocol: 'https', description: 'Jason Scott\'s archive of BBS-era text files — history of the underground', category: 'other', tags: '["archive","history","text-files"]', url: 'https://textfiles.com' },
  { name: 'The WELL', host: 'well.com', port: 22, protocol: 'ssh', description: 'The Whole Earth \'Lectronic Link — legendary online community since 1985', category: 'other', tags: '["community","historic","legendary"]', url: 'https://well.com' },
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO entries (name, host, port, protocol, description, category, tags, url)
  VALUES (@name, @host, @port, @protocol, @description, @category, @tags, @url)
`);

const tx = db.transaction(() => {
  let inserted = 0;
  for (const entry of entries) {
    const result = insert.run({
      name: entry.name,
      host: entry.host,
      port: entry.port,
      protocol: entry.protocol,
      description: entry.description,
      category: entry.category,
      tags: entry.tags || '[]',
      url: entry.url || null,
    });
    if (result.changes > 0) inserted++;
  }
  return inserted;
});

const count = tx();
const total = db.prepare('SELECT COUNT(*) as n FROM entries').get().n;
console.log(`Seeded ${count} new entries (${total} total in database)`);
