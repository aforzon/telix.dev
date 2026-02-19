const db = require('./index');

// Massive expansion of the telix.dev phonebook directory
// Sources: Telnet BBS Guide, MudVerse, Mud Connector, tildeverse.org, awesome-console-services, and more

const entries = [
  // ═══════════════════════════════════════════════════════
  // MUDs — Iron Realms Entertainment
  // ═══════════════════════════════════════════════════════
  { name: 'Aetolia, the Midnight Age', host: 'aetolia.com', port: 23, protocol: 'telnet', description: 'Dark vampire-themed Iron Realms MUD with deep roleplay and complex combat', category: 'mud', tags: '["roleplay","pvp","iron-realms","vampire","fantasy"]' },
  { name: 'Lusternia: Age of Ascension', host: 'lusternia.com', port: 5000, protocol: 'telnet', description: 'Iron Realms MUD with divine politics, music-based combat, and player-run orgs (legacy mode)', category: 'mud', tags: '["iron-realms","fantasy","roleplay","legacy"]' },
  { name: 'Imperian: The Sundered Heavens', host: 'imperian.com', port: 23, protocol: 'telnet', description: 'Iron Realms fantasy MUD set in a world shaped by player decisions (legacy mode)', category: 'mud', tags: '["iron-realms","fantasy","legacy"]' },
  { name: 'Starmourn', host: 'starmourn.com', port: 3000, protocol: 'telnet', description: 'Sci-fi Iron Realms MUD with starship piloting, hacking, and 50+ alien races (legacy mode)', category: 'mud', tags: '["iron-realms","sci-fi","space","hacking","legacy"]' },

  // ═══════════════════════════════════════════════════════
  // MUDs — Classic/Popular
  // ═══════════════════════════════════════════════════════
  { name: 'TorilMUD', host: 'torilmud.org', port: 9999, protocol: 'telnet', description: 'D&D Forgotten Realms MUD since 1996 — 325+ zones from Evermeet to Waterdeep', category: 'mud', tags: '["dnd","forgotten-realms","fantasy","classic"]' },
  { name: 'Medievia', host: 'medievia.com', port: 4000, protocol: 'telnet', description: 'Legendary MUD running since 1992 with trade runs, dragon combat, and clan warfare', category: 'mud', tags: '["fantasy","classic","pvp","trade"]' },
  { name: '3Kingdoms', host: '3k.org', port: 3000, protocol: 'telnet', description: 'Multi-genre LPMud since 1992 — Fantasy, Sci-Fi, and Chaos realms with 14+ guilds', category: 'mud', tags: '["multi-genre","lpmud","classic","fantasy","sci-fi"]' },
  { name: 'Ancient Anguish', host: 'ancient.anguish.org', port: 2222, protocol: 'telnet', description: 'One of the oldest LPMuds, running since early 1990s with 200+ areas and 15 guilds', category: 'mud', tags: '["lpmud","classic","fantasy"]' },
  { name: 'Carrion Fields', host: 'carrionfields.net', port: 4449, protocol: 'telnet', description: 'Roleplay-enforced PvP MUD since 1994 with deep class/race system and cabal politics', category: 'mud', tags: '["roleplay","pvp","fantasy","hardcore"]' },
  { name: 'LegendMUD', host: 'mud.legendmud.org', port: 9999, protocol: 'telnet', description: 'Historical-themed MUD spanning medieval, industrial, and ancient eras', category: 'mud', tags: '["historical","fantasy","classic"]' },
  { name: 'Materia Magica', host: 'materiamagica.com', port: 4000, protocol: 'telnet', description: 'Complex fantasy MUD on planet Alyria with deep lore, active since 1996', category: 'mud', tags: '["fantasy","lore","classic"]' },
  { name: 'Avalon: The Legend Lives', host: 'avalon-rpg.com', port: 23, protocol: 'telnet', description: 'Complex atmospheric text RPG with real-time warfare and political systems', category: 'mud', tags: '["roleplay","pvp","warfare","politics"]' },
  { name: 'Lost Souls', host: 'lostsouls.org', port: 23, protocol: 'telnet', description: 'Highly complex LP MUD with a unique association system and procedural content', category: 'mud', tags: '["lpmud","complex","fantasy"]' },
  { name: 'NannyMUD', host: 'mud.lysator.liu.se', port: 2000, protocol: 'telnet', description: 'One of the oldest LPMuds, running continuously since 1990 from Sweden — 200+ areas', category: 'mud', tags: '["lpmud","classic","swedish","fantasy"]' },

  // ═══════════════════════════════════════════════════════
  // MUDs — Fantasy/Adventure
  // ═══════════════════════════════════════════════════════
  { name: 'SlothMUD', host: 'game.slothmud.org', port: 6101, protocol: 'telnet', description: 'Long-running DikuMUD with large world, multiclassing, and active community', category: 'mud', tags: '["dikumud","classic","fantasy","multiclass"]' },
  { name: 'Dark and Shattered Lands', host: 'dsl-mud.org', port: 4000, protocol: 'telnet', description: '40+ classes and races with required roleplay and clan-based PvP since 1996', category: 'mud', tags: '["roleplay","pvp","fantasy","remort"]' },
  { name: 'Cleft of Dimensions', host: 'cleftofdimensions.net', port: 4354, protocol: 'telnet', description: 'Video game-inspired MUD blending worlds from classic SNES/NES games', category: 'mud', tags: '["video-game","retro","fantasy","nostalgia"]' },
  { name: 'StickMUD', host: 'stickmud.com', port: 7680, protocol: 'telnet', description: 'Free medieval fantasy hack-and-slash MUD running for 30+ years since 1991', category: 'mud', tags: '["fantasy","hack-and-slash","finnish","classic"]' },
  { name: 'Xyllomer', host: 'xyllomer.de', port: 3000, protocol: 'telnet', description: 'German-origin roleplay MUD with a complex fantasy world to explore', category: 'mud', tags: '["roleplay","fantasy","german"]' },
  { name: 'EmpireMUD', host: 'empiremud.net', port: 4000, protocol: 'telnet', description: 'Build, rise, and rule — strategy MUD focused on empire building and territory', category: 'mud', tags: '["strategy","building","empire","fantasy"]' },
  { name: 'Genesis', host: 'mud.genesismud.org', port: 3011, protocol: 'telnet', description: 'Old-school text adventure MUD with vast world and active community', category: 'mud', tags: '["lpmud","fantasy","classic","adventure"]' },
  { name: 'FieryMUD', host: 'fierymud.org', port: 4000, protocol: 'telnet', description: 'Fantasy MUD with active development and classic DikuMUD gameplay', category: 'mud', tags: '["dikumud","fantasy"]' },
  { name: 'Nodeka', host: 'nodeka.com', port: 23, protocol: 'telnet', description: 'Fantasy MUD with multiple character slots and deep progression systems', category: 'mud', tags: '["fantasy","progression"]' },
  { name: 'God Wars II', host: 'godwars2.org', port: 3000, protocol: 'telnet', description: 'Dark fantasy MUD sequel to the original GodWars with unique combat system', category: 'mud', tags: '["fantasy","pvp","combat","dark"]' },
  { name: 'Procedural Realms', host: 'proceduralrealms.com', port: 3000, protocol: 'telnet', description: 'Procedurally-generated fantasy MUD with turn-based combat and crafting', category: 'mud', tags: '["procedural","crafting","turn-based","modern"]' },

  // ═══════════════════════════════════════════════════════
  // MUDs — Sci-Fi/Cyberpunk
  // ═══════════════════════════════════════════════════════
  { name: 'CyberASSAULT', host: 'cyberassault.org', port: 11111, protocol: 'telnet', description: 'Post-apocalyptic sci-fi MUD with gun combat and pop culture references', category: 'mud', tags: '["post-apocalyptic","sci-fi","combat"]' },
  { name: 'Cosmic Rage', host: 'cosmicrage.earth', port: 7777, protocol: 'telnet', description: 'Space MOO with starship combat and accessibility features for blind players', category: 'mud', tags: '["sci-fi","space","moo","accessible"]' },
  { name: 'Miriani', host: 'toastsoft.net', port: 1234, protocol: 'telnet', description: 'Futuristic space combat MOO set 350 years in the future with starship piloting', category: 'mud', tags: '["sci-fi","space","moo","combat"]' },

  // ═══════════════════════════════════════════════════════
  // MUDs — Themed/Roleplay
  // ═══════════════════════════════════════════════════════
  { name: 'MUME (Multi-Users in Middle-earth)', host: 'mume.org', port: 4242, protocol: 'telnet', description: 'Tolkien-based MUD running 30+ years — explore the Shire, Rivendell, and Moria', category: 'mud', tags: '["tolkien","roleplay","pvp","classic"]' },
  { name: 'Armageddon MUD', host: 'ginka.armageddon.org', port: 4050, protocol: 'telnet', description: 'Harsh desert-world RPI MUD with permadeath and deep survival roleplay', category: 'mud', tags: '["roleplay","permadeath","survival","rpi"]' },
  { name: 'Wheel of Time MUD', host: 'game.wotmud.org', port: 2224, protocol: 'telnet', description: 'Based on Robert Jordan\'s Wheel of Time with PvP and faction warfare', category: 'mud', tags: '["wheel-of-time","fantasy","pvp","factions"]' },
  { name: 'Dune MUD', host: 'dunemud.net', port: 6789, protocol: 'telnet', description: 'Frank Herbert\'s Dune universe — navigate political intrigue on Arrakis', category: 'mud', tags: '["dune","sci-fi","political"]' },
  { name: 'Duris: Land of BloodLust', host: 'mud.durismud.com', port: 7777, protocol: 'telnet', description: 'Race-war PvP MUD since 1994 with intense player-killing focus', category: 'mud', tags: '["pvp","racewar","fantasy","hardcore"]' },
  { name: 'End of the Line MUD', host: 'eotl.org', port: 2010, protocol: 'telnet', description: 'Multi-theme LPMud since 1989 with diverse realms and guilds', category: 'mud', tags: '["lpmud","multi-theme","classic"]' },
  { name: 'ZombieMUD', host: 'zombiemud.org', port: 23, protocol: 'telnet', description: 'Finnish MUD based in Oulu with medieval fantasy theme and active community', category: 'mud', tags: '["fantasy","finnish","classic"]' },
  { name: 'RetroMUD', host: 'retromud.org', port: 3000, protocol: 'telnet', description: 'Fantasy MUD with attitude — multiclass system and diverse world', category: 'mud', tags: '["fantasy","multiclass","classic"]' },

  // ═══════════════════════════════════════════════════════
  // MUDs — MOOs
  // ═══════════════════════════════════════════════════════
  { name: 'LambdaMOO', host: 'lambda.moo.mud.org', port: 8888, protocol: 'telnet', description: 'The original MOO — pioneering virtual world and social space since 1990', category: 'mud', tags: '["moo","social","classic","historic"]' },
  { name: 'CyberSphere', host: 'cybersphere.net', port: 7777, protocol: 'telnet', description: 'Cyberpunk MOO set in New Carthage with decking, combat, and roleplay', category: 'mud', tags: '["cyberpunk","moo","roleplay"]' },
  { name: 'ChatMUD', host: 'chatmud.com', port: 7777, protocol: 'telnet', description: 'Social MOO focused on creative collaboration and accessibility', category: 'mud', tags: '["moo","social","creative","accessible"]' },

  // ═══════════════════════════════════════════════════════
  // MUDs — MUSHes & MUCKs
  // ═══════════════════════════════════════════════════════
  { name: 'Elendor MUSH', host: 'mush.elendor.net', port: 1892, protocol: 'telnet', description: 'Tolkien-themed MUSH since 1991 with deep Middle-earth roleplay', category: 'mud', tags: '["mush","tolkien","roleplay","classic"]' },
  { name: 'FurryMUCK', host: 'furrymuck.com', port: 8888, protocol: 'telnet', description: 'One of the oldest and largest social MUCKs — creative community since 1990', category: 'mud', tags: '["muck","social","creative","classic"]' },
  { name: 'SpinDizzy MUCK', host: 'muck.spindizzy.org', port: 7073, protocol: 'telnet', description: 'Social MUCK community — requires TLS-capable client since 2019', category: 'mud', tags: '["muck","social","ssl"]' },
  { name: 'Flexible Survival', host: 'flexiblesurvival.com', port: 2000, protocol: 'telnet', description: 'Sci-fi MUCK about surviving a nanite-based mutation virus outbreak', category: 'mud', tags: '["muck","sci-fi","survival","mutation"]' },

  // ═══════════════════════════════════════════════════════
  // GOPHER SERVERS
  // ═══════════════════════════════════════════════════════
  { name: 'Bitreich Gopher', host: 'bitreich.org', port: 70, protocol: 'gopher', description: 'Minimalist hacker community with gopher services and collaborative projects', category: 'gopher', tags: '["community","hacker","minimalist"]' },
  { name: 'HN Gopher', host: 'hngopher.com', port: 70, protocol: 'gopher', description: 'Hacker News mirror accessible via the Gopher protocol', category: 'gopher', tags: '["news","hackernews","mirror"]' },
  { name: 'Gopher.Black', host: 'gopher.black', port: 70, protocol: 'gopher', description: 'Active personal gopherhole and phlog, part of the modern gopher community', category: 'gopher', tags: '["phlog","personal"]' },
  { name: 'Zaibatsu Circumlunar', host: 'zaibatsu.circumlunar.space', port: 70, protocol: 'gopher', description: 'Mare Tranquillitatis People\'s Circumlunar Zaibatsu — free Gopher and Gemini hosting', category: 'gopher', tags: '["hosting","free","community"]' },
  { name: 'Cosmic Voyage Gopher', host: 'cosmic.voyage', port: 70, protocol: 'gopher', description: 'Collaborative science-fiction universe with gopher access', category: 'gopher', tags: '["scifi","writing","collaborative"]' },
  { name: 'Gopherddit', host: 'gopherddit.com', port: 70, protocol: 'gopher', description: 'Browse Reddit content over the Gopher protocol — a retro way to read Reddit', category: 'gopher', tags: '["reddit","social","retro"]' },
  { name: 'Somnolescent Gopher', host: 'gopher.somnolescent.net', port: 70, protocol: 'gopher', description: 'Creative community\'s gopher server running Pituophis', category: 'gopher', tags: '["community","creative"]' },
  { name: 'Gopherproject.org', host: 'gopherproject.org', port: 70, protocol: 'gopher', description: 'Welcome portal to gopherspace — gateway for new gopher explorers', category: 'gopher', tags: '["directory","gateway"]' },
  { name: 'Gopher.Club', host: 'gopher.club', port: 70, protocol: 'gopher', description: 'Gopher community server connected to the SDF phlogosphere', category: 'gopher', tags: '["community","social"]' },
  { name: 'taz.de Gopher', host: 'taz.de', port: 70, protocol: 'gopher', description: 'German newspaper taz with a gopher presence — news via gopher protocol', category: 'gopher', tags: '["news","german","media"]' },
  { name: 'Tilde.Pink Gopher', host: 'tilde.pink', port: 70, protocol: 'gopher', description: 'Gopher-only DragonflyBSD tilde server — gopher as primary protocol', category: 'gopher', tags: '["tilde","dragonflybsd"]' },

  // ═══════════════════════════════════════════════════════
  // GEMINI CAPSULES
  // ═══════════════════════════════════════════════════════
  { name: 'TLGS Search', host: 'tlgs.one', port: 1965, protocol: 'gemini', description: 'Public search provider for Geminispace', category: 'gemini', tags: '["search","discovery"]' },
  { name: 'Flounder.online', host: 'flounder.online', port: 1965, protocol: 'gemini', description: 'Free web interface for hosting Gemini capsules — create and manage capsules via browser', category: 'gemini', tags: '["hosting","free","beginner"]' },
  { name: 'Gemlog.blue', host: 'gemlog.blue', port: 1965, protocol: 'gemini', description: 'Quick and easy gemlog (journal) hosting — no sysadmin needed', category: 'gemini', tags: '["hosting","blogging","journal"]' },
  { name: 'Midnight Pub', host: 'midnight.pub', port: 1965, protocol: 'gemini', description: 'Hybrid Gemini social site with a virtual pub theme — gemlogs and slow-paced social media', category: 'gemini', tags: '["social","community","pub"]' },
  { name: 'Smol.pub', host: 'smol.pub', port: 1965, protocol: 'gemini', description: 'Tiny journal service available on Web, Gopher, and Gemini simultaneously', category: 'gemini', tags: '["hosting","journal","multi-protocol"]' },
  { name: 'Nightfall City', host: 'nightfall.city', port: 1965, protocol: 'gemini', description: 'Vibrant smolnet community directory with Gemini/Gopher/WWW hosting', category: 'gemini', tags: '["community","directory","webring"]' },
  { name: 'Medusae.space', host: 'medusae.space', port: 1965, protocol: 'gemini', description: 'Gemini capsule directory listing various capsules with descriptions and categories', category: 'gemini', tags: '["directory","curated"]' },
  { name: 'Antenna Aggregator', host: 'warmedal.se', port: 1965, protocol: 'gemini', description: 'Geminispace feed aggregator tracking active capsules and new content', category: 'gemini', tags: '["aggregator","feeds","social"]' },
  { name: 'Geddit', host: 'geddit.glv.one', port: 1965, protocol: 'gemini', description: 'Interactive link-sharing service with comments for Geminispace (like Reddit for Gemini)', category: 'gemini', tags: '["social","links","comments"]' },
  { name: 'Capsule.town', host: 'capsule.town', port: 1965, protocol: 'gemini', description: 'Free static Gemini capsule hosting — no sign-up, capsules go live within seconds', category: 'gemini', tags: '["hosting","free","static"]' },

  // ═══════════════════════════════════════════════════════
  // IRC NETWORKS
  // ═══════════════════════════════════════════════════════
  { name: 'Undernet', host: 'us.undernet.org', port: 6667, protocol: 'raw', description: 'One of the oldest IRC networks (~17,500 users) — global network since the early 90s', category: 'irc', tags: '["classic","global","large"]' },
  { name: 'hackint', host: 'irc.hackint.org', port: 6697, protocol: 'raw', description: 'Communication network for the hacker community (~10,800 users) — TLS required', category: 'irc', tags: '["hacker","security","community","ssl"]' },
  { name: 'Rizon', host: 'irc.rizon.net', port: 6697, protocol: 'raw', description: 'Large international IRC network (~9,700 users) — servers across US, EU, and Asia', category: 'irc', tags: '["international","anime","community","ssl"]' },
  { name: 'QuakeNet', host: 'irc.quakenet.org', port: 6667, protocol: 'raw', description: 'Originally founded for Quake gaming community (~5,600 users)', category: 'irc', tags: '["gaming","community","large"]' },
  { name: 'DALnet', host: 'irc.dal.net', port: 6667, protocol: 'raw', description: 'Established IRC network (~5,100 users) — known for user-friendly services', category: 'irc', tags: '["classic","user-friendly"]' },
  { name: 'EsperNet', host: 'irc.esper.net', port: 6697, protocol: 'raw', description: 'Community IRC since 1996 (~1,500 users) — home for gaming and tech chatters', category: 'irc', tags: '["gaming","community","ssl"]' },
  { name: 'Snoonet', host: 'irc.snoonet.org', port: 6697, protocol: 'raw', description: 'Reddit-affiliated IRC network — bridges Reddit communities with IRC chat', category: 'irc', tags: '["reddit","community","ssl"]' },
  { name: '2600net IRC', host: 'irc.2600.net', port: 6667, protocol: 'raw', description: 'Official IRC for 2600 Magazine and hacker community — #2600, #defcon, #hope', category: 'irc', tags: '["hacker","2600","security"]' },

  // ═══════════════════════════════════════════════════════
  // TILDE / PUBNIX SERVERS (SSH)
  // ═══════════════════════════════════════════════════════
  { name: 'ctrl-c.club', host: 'ctrl-c.club', port: 22, protocol: 'ssh', description: 'Linux server for web pages, chat, games, and coding — free SSH accounts since 2014', category: 'sandbox', tags: '["linux","web","games","irc"]', url: 'https://ctrl-c.club' },
  { name: 'Cosmic Voyage', host: 'cosmic.voyage', port: 22, protocol: 'ssh', description: 'Collaborative science-fiction universe tilde — write collaborative sci-fi stories', category: 'sandbox', tags: '["scifi","writing","creative"]', url: 'https://cosmic.voyage' },
  { name: 'tilde.institute', host: 'tilde.institute', port: 22, protocol: 'ssh', description: 'OpenBSD public-access system — explore OpenBSD, gopher/web space, IRC, games', category: 'sandbox', tags: '["openbsd","learning","unix"]', url: 'https://tilde.institute' },
  { name: 'envs.net', host: 'envs.net', port: 22, protocol: 'ssh', description: 'Minimalist, non-commercial shared Unix system — general-purpose tilde since 2018', category: 'sandbox', tags: '["minimalist","linux","services"]', url: 'https://envs.net' },
  { name: 'tilde.cafe', host: 'tilde.cafe', port: 22, protocol: 'ssh', description: 'Debian Linux multi-user server with Gemini games and public message wall', category: 'sandbox', tags: '["debian","games","gemini"]', url: 'https://tilde.cafe' },
  { name: 'aussies.space', host: 'aussies.space', port: 22, protocol: 'ssh', description: 'Australian-focused tilde — physically located in Australia for low-latency Oceania access', category: 'sandbox', tags: '["australian","community"]', url: 'https://aussies.space' },
  { name: 'texto-plano.xyz', host: 'texto-plano.xyz', port: 22, protocol: 'ssh', description: 'Spanish-speaking tilde server for the Hispanic community', category: 'sandbox', tags: '["spanish","community"]', url: 'https://texto-plano.xyz' },
  { name: 'rw.rs', host: 'rw.rs', port: 22, protocol: 'ssh', description: 'Experimental software community with 1990s aesthetic — free shell account and web 1.0 hosting', category: 'sandbox', tags: '["retro","90s","web1.0"]', url: 'https://rw.rs' },
  { name: 'thunix.net', host: 'thunix.net', port: 22, protocol: 'ssh', description: 'Tildeverse member since 2019 — SSH, web/gopher/gemini hosting, email', category: 'sandbox', tags: '["linux","hosting","community"]', url: 'https://thunix.net' },
  { name: 'dimension.sh', host: 'dimension.sh', port: 22, protocol: 'ssh', description: 'Small public Linux shell host/pubnix — web, gopher, and gemini hosting', category: 'sandbox', tags: '["linux","hosting","small"]', url: 'https://dimension.sh' },
  { name: 'squiggle.city', host: 'squiggle.city', port: 22, protocol: 'ssh', description: 'Unix server in the spirit of tilde.club for web pages and learning command line', category: 'sandbox', tags: '["web","learning","community"]' },
  { name: 'vern.cc', host: 'vern.cc', port: 22, protocol: 'ssh', description: 'Non-commercial tilde emphasizing free software — NixOS on Linux-Libre kernel', category: 'sandbox', tags: '["nixos","free-software","privacy"]', url: 'https://vern.cc' },
  { name: 'Skylab.org', host: 'skylab.org', port: 22, protocol: 'ssh', description: 'Community-driven Internet Co-Operative since 1998 — one of the oldest pubnix communities', category: 'sandbox', tags: '["cooperative","veteran","community"]', url: 'https://skylab.org' },
  { name: 'pebble.ink', host: 'pebble.ink', port: 22, protocol: 'ssh', description: 'Retro web-focused tilde server since 2014', category: 'sandbox', tags: '["retro","web"]' },
  { name: 'unix.dog', host: 'unix.dog', port: 22, protocol: 'ssh', description: 'Public UNIX server — welcoming space for furries, queer folks, and allies', category: 'sandbox', tags: '["furry","inclusive","community"]', url: 'https://www.unix.dog' },
  { name: 'hackers.cool', host: 'hackers.cool', port: 22, protocol: 'ssh', description: 'Tilde server for hackers, founded 2014', category: 'sandbox', tags: '["hacking","community"]' },
  { name: 'Blinkenshell', host: 'ssh.blinkenshell.org', port: 2222, protocol: 'ssh', description: 'Free Linux shell accounts — learn Linux, host IRC clients, 100MB storage', category: 'sandbox', tags: '["linux","learning","free"]', url: 'https://blinkenshell.org' },

  // ═══════════════════════════════════════════════════════
  // FINGER SERVERS
  // ═══════════════════════════════════════════════════════
  { name: 'plan.cat', host: 'plan.cat', port: 79, protocol: 'finger', description: 'Active finger server with many users — finger @plan.cat for directory', category: 'finger', tags: '["social",".plan"]' },
  { name: 'HappyNetBox', host: 'happynetbox.com', port: 79, protocol: 'finger', description: 'Modern finger social network — sign up via web, update .plan and .project files', category: 'finger', tags: '["social","web-interface"]' },
  { name: 'graph.no Weather', host: 'graph.no', port: 79, protocol: 'finger', description: 'ASCII weather graph via finger — finger oslo@graph.no for Oslo weather', category: 'finger', tags: '["weather","ascii","graph"]' },

  // ═══════════════════════════════════════════════════════
  // CURL-ABLE APIs & SERVICES
  // ═══════════════════════════════════════════════════════
  { name: 'ASCII.live', host: 'ascii.live', port: 443, protocol: 'https', description: 'Streaming ASCII animations — parrot, nyan cat, rick roll, and more. curl ascii.live/forrest', category: 'ascii-art', tags: '["animation","ascii","curl","fun"]', url: 'https://ascii.live' },
  { name: 'Party Parrot', host: 'parrot.live', port: 443, protocol: 'https', description: 'Dancing ASCII party parrot animation. curl parrot.live', category: 'ascii-art', tags: '["animation","ascii","curl","parrot"]', url: 'https://parrot.live' },
  { name: 'FOAAS', host: 'foaas.com', port: 443, protocol: 'https', description: 'A modern, RESTful, scalable solution to telling people to f*** off', category: 'api', tags: '["humor","profanity","curl","rest"]', url: 'https://foaas.com' },
  { name: 'Useless Facts API', host: 'uselessfacts.jsph.pl', port: 443, protocol: 'https', description: 'Random useless but true facts — supports English and German', category: 'api', tags: '["facts","trivia","curl","fun"]', url: 'https://uselessfacts.jsph.pl' },
  { name: 'Numbers API', host: 'numbersapi.com', port: 80, protocol: 'http', description: 'Interesting facts about numbers — math trivia, dates, years. curl numbersapi.com/42', category: 'api', tags: '["numbers","trivia","math","curl"]', url: 'http://numbersapi.com' },
  { name: 'What The Commit', host: 'whatthecommit.com', port: 443, protocol: 'https', description: 'Random funny commit messages. curl whatthecommit.com/index.txt', category: 'api', tags: '["git","humor","developer","curl"]', url: 'https://whatthecommit.com' },
  { name: 'Stonks Terminal', host: 'stonks.icu', port: 443, protocol: 'https', description: 'ASCII stock chart visualizer. curl stonks.icu/amd', category: 'api', tags: '["finance","stocks","charts","curl"]', url: 'https://stonks.icu' },
  { name: 'Get News Tech', host: 'getnews.tech', port: 443, protocol: 'https', description: 'Read news headlines in your terminal. curl getnews.tech', category: 'api', tags: '["news","headlines","curl","text"]', url: 'https://getnews.tech' },
  { name: 'Bacon Ipsum API', host: 'baconipsum.com', port: 443, protocol: 'https', description: 'Meaty lorem ipsum text generator API', category: 'api', tags: '["lorem-ipsum","text-generator","curl","humor"]', url: 'https://baconipsum.com' },
  { name: 'XKCD Comics API', host: 'xkcd.com', port: 443, protocol: 'https', description: 'Fetch XKCD comic metadata as JSON. curl xkcd.com/info.0.json', category: 'api', tags: '["comics","humor","developer","curl","json"]', url: 'https://xkcd.com' },
  { name: 'JSONPlaceholder', host: 'jsonplaceholder.typicode.com', port: 443, protocol: 'https', description: 'Free fake REST API for testing and prototyping', category: 'api', tags: '["testing","fake-api","developer","curl","json"]', url: 'https://jsonplaceholder.typicode.com' },
  { name: 'Currency Rates (crrcy.sh)', host: 'crrcy.sh', port: 443, protocol: 'https', description: 'Fiat and crypto currency exchange rates with historical charts. curl crrcy.sh', category: 'api', tags: '["currency","exchange","finance","curl","charts"]', url: 'https://crrcy.sh' },

  // ═══════════════════════════════════════════════════════
  // NETWORK TOOLS
  // ═══════════════════════════════════════════════════════
  { name: 'ifconfig.co', host: 'ifconfig.co', port: 443, protocol: 'https', description: 'Your IP, country, city, and ISP. curl ifconfig.co/json for full geolocation', category: 'network-tool', tags: '["ip","geolocation","curl","network"]', url: 'https://ifconfig.co' },
  { name: 'icanhazip.com', host: 'icanhazip.com', port: 443, protocol: 'https', description: 'Simple IP echo — returns just your public IP. curl icanhazip.com', category: 'network-tool', tags: '["ip","simple","curl","network"]', url: 'https://icanhazip.com' },
  { name: 'HackerTarget Network Tools', host: 'api.hackertarget.com', port: 443, protocol: 'https', description: 'Nmap scanning, WHOIS, DNS lookups, subnet calc via API', category: 'network-tool', tags: '["nmap","whois","dns","scanning","curl"]', url: 'https://api.hackertarget.com' },
  { name: 'dns.toys', host: 'dns.toys', port: 53, protocol: 'raw', description: 'Utilities over DNS: weather, world time, unit conversion. dig mumbai.time @dns.toys', category: 'network-tool', tags: '["dns","utilities","weather","time","conversion"]' },
  { name: 'Termbin', host: 'termbin.com', port: 9999, protocol: 'raw', description: 'Terminal pastebin via netcat. echo "hello" | nc termbin.com 9999', category: 'network-tool', tags: '["pastebin","netcat","sharing","text"]' },
  { name: 'The Null Pointer (0x0.st)', host: '0x0.st', port: 443, protocol: 'https', description: 'No-nonsense file hosting and URL shortener. curl -F file=@f.txt 0x0.st', category: 'network-tool', tags: '["filehosting","pastebin","curl","sharing"]', url: 'https://0x0.st' },
  { name: 'transfer.sh', host: 'transfer.sh', port: 443, protocol: 'https', description: 'Easy file sharing from the command line. curl --upload-file ./f.txt transfer.sh/f.txt', category: 'network-tool', tags: '["filesharing","upload","curl","transfer"]', url: 'https://transfer.sh' },
  { name: 'Hurricane Electric Route Server', host: 'route-server.he.net', port: 23, protocol: 'telnet', description: 'Public BGP route server for AS6939 — look up BGP routes and run traceroutes', category: 'network-tool', tags: '["bgp","routing","looking-glass","telnet"]' },
  { name: 'httpstat.us', host: 'httpstat.us', port: 443, protocol: 'https', description: 'Service for testing HTTP status code responses. curl httpstat.us/200', category: 'network-tool', tags: '["http","status-codes","testing","developer","curl"]', url: 'https://httpstat.us' },
  { name: 'dict.org Dictionary', host: 'dict.org', port: 2628, protocol: 'raw', description: 'Dictionary lookups over the DICT protocol — 77+ dictionaries. curl dict://dict.org/d:hello', category: 'network-tool', tags: '["dictionary","reference","language","curl"]' },
  { name: 'asciinema', host: 'asciinema.org', port: 443, protocol: 'https', description: 'Record, share, and replay terminal sessions as lightweight text-based recordings', category: 'network-tool', tags: '["recording","terminal","sharing","developer"]', url: 'https://asciinema.org' },
  { name: 'tmate Terminal Sharing', host: 'tmate.io', port: 22, protocol: 'ssh', description: 'Instant terminal sharing for pair programming — fork of tmux with shareable SSH sessions', category: 'network-tool', tags: '["terminal-sharing","pair-programming","ssh","tmux"]', url: 'https://tmate.io' },

  // ═══════════════════════════════════════════════════════
  // SSH GAMES
  // ═══════════════════════════════════════════════════════
  { name: 'SSHTron', host: 'sshtron.zachlatta.com', port: 22, protocol: 'ssh', description: 'Multiplayer Tron game — WASD or vim keys, up to 4 players. ssh sshtron.zachlatta.com', category: 'game', tags: '["tron","multiplayer","ssh","arcade"]' },
  { name: 'Netris', host: 'netris.rocketnine.space', port: 22, protocol: 'ssh', description: 'Competitive multiplayer Tetris over SSH. ssh netris.rocketnine.space', category: 'game', tags: '["tetris","multiplayer","ssh","competitive"]' },
  { name: 'Bitreich Gameroom', host: 'bitreich.org', port: 22, protocol: 'ssh', description: '11 different arcade games over SSH. ssh gameroom@bitreich.org', category: 'game', tags: '["arcade","multiple-games","ssh","retro"]' },
  { name: 'ASCII Town Games', host: 'ascii.town', port: 22, protocol: 'ssh', description: '2048, Snake, and Freecell over SSH. ssh play@ascii.town', category: 'game', tags: '["2048","snake","freecell","ssh"]' },
  { name: 'NetHack (SSH)', host: 'nethack.alt.org', port: 22, protocol: 'ssh', description: 'The classic roguelike on a public SSH server. ssh nethack@nethack.alt.org', category: 'game', tags: '["nethack","roguelike","classic","ssh"]' },
  { name: 'Rogue Gallery', host: 'rlgallery.org', port: 22, protocol: 'ssh', description: 'Play the original Rogue over SSH. ssh rodney@rlgallery.org', category: 'game', tags: '["rogue","roguelike","classic","ssh"]' },
  { name: 'SSH Minesweeper', host: 'anonymine-demo.oskog97.com', port: 2222, protocol: 'ssh', description: 'Play Minesweeper over SSH. ssh -p 2222 anonymine-demo.oskog97.com', category: 'game', tags: '["minesweeper","puzzle","ssh","classic"]' },
  { name: 'SSH Pacman', host: 'antimirov.net', port: 22, protocol: 'ssh', description: 'Play Pacman via SSH. ssh pacman@antimirov.net (password: pacman)', category: 'game', tags: '["pacman","arcade","ssh","retro"]' },
  { name: 'SSH Games Collection', host: 'sshgames.thegonz.net', port: 22, protocol: 'ssh', description: 'Chess, Khet, roguelikes, and puzzle games over SSH', category: 'game', tags: '["chess","puzzle","roguelike","ssh"]' },
  { name: 'SSH Pong', host: 'pong.brk.st', port: 22, protocol: 'ssh', description: 'Play Pong over SSH. ssh pong.brk.st', category: 'game', tags: '["pong","arcade","ssh","classic"]' },

  // ═══════════════════════════════════════════════════════
  // TELNET GAMES
  // ═══════════════════════════════════════════════════════
  { name: 'Terminal Doom', host: 'doom.w-graj.net', port: 666, protocol: 'telnet', description: 'Play Doom rendered in ASCII in the terminal. telnet doom.w-graj.net 666', category: 'game', tags: '["doom","fps","ascii","telnet"]' },
  { name: 'Free Internet Chess', host: 'freechess.org', port: 5000, protocol: 'telnet', description: 'Play chess against humans over telnet — one of the longest-running chess servers', category: 'game', tags: '["chess","multiplayer","classic","telnet"]' },
  { name: 'Internet Go Server', host: 'igs.joyjoy.net', port: 6969, protocol: 'telnet', description: 'Play Go against other players over telnet', category: 'game', tags: '["go","board-game","multiplayer","telnet"]' },
  { name: 'FIBS Backgammon', host: 'fibs.com', port: 4321, protocol: 'telnet', description: 'First Internet Backgammon Server — play against humans worldwide', category: 'game', tags: '["backgammon","board-game","multiplayer","telnet"]' },
  { name: 'MTREK Star Trek', host: 'mtrek.com', port: 1701, protocol: 'telnet', description: 'Multiplayer Star Trek space combat game on the iconic port 1701', category: 'game', tags: '["star-trek","multiplayer","space","telnet"]' },
  { name: 'DecWars Star Trek', host: 'decwars.com', port: 1701, protocol: 'telnet', description: 'Multiplayer Star Trek strategy game', category: 'game', tags: '["star-trek","strategy","multiplayer","telnet"]' },

  // ═══════════════════════════════════════════════════════
  // ASCII ART
  // ═══════════════════════════════════════════════════════
  { name: 'Rick Roll ASCII', host: 'rya.nc', port: 1987, protocol: 'telnet', description: 'ASCII art Rick Astley — Never Gonna Give You Up in your terminal', category: 'ascii-art', tags: '["rickroll","animation","meme","telnet"]' },
  { name: 'Star Wars ASCII (SSH)', host: 'movie.gabe565.com', port: 22, protocol: 'ssh', description: 'Star Wars ASCII movie with playback controls (pause, seek, speed). ssh movie.gabe565.com', category: 'ascii-art', tags: '["star-wars","movie","animation","ssh"]' },
  { name: 'ASCII Theater', host: 'watch.ascii.theater', port: 22, protocol: 'ssh', description: 'Full movies rendered in ASCII art over SSH — rotating selection of films', category: 'ascii-art', tags: '["movies","ascii","entertainment","ssh"]' },
  { name: 'BOFH Excuse Server', host: 'towel.blinkenlights.nl', port: 666, protocol: 'telnet', description: 'Random IT/sysadmin excuses generator. telnet towel.blinkenlights.nl 666', category: 'ascii-art', tags: '["humor","excuses","sysadmin","telnet"]' },

  // ═══════════════════════════════════════════════════════
  // CHAT
  // ═══════════════════════════════════════════════════════
  { name: 'SSH Chat', host: 'chat.shazow.net', port: 22, protocol: 'ssh', description: 'Chat with strangers over SSH — drops you into a chat room. ssh chat.shazow.net', category: 'chat', tags: '["chat","social","ssh","anonymous"]' },
  { name: 'Devzat', host: 'devzat.hackclub.com', port: 22, protocol: 'ssh', description: 'Developer chat over SSH with rooms, markdown support, and DMs. ssh devzat.hackclub.com', category: 'chat', tags: '["chat","developer","ssh","markdown"]' },

  // ═══════════════════════════════════════════════════════
  // OTHER / UNIQUE
  // ═══════════════════════════════════════════════════════
  { name: 'Terminal Coffee Shop', host: 'terminal.shop', port: 22, protocol: 'ssh', description: 'Order real coffee beans from a TUI store over SSH — fully functional e-commerce', category: 'other', tags: '["coffee","commerce","tui","ssh"]' },
  { name: 'Cointop Crypto Tracker', host: 'cointop.sh', port: 22, protocol: 'ssh', description: 'Interactive cryptocurrency tracking TUI over SSH — real-time prices and charts', category: 'other', tags: '["crypto","finance","tui","ssh","charts"]' },
  { name: 'Monotty VTM', host: 'netxs.online', port: 22, protocol: 'ssh', description: 'Text-based desktop environment over SSH with windows, mouse support, and multiplexer', category: 'other', tags: '["desktop","tui","multiplexer","ssh"]' },
  { name: 'Dutch Teletext', host: 'teletekst.nl', port: 22, protocol: 'ssh', description: 'Browse Dutch NOS Teletext over SSH — nostalgic broadcast data service', category: 'other', tags: '["teletext","dutch","news","retro","ssh"]' },
  { name: 'Soft Serve Git', host: 'git.charm.sh', port: 22, protocol: 'ssh', description: 'Beautiful TUI Git server over SSH — browse repos in your terminal. ssh git.charm.sh', category: 'other', tags: '["git","tui","ssh","charm","developer"]' },
  { name: 'SmolNet Portal', host: 'portal.mozz.us', port: 443, protocol: 'https', description: 'Web proxy for gemini://, gopher://, finger://, spartan://, and nex:// protocols', category: 'other', tags: '["proxy","multi-protocol","gateway"]', url: 'https://portal.mozz.us' },
  { name: 'Bitreich SSH Kiosk', host: 'bitreich.org', port: 22, protocol: 'ssh', description: 'SSH kiosk for browsing gopher via native CLI client. ssh kiosk@bitreich.org', category: 'other', tags: '["gopher-browser","kiosk","ssh"]' },
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
console.log(`Expansion seeded ${count} new entries (${total} total in database)`);

// Print breakdown by category
const cats = db.prepare('SELECT category, COUNT(*) as n FROM entries GROUP BY category ORDER BY n DESC').all();
console.log('\nEntries by category:');
for (const c of cats) {
  console.log(`  ${c.category.padEnd(15)} ${c.n}`);
}
