// Marvel Rivals Maps Data
// This data is used to display proper map names and images in match history

export interface MapData {
  id: number;
  name: string;
  full_name: string;
  location: string;
  description?: string;
  game_mode: string;
  is_competitve: boolean;
  images: string[];
}

export const MARVEL_RIVALS_MAPS: MapData[] = [
  {
    "id": 1032,
    "name": "Yggdrasill Path",
    "full_name": "Yggdrasill Path - Yggsgard",
    "location": "Yggsgard",
    "description": "Beneath the sky-shutting canopy of the World Tree, Yggdrasill, lies the golden glory of Asgard, realm of the gods, now overgrown with the roots and flora. However, the throne-seizing scheme of Loki, god of mischief, threatens the ever-lasting prosperity of this kingdom and all of the Ten Realms.",
    "game_mode": "Convoy",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1032.png",
      "/rivals/maps/medium/map_1032.png",
      "/rivals/maps/large/map_1032.png",
      "/premium/maps/xl/map_1032.png?expires=1759221398&signature=06809cc26b023f4bd1501a2dcfb00680611906a00789c681991ccb3ef93c4167"
    ]
  },
  {
    "id": 1034,
    "name": "Shin-Shibuya",
    "full_name": "Shin-Shibuya - Tokyo 2099",
    "location": "Tokyo 2099",
    "description": "Another world has emerged from the Timestream Entanglement! It's time to have some ramen and sushi after that nature walk! I'm thrilled that these foods still retain their classic flavors even in Tokyo of 2099! But it is a pity that there aren't any Kaiju or giant robots fighting in the city anymore...",
    "game_mode": "Convergence",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1034.png",
      "/rivals/maps/medium/map_1034.png",
      "/rivals/maps/large/map_1034.png",
      "/premium/maps/xl/map_1034.png?expires=1759221398&signature=8a9324f7257c2abbfbb2af095bebf5c583d29fa17d6acc170e5a4d4396e2b6d2"
    ]
  },
  {
    "id": 1101,
    "name": "Hall of Djalia",
    "full_name": "Hall of Djalia - Intergalactic Empire of Wakanda",
    "location": "Intergalactic Empire of Wakanda",
    "game_mode": "Convergence",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1101.png",
      "/rivals/maps/medium/map_1101.png",
      "/rivals/maps/large/map_1101.png",
      "/premium/maps/xl/map_1101.png?expires=1759221398&signature=f5798446bfee8885b272df37a90a8f8ee43b05c15abdc63eeb2e04e127f968fe"
    ]
  },
  {
    "id": 1118,
    "name": "Sanctum Sanctorum",
    "full_name": "Sanctum Sanctorum - Empire of Eternal Night",
    "location": "Empire of Eternal Night",
    "description": "Doctor Strange's Sanctum Sanctorum stands as the last beacon of hope in a city consumed by darkness. Protected by ancient wards and powerful magic, it serves as a refuge for those battling the chaos unleashed by Dracula and his legion. Explore its eerie corridors and powerful secrets as you prepare to face the chaos unleashed by Dracula's dark forces. Are you ready to step into the shadows and uncover the secrets of the Sanctum?",
    "game_mode": "Doom match",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1118.png",
      "/rivals/maps/medium/map_1118.png",
      "/rivals/maps/large/map_1118.png",
      "/premium/maps/xl/map_1118.png?expires=1759221398&signature=852c4b2e595ed73398efb7a1099cb8b930e2d2622f2db97018333ee39e3e219a"
    ]
  },
  {
    "id": 1148,
    "name": "Spider-Islands",
    "full_name": "Spider-Islands - Tokyo 2099",
    "location": "Tokyo 2099",
    "description": "Take a journey above Tokyo 2099 into the Web of Life and Destiny! To patch up the temporal rift, the Master Weaver is working around the clock to spin his magic while also suspending an entire network of islands aloft, far above from the urban hustle. As a lover of time, he's preserved many more classic Japanese elements, from zen gardens to his own sacred tenshu, where he protects a personal sliver of the Web of Life and Destiny itself. It seems that weaving the Multiverse back together is difficult for one spider, so let's get Spider-Zero back in action!",
    "game_mode": "Convoy",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1148.png",
      "/rivals/maps/medium/map_1148.png",
      "/rivals/maps/large/map_1148.png",
      "/premium/maps/xl/map_1148.png?expires=1759221398&signature=d6ba7b0e34b33bc88ad6a7659991925ab6dcc90a32e7ccf2313a494dd74db078"
    ]
  },
  {
    "id": 1155,
    "name": "Bifrost Garden",
    "full_name": "Bifrost Garden - Royal Palace",
    "location": "Yggsgard",
    "description": "Beneath the sky-shutting canopy of the World Tree, Yggdrasill, lies the golden glory of Asgard, realm of the gods, now overgrown with the roots and flora. However, the throne-seizing scheme of Loki, god of mischief, threatens the ever-lasting prosperity of this kingdom and all of the Ten Realms.",
    "game_mode": "Domination",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1155.png",
      "/rivals/maps/medium/map_1155.png",
      "/rivals/maps/large/map_1155.png",
      "/premium/maps/xl/map_1155.png?expires=1759221398&signature=b0d828ab69f464642f67b2aba97b3a414f9200bb7259b751d8c66abb386a678b"
    ]
  },
  {
    "id": 1156,
    "name": "Throne Room",
    "full_name": "Throne Room - Royal Palace",
    "location": "Yggsgard",
    "description": "Beneath the sky-shutting canopy of the World Tree, Yggdrasill, lies the golden glory of Asgard, realm of the gods, now overgrown with the roots and flora. However, the throne-seizing scheme of Loki, god of mischief, threatens the ever-lasting prosperity of this kingdom and all of the Ten Realms.",
    "game_mode": "Domination",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1156.png",
      "/rivals/maps/medium/map_1156.png",
      "/rivals/maps/large/map_1156.png",
      "/premium/maps/xl/map_1156.png?expires=1759221398&signature=a1d710220200cb602a48661497c7aa5510b5c3f0916c83c87f6abd49b03ebeca"
    ]
  },
  {
    "id": 1161,
    "name": "Stellar Spaceport",
    "full_name": "Stellar Spaceport - Birnin T'Challa",
    "location": "Intergalactic Empire of Wakanda",
    "description": "From a single Vibranium meteorite, Wakanda rose to greatness. Now, at the heart of the galaxy, they've uncovered the homeland of that very mound. But no matter how far it's technology advances, Wakanda's strength will always be its people. Wakanda Forever!",
    "game_mode": "Domination",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1161.png",
      "/rivals/maps/medium/map_1161.png",
      "/rivals/maps/large/map_1161.png",
      "/premium/maps/xl/map_1161.png?expires=1759221398&signature=cad3aa4cdbc866ad7724a883c87787b5b239d4b44f58dfe2e464ce711dc67a93"
    ]
  },
  {
    "id": 1162,
    "name": "Imperial Institute of Science",
    "full_name": "Imperial Institute of Science - Birnin T'Challa",
    "location": "Intergalactic Empire of Wakanda",
    "description": "From a single Vibranium meteorite, Wakanda rose to greatness. Now, at the heart of the galaxy, they've uncovered the homeland of that very mound. But no matter how far it's technology advances, Wakanda's strength will always be its people. Wakanda Forever!",
    "game_mode": "Domination",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1162.png",
      "/rivals/maps/medium/map_1162.png",
      "/rivals/maps/large/map_1162.png",
      "/premium/maps/xl/map_1162.png?expires=1759221398&signature=ac4926f01b629deeb185ac78df80766eb88a1a78f4443e6200f29363b6af5db6"
    ]
  },
  {
    "id": 1169,
    "name": "Warrior Falls",
    "full_name": "Warrior Falls - Birnin T'Challa",
    "location": "Intergalactic Empire of Wakanda",
    "description": "From a single Vibranium meteorite, Wakanda rose to greatness. Now, at the heart of the galaxy, they've uncovered the homeland of that very mound. But no matter how far it's technology advances, Wakanda's strength will always be its people. Wakanda Forever!",
    "game_mode": "Domination",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1169.png",
      "/rivals/maps/medium/map_1169.png",
      "/rivals/maps/large/map_1169.png",
      "/premium/maps/xl/map_1169.png?expires=1759221398&signature=daac8639af8f90fa8a24f14349a8e02f1968ce3314db378c0bba70acf27a64a8"
    ]
  },
  {
    "id": 1170,
    "name": "Royal Palace",
    "full_name": "Royal Palace - Yggsgard",
    "location": "Yggsgard",
    "description": "Beneath the sky-shutting canopy of the World Tree, Yggdrasill, lies the golden glory of Asgard, realm of the gods, now overgrown with the roots and flora. However, the throne-seizing scheme of Loki, god of mischief, threatens the ever-lasting prosperity of this kingdom and all of the Ten Realms.",
    "game_mode": "Domination",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1170.png",
      "/rivals/maps/medium/map_1170.png",
      "/rivals/maps/large/map_1170.png",
      "/premium/maps/xl/map_1170.png?expires=1759221398&signature=22aeb56d5f0c42abd10e6a53c36132647e831ad8f44444ad19e042576427623f"
    ]
  },
  {
    "id": 1201,
    "name": "Midtown",
    "full_name": "Midtown - Empire of Eternal Night",
    "location": "Empire of Eternal Night",
    "description": "Midtown has fallen into eternal night, overrun by Dracula and his bloodthirsty legions. Iconic landmarks like the Baxter Building and Grand Central Terminal have become battlegrounds in the fight for survival. Heroes must navigate the twisted streets and uncover the secrets lurking in the heart of the darkness.",
    "game_mode": "Convoy",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1201.png",
      "/rivals/maps/medium/map_1201.png",
      "/rivals/maps/large/map_1201.png",
      "/premium/maps/xl/map_1201.png?expires=1759221398&signature=c82d56fd2aa55931f1237ac38a59336af0d23f12e3437f46328eed63b9ac6d4b"
    ]
  },
  {
    "id": 1230,
    "name": "Shin-Shibuya",
    "full_name": "Shin-Shibuya - Tokyo 2099",
    "location": "Tokyo 2099",
    "description": "Another world has emerged from the Timestream Entanglement! It's time to have some ramen and sushi after that nature walk! I'm thrilled that these foods still retain their classic flavors even in Tokyo of 2099! But it is a pity that there aren't any Kaiju or giant robots fighting in the city anymore...",
    "game_mode": "Convergence",
    "is_competitve": true,
    "images": [
      "/rivals/maps/map_1230.png",
      "/rivals/maps/medium/map_1230.png",
      "/rivals/maps/large/map_1230.png",
      "/premium/maps/xl/map_1230.png?expires=1759221398&signature=b0eaf7c6633828d91a5d6be49877004913e98128ae0cdb192970b4e6ac2e41ed"
    ]
  },
  {
    "id": 1231,
    "name": "Yggdrasill Path",
    "full_name": "Yggdrasill Path - Yggsgard",
    "location": "Yggsgard",
    "description": "Beneath the sky-shutting canopy of the World Tree, Yggdrasill, lies the golden glory of Asgard, realm of the gods, now overgrown with the roots and flora. However, the throne-seizing scheme of Loki, god of mischief, threatens the ever-lasting prosperity of this kingdom and all of the Ten Realms.",
    "game_mode": "Convoy",
    "is_competitve": true,
    "images": [
      "/rivals/maps/map_1231.png",
      "/rivals/maps/medium/map_1231.png",
      "/rivals/maps/large/map_1231.png",
      "/premium/maps/xl/map_1231.png?expires=1759221398&signature=931c57e293f2e5228ee4b125549e8d31d702b843728c8c491c31564d938a3c41"
    ]
  },
  {
    "id": 1235,
    "name": "Birnin T'Challa",
    "full_name": "Birnin T'Challa - Intergalactic Empire of Wakanda",
    "location": "Intergalactic Empire of Wakanda",
    "description": "From a single Vibranium meteorite, Wakanda rose to greatness. Now, at the heart of the galaxy, they've uncovered the homeland of that very mound. But no matter how far it's technology advances, Wakanda's strength will always be its people. Wakanda Forever!",
    "game_mode": "Domination",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1235.png",
      "/rivals/maps/medium/map_1235.png",
      "/rivals/maps/large/map_1235.png",
      "/premium/maps/xl/map_1235.png?expires=1759221398&signature=84a8a8ba5bd521c6495e1eb6b9f89449a35a32e64f862e2f401f509a67664725"
    ]
  },
  {
    "id": 1236,
    "name": "Royal Palace",
    "full_name": "Royal Palace - Yggsgard",
    "location": "Yggsgard",
    "description": "Beneath the sky-shutting canopy of the World Tree, Yggdrasill, lies the golden glory of Asgard, realm of the gods, now overgrown with the roots and flora. However, the throne-seizing scheme of Loki, god of mischief, threatens the ever-lasting prosperity of this kingdom and all of the Ten Realms.",
    "game_mode": "Domination",
    "is_competitve": true,
    "images": [
      "/rivals/maps/map_1236.png",
      "/rivals/maps/medium/map_1236.png",
      "/rivals/maps/large/map_1236.png",
      "/premium/maps/xl/map_1236.png?expires=1759221398&signature=4ac4ff6f12ea06ce71f0878d6ef52d797d8a28ce88ec7732d02f1ae71aeb63ef"
    ]
  },
  {
    "id": 1240,
    "name": "Symbiotic Surface",
    "full_name": "Symbiotic Surface - Klyntar",
    "location": "Klyntar",
    "description": "Stirred awake by the Timestream Entanglement, Knull taps into Chronovium to spread his dark divinity across the gods and free himself from his prison planet: Klyntar. Sensing the looming threat, Venom rushes to consume the severed essence of the god before Knull fully revives! On a mission from Shuri, the Milano malfunctions and crash lands in the ruins of the Agents of the Cosmos. Now, the Guardians of the Galaxy clash with Venom over how to use this dark power. Will they decide to join forces against Knull or will true evil ultimately emerge victorious?",
    "game_mode": "Convergence",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1240.png",
      "/rivals/maps/medium/map_1240.png",
      "/rivals/maps/large/map_1240.png",
      "/premium/maps/xl/map_1240.png?expires=1759221398&signature=5f956859c10edd3aec7afcb6b944b7779bc79c3850d4f0fbc6a79783206b86f0"
    ]
  },
  {
    "id": 1243,
    "name": "Super-Soldier Factory",
    "full_name": "Super-Soldier Factory - Hydra Charteris Base",
    "location": "Hydra Charteris Base",
    "description": "Battered into dormancy for decades, Hydra has hidden its dark ambitions behind the chaos of the times... but as time falls apart, that chaos will usher in a new era for the evil organization... Beneath Charteris Base in Antarctica, Hydra has reawakened a gateway to its otherworldly deity, and the key is the crystal formed from chronal energy. As the ancient Hive approaches from beyond, Hydra seeks to channel its power into a new army of super-soldiers. As the ancient cult prepares to welcome all timelines to its alien chorus, are the heroes truly prepared to confront the many heads of Hydra?",
    "game_mode": "Domination",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1243.png",
      "/rivals/maps/medium/map_1243.png",
      "/rivals/maps/large/map_1243.png",
      "/premium/maps/xl/map_1243.png?expires=1759221398&signature=a06d588894cd83b955cdbc3b04d283ceb43e6e18c2442e4691017bc7357e45e5"
    ]
  },
  {
    "id": 1244,
    "name": "Frozen Airfield",
    "full_name": "Frozen Airfield - Hydra Charteris Base",
    "location": "Hydra Charteris Base",
    "description": "Battered into dormancy for decades, Hydra has hidden its dark ambitions behind the chaos of the times... but as time falls apart, that chaos will usher in a new era for the evil organization... Beneath Charteris Base in Antarctica, Hydra has reawakened a gateway to its otherworldly deity, and the key is the crystal formed from chronal energy. As the ancient Hive approaches from beyond, Hydra seeks to channel its power into a new army of super-soldiers. As the ancient cult prepares to welcome all timelines to its alien chorus, are the heroes truly prepared to confront the many heads of Hydra?",
    "game_mode": "Domination",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1244.png",
      "/rivals/maps/medium/map_1244.png",
      "/rivals/maps/large/map_1244.png",
      "/premium/maps/xl/map_1244.png?expires=1759221398&signature=a4960c064ede9f399e5ddd946f565888db3caa9bd45295fd26b3a9700351dd58"
    ]
  },
  {
    "id": 1245,
    "name": "Spider-Islands",
    "full_name": "Spider-Islands - Tokyo 2099",
    "location": "Tokyo 2099",
    "description": "Take a journey above Tokyo 2099 into the Web of Life and Destiny! To patch up the temporal rift, the Master Weaver is working around the clock to spin his magic while also suspending an entire network of islands aloft, far above from the urban hustle. As a lover of time, he's preserved many more classic Japanese elements, from zen gardens to his own sacred tenshu, where he protects a personal sliver of the Web of Life and Destiny itself. It seems that weaving the Multiverse back together is difficult for one spider, so let's get Spider-Zero back in action!",
    "game_mode": "Convoy",
    "is_competitve": true,
    "images": [
      "/rivals/maps/map_1245.png",
      "/rivals/maps/medium/map_1245.png",
      "/rivals/maps/large/map_1245.png",
      "/premium/maps/xl/map_1245.png?expires=1759221398&signature=e216e43d58ca7e635495a72edfd038b085c877aef0df351459aaa2ca3292a5ba"
    ]
  },
  {
    "id": 1246,
    "name": "Ninomaru",
    "full_name": "Ninomaru - Tokyo 2099",
    "location": "Tokyo 2099",
    "game_mode": "Conquest",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1246.png",
      "/rivals/maps/medium/map_1246.png",
      "/rivals/maps/large/map_1246.png",
      "/premium/maps/xl/map_1246.png?expires=1759221398&signature=fd35b64ba1fdbab3ac020c731a9f0820c7dbab9a3873cf7fa1aa160ebd807755"
    ]
  },
  {
    "id": 1254,
    "name": "Royal Palace",
    "full_name": "Royal Palace - Yggsgard",
    "location": "Yggsgard",
    "description": "Beneath the sky-shutting canopy of the World Tree, Yggdrasill, lies the golden glory of Asgard, realm of the gods, now overgrown with the roots and flora. However, the throne-seizing scheme of Loki, god of mischief, threatens the ever-lasting prosperity of this kingdom and all of the Ten Realms.",
    "game_mode": "Jeff's winter splash festival",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1254.png",
      "/rivals/maps/medium/map_1254.png",
      "/rivals/maps/large/map_1254.png",
      "/premium/maps/xl/map_1254.png?expires=1759221398&signature=3aa62a9b8b25c57507377d67b383d04fd76b1071abdf1d00f44f84d667bd364b"
    ]
  },
  {
    "id": 1267,
    "name": "Hall of Djalia",
    "full_name": "Hall of Djalia - Intergalactic Empire of Wakanda",
    "location": "Intergalactic Empire of Wakanda",
    "game_mode": "Convergence",
    "is_competitve": true,
    "images": [
      "/rivals/maps/map_1267.png",
      "/rivals/maps/medium/map_1267.png",
      "/rivals/maps/large/map_1267.png",
      "/premium/maps/xl/map_1267.png?expires=1759221398&signature=4c58443e0db40156b014276c2b3361b507b140791dca4db6387b9b99d0e95983"
    ]
  },
  {
    "id": 1272,
    "name": "Birnin T'Challa",
    "full_name": "Birnin T'Challa - Intergalactic Empire of Wakanda",
    "location": "Intergalactic Empire of Wakanda",
    "description": "From a single Vibranium meteorite, Wakanda rose to greatness. Now, at the heart of the galaxy, they've uncovered the homeland of that very mound. But no matter how far it's technology advances, Wakanda's strength will always be its people. Wakanda Forever!",
    "game_mode": "Domination",
    "is_competitve": true,
    "images": [
      "/rivals/maps/map_1272.png",
      "/rivals/maps/medium/map_1272.png",
      "/rivals/maps/large/map_1272.png",
      "/premium/maps/xl/map_1272.png?expires=1759221398&signature=2aaaa7c1d0498031c3e8ec2fbad778e690d075ce6d425199802e5c8ec2d6b1b9"
    ]
  },
  {
    "id": 1287,
    "name": "Hell's Heaven",
    "full_name": "Hell's Heaven - Hydra Charteris Base",
    "location": "Hydra Charteris Base",
    "description": "Battered into dormancy for decades, Hydra has hidden its dark ambitions behind the chaos of the times... but as time falls apart, that chaos will usher in a new era for the evil organization... Beneath Charteris Base in Antarctica, Hydra has reawakened a gateway to its otherworldly deity, and the key is the crystal formed from chronal energy. As the ancient Hive approaches from beyond, Hydra seeks to channel its power into a new army of super-soldiers. As the ancient cult prepares to welcome all timelines to its alien chorus, are the heroes truly prepared to confront the many heads of Hydra?",
    "game_mode": "Domination",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1287.png",
      "/rivals/maps/medium/map_1287.png",
      "/rivals/maps/large/map_1287.png",
      "/premium/maps/xl/map_1287.png?expires=1759221398&signature=ccb23195496726e08afddf69b6bc003ec88bdf09dae2a0301a9796ff76e00f2f"
    ]
  },
  {
    "id": 1288,
    "name": "Hell's Heaven",
    "full_name": "Hell's Heaven - Hydra Charteris Base",
    "location": "Hydra Charteris Base",
    "description": "Battered into dormancy for decades, Hydra has hidden its dark ambitions behind the chaos of the times... but as time falls apart, that chaos will usher in a new era for the evil organization... Beneath Charteris Base in Antarctica, Hydra has reawakened a gateway to its otherworldly deity, and the key is the crystal formed from chronal energy. As the ancient Hive approaches from beyond, Hydra seeks to channel its power into a new army of super-soldiers. As the ancient cult prepares to welcome all timelines to its alien chorus, are the heroes truly prepared to confront the many heads of Hydra?",
    "game_mode": "Domination",
    "is_competitve": true,
    "images": [
      "/rivals/maps/map_1288.png",
      "/rivals/maps/medium/map_1288.png",
      "/rivals/maps/large/map_1288.png",
      "/premium/maps/xl/map_1288.png?expires=1759221398&signature=e0e11042940cde2bfe2b2edd34577d29bda80be93ab06fc227d5e0caf4395d2c"
    ]
  },
  {
    "id": 1289,
    "name": "Dancing Stage",
    "full_name": "Dancing Stage - Intergalactic Empire of Wakanda",
    "location": "Intergalactic Empire of Wakanda",
    "game_mode": "Clash of dancing lions",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1289.png",
      "/rivals/maps/medium/map_1289.png",
      "/rivals/maps/large/map_1289.png",
      "/premium/maps/xl/map_1289.png?expires=1759221398&signature=e9422dae3716160c3d2b1b7efe12698423de10f37cc1b56556326e613715d617"
    ]
  },
  {
    "id": 1290,
    "name": "Symbiotic Surface",
    "full_name": "Symbiotic Surface - Klyntar",
    "location": "Klyntar",
    "description": "Stirred awake by the Timestream Entanglement, Knull taps into Chronovium to spread his dark divinity across the gods and free himself from his prison planet: Klyntar. Sensing the looming threat, Venom rushes to consume the severed essence of the god before Knull fully revives! On a mission from Shuri, the Milano malfunctions and crash lands in the ruins of the Agents of the Cosmos. Now, the Guardians of the Galaxy clash with Venom over how to use this dark power. Will they decide to join forces against Knull or will true evil ultimately emerge victorious?",
    "game_mode": "Convergence",
    "is_competitve": true,
    "images": [
      "/rivals/maps/map_1290.png",
      "/rivals/maps/medium/map_1290.png",
      "/rivals/maps/large/map_1290.png",
      "/premium/maps/xl/map_1290.png?expires=1759221398&signature=b3fd57937f1df8516069a903ce4998e710c49f2e70374e820d7b4e4a5d87675b"
    ]
  },
  {
    "id": 1291,
    "name": "Midtown",
    "full_name": "Midtown - Empire of Eternal Night",
    "location": "Empire of Eternal Night",
    "description": "Midtown has fallen into eternal night, overrun by Dracula and his bloodthirsty legions. Iconic landmarks like the Baxter Building and Grand Central Terminal have become battlegrounds in the fight for survival. Heroes must navigate the twisted streets and uncover the secrets lurking in the heart of the darkness.",
    "game_mode": "Convoy",
    "is_competitve": true,
    "images": [
      "/rivals/maps/map_1291.png",
      "/rivals/maps/medium/map_1291.png",
      "/rivals/maps/large/map_1291.png",
      "/premium/maps/xl/map_1291.png?expires=1759221398&signature=f0788074d4a208f6d45e7210b74e653c0276a0b9a6f386011ce2482b296701c4"
    ]
  },
  {
    "id": 1292,
    "name": "Central Park",
    "full_name": "Central Park - Empire of Eternal Night",
    "location": "Empire of Eternal Night",
    "description": "When the Timestream Entanglement swept over New York City, Dracula seized the opportunity with Doctor Doom's gift, stopping the moon and declaring an eternal night with the power of Chronovium! Now, the heroes are ready to take the battle to his gothic headquarters within Central Park.. Traverse into complete darkness to discover the imprisoned powers on the path to Dracula's Castle.",
    "game_mode": "Convergence",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1292.png",
      "/rivals/maps/medium/map_1292.png",
      "/rivals/maps/large/map_1292.png",
      "/premium/maps/xl/map_1292.png?expires=1759221398&signature=bb0536629142183d285008d435ce412118599540b339cb8e700041399a0ffca4"
    ]
  },
  {
    "id": 1217,
    "name": "Central Park",
    "full_name": "Central Park - Empire of Eternal Night",
    "location": "Empire of Eternal Night",
    "description": "When the Timestream Entanglement swept over New York City, Dracula seized the opportunity with Doctor Doom's gift, stopping the moon and declaring an eternal night with the power of Chronovium! Now, the heroes are ready to take the battle to his gothic headquarters within Central Park.. Traverse into complete darkness to discover the imprisoned powers on the path to Dracula's Castle.",
    "game_mode": "Convergence",
    "is_competitve": true,
    "images": [
      "/rivals/maps/map_1217.png",
      "/rivals/maps/medium/map_1217.png",
      "/rivals/maps/large/map_1217.png",
      "/premium/maps/xl/map_1217.png?expires=1759221398&signature=605cc4133347287f8cb5a787a37ff63bfc963c5841fa398bfbdb274d4f117f10"
    ]
  },
  {
    "id": 1302,
    "name": "Birnin T'Challa",
    "full_name": "Intergalactic Empire of Wakanda: Birnin T'Challa",
    "location": "Intergalactic Empire of Wakanda",
    "description": "From a single Vibranium meteorite, Wakanda rose to greatness. Now, at the heart of the galaxy, they've uncovered the homeland of that very mound. But no matter how far it's technology advances, Wakanda's strength will always be its people. Wakanda Forever!",
    "game_mode": "Clone Rumble",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1302.png",
      "/rivals/maps/medium/map_1302.png",
      "/rivals/maps/large/map_1302.png",
      "/premium/maps/xl/map_1302.png?expires=1759221398&signature=78d000d999ec413445e00af35dde0b19ac27ac3ad7b9fa35f8a3256cfa79d9f4"
    ]
  },
  {
    "id": 1304,
    "name": "Krakoa",
    "full_name": "Hellfire Gala: Krakoa",
    "location": "Hellfire Gala",
    "description": "The 2099 Hellfire Gala is underway, and Emma Frost is dazzling in her finery, expertly mingling with the crowd. With guests being properly entertained and the Mutants' guards down, the timing is perfect for Ultron to crash this invite-only event! It's up to the Quiet Council to get these unruly invaders under control, and their guests safe.\n\nMove with grace and precision across the Gala to stop the imminent infection being spread by Ultron and his robots.\n\nCan you keep your cool and elegance in the face of disaster?",
    "game_mode": "Domination",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1304.png",
      "/rivals/maps/medium/map_1304.png",
      "/rivals/maps/large/map_1304.png",
      "/premium/maps/xl/map_1304.png?expires=1759221398&signature=4b6f0fdd2c122457ad5578f658389a3686b143e5c35fefd840dc64d5ea45e1e0"
    ]
  },
  {
    "id": 1309,
    "name": "Krakoa",
    "full_name": "Hellfire Gala: Krakoa",
    "location": "Hellfire Gala",
    "description": "The 2099 Hellfire Gala is underway, and Emma Frost is dazzling in her finery, expertly mingling with the crowd. With guests being properly entertained and the Mutants' guards down, the timing is perfect for Ultron to crash this invite-only event! It's up to the Quiet Council to get these unruly invaders under control, and their guests safe.\n\nMove with grace and precision across the Gala to stop the imminent infection being spread by Ultron and his robots.\n\nCan you keep your cool and elegance in the face of disaster?",
    "game_mode": "Domination",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1309.png",
      "/rivals/maps/medium/map_1309.png",
      "/rivals/maps/large/map_1309.png",
      "/premium/maps/xl/map_1309.png?expires=1759221398&signature=74dcaa6a8592f64aaed742e285f010af49b2985d1df6fb471a885ba2d39a9755"
    ]
  },
  {
    "id": 1310,
    "name": "Krakoa",
    "full_name": "Hellfire Gala: Krakoa",
    "location": "Hellfire Gala",
    "description": "The 2099 Hellfire Gala is underway, and Emma Frost is dazzling in her finery, expertly mingling with the crowd. With guests being properly entertained and the Mutants' guards down, the timing is perfect for Ultron to crash this invite-only event! It's up to the Quiet Council to get these unruly invaders under control, and their guests safe.\n\nMove with grace and precision across the Gala to stop the imminent infection being spread by Ultron and his robots.\n\nCan you keep your cool and elegance in the face of disaster?",
    "game_mode": "Domination",
    "is_competitve": true,
    "images": [
      "/rivals/maps/map_1310.png",
      "/rivals/maps/medium/map_1310.png",
      "/rivals/maps/large/map_1310.png",
      "/premium/maps/xl/map_1310.png?expires=1759221398&signature=84a274b9df408b0bed1311dd1c935f083531eb87f955ca3939bac020aadaf411"
    ]
  },
  {
    "id": 1273,
    "name": "Grove",
    "full_name": "Hellfire Gala: Krakoa",
    "location": "Hellfire Gala",
    "description": "The 2099 Hellfire Gala is underway, and Emma Frost is dazzling in her finery, expertly mingling with the crowd. With guests being properly entertained and the Mutants' guards down, the timing is perfect for Ultron to crash this invite-only event! It's up to the Quiet Council to get these unruly invaders under control, and their guests safe.\n\nMove with grace and precision across the Gala to stop the imminent infection being spread by Ultron and his robots.\n\nCan you keep your cool and elegance in the face of disaster?",
    "game_mode": "Domination",
    "is_competitve": true,
    "images": [
      "/rivals/maps/map_1273.png",
      "/rivals/maps/medium/map_1273.png",
      "/rivals/maps/large/map_1273.png",
      "/premium/maps/xl/map_1273.png?expires=1759221398&signature=575474ebaffd8d37ddb41e5eacaee25d6368759839e3b2db8ae8e5c9006652fb"
    ]
  },
  {
    "id": 1281,
    "name": "Carousel",
    "full_name": "Hellfire Gala: Krakoa",
    "location": "Hellfire Gala",
    "description": "The 2099 Hellfire Gala is underway, and Emma Frost is dazzling in her finery, expertly mingling with the crowd. With guests being properly entertained and the Mutants' guards down, the timing is perfect for Ultron to crash this invite-only event! It's up to the Quiet Council to get these unruly invaders under control, and their guests safe.\n\nMove with grace and precision across the Gala to stop the imminent infection being spread by Ultron and his robots.\n\nCan you keep your cool and elegance in the face of disaster?",
    "game_mode": "Domination",
    "is_competitve": true,
    "images": [
      "/rivals/maps/map_1281.png",
      "/rivals/maps/medium/map_1281.png",
      "/rivals/maps/large/map_1281.png",
      "/premium/maps/xl/map_1281.png?expires=1759221398&signature=fba13ec9c7102874d5697eb443184d7e10540dd776f3f548071d3997123da24e"
    ]
  },
  {
    "id": 1286,
    "name": "Arakko",
    "full_name": "Hellfire Gala: Arakko: Sister Island of Krakoa",
    "location": "Hellfire Gala",
    "description": "Escort the \"Avatar of Krakoa\" payload through two checkpoints and to the Great Ring",
    "game_mode": "Convoy",
    "is_competitve": true,
    "images": [
      "/rivals/maps/map_1286.png",
      "/rivals/maps/medium/map_1286.png",
      "/rivals/maps/large/map_1286.png",
      "/premium/maps/xl/map_1286.png?expires=1759221398&signature=c1233b9906f304aa170fc64e251326ced03ce770b8213c0944d6f600a0b79b76"
    ]
  },
  {
    "id": 1294,
    "name": "Celestial Codex",
    "full_name": "Klyntar: Celestial Husk: Celestial Codex",
    "location": "Klyntar",
    "description": "N/A",
    "game_mode": "Domination",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1294.png",
      "/rivals/maps/medium/map_1294.png",
      "/rivals/maps/large/map_1294.png",
      "/premium/maps/xl/map_1294.png?expires=1759221398&signature=76c32e60f4e26de5f4e82f17aada11d946c14e15a89f9179ab88b06fb2841bc4"
    ]
  },
  {
    "id": 1295,
    "name": "Celestial Vault",
    "full_name": "Klyntar: Celestial Husk: Celestial Vault",
    "location": "Klyntar",
    "description": "N/A",
    "game_mode": "Domination",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1295.png",
      "/rivals/maps/medium/map_1295.png",
      "/rivals/maps/large/map_1295.png",
      "/premium/maps/xl/map_1295.png?expires=1759221398&signature=96d21f657f648d67c7ed03712216bfccd8780c410cb0f025e9fea1a64b08f695"
    ]
  },
  {
    "id": 1296,
    "name": "Celestial Hand",
    "full_name": "Klyntar: Celestial Husk: Celestial Hand",
    "location": "Klyntar",
    "description": "N/A",
    "game_mode": "Domination",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1296.png",
      "/rivals/maps/medium/map_1296.png",
      "/rivals/maps/large/map_1296.png",
      "/premium/maps/xl/map_1296.png?expires=1759221398&signature=35811afcfe17450675f65e91164ae82d10500d3446dd135715e5ee504718445a"
    ]
  },
  {
    "id": 1311,
    "name": "Arakko",
    "full_name": "Hellfire Gala: Arakko: Sister Island of Krakoa",
    "location": "Hellfire Gala",
    "description": "Escort the \"Avatar of Krakoa\" payload through two checkpoints and to the Great Ring",
    "game_mode": "Convoy",
    "is_competitve": true,
    "images": [
      "/rivals/maps/map_1311.png",
      "/rivals/maps/medium/map_1311.png",
      "/rivals/maps/large/map_1311.png",
      "/premium/maps/xl/map_1311.png?expires=1759221398&signature=3c23a1ca698e091d09ab3562a1976b200d082325ebba3bf27f9b214e8fa09564"
    ]
  },
  {
    "id": 1312,
    "name": "Ninomaru",
    "full_name": "Tokyo 2099: Ninomaru",
    "location": "Tokyo 2099",
    "description": "In this mode, players can play as one of 2 randomly-selected Heroes. Any Heroes can be selected, unlike in Clone Rumble where some Heroes were excluded.\n\nPlayers try to score as many eliminations as possible, while also trying not to die to deny their opponents additional points. Teams don't get points for kills, but instead enemies drop Chronovium after death that give points to the opposing team. This Chronovium become more valuable over time. A team can win by either scoring 50 points, or by scoring more points than the opposing team before time runs out.\n\nThe Heroes' larger heads have little impact on gameplay other than making opponents easier to spot and hit.",
    "game_mode": "Arcade",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1312.png",
      "/rivals/maps/medium/map_1312.png",
      "/rivals/maps/large/map_1312.png",
      "/premium/maps/xl/map_1312.png?expires=1759221398&signature=8c09ad21aaaaf8594b4d36bbe242e7b64e6ff32094e6fed647a3c89b983ab22a"
    ]
  },
  {
    "id": 1313,
    "name": "Ninomaru",
    "full_name": "Tokyo 2099: Ninomaru",
    "location": "Tokyo 2099",
    "description": "In this mode, players can play as one of 2 randomly-selected Heroes. Any Heroes can be selected, unlike in Clone Rumble where some Heroes were excluded.\n\nPlayers try to score as many eliminations as possible, while also trying not to die to deny their opponents additional points. Teams don't get points for kills, but instead enemies drop Chronovium after death that give points to the opposing team. This Chronovium become more valuable over time. A team can win by either scoring 50 points, or by scoring more points than the opposing team before time runs out.\n\nThe Heroes' larger heads have little impact on gameplay other than making opponents easier to spot and hit.",
    "game_mode": "Arcade",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1313.png",
      "/rivals/maps/medium/map_1313.png",
      "/rivals/maps/large/map_1313.png",
      "/premium/maps/xl/map_1313.png?expires=1759221398&signature=3fe07fa5d2cc34db665fe51c5fda2c755d03489829892e4f110e9a369178581b"
    ]
  },
  {
    "id": 1314,
    "name": "Digital Duel Grounds",
    "full_name": "Karkoa: Digital Duel Grounds",
    "location": "Karkoa",
    "description": "Ultron's Battle Matrix Protocol is a tactical, strategy-based, team-builder gamemode. Players will play as an Ultron Drone and select their team of 6 Heroes which will be controlled by AIs. Players can unlock Cards which will enhance specific Hero's or a full Class' abilities. Players then place their Heroes on the battlefield to prepare for combat.\n\nThe matches are 1v1, with 2 players pitting their teams against one another. The players can use the Ultron Drone's abilities during a match.",
    "game_mode": "Arcade",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1314.png",
      "/rivals/maps/medium/map_1314.png",
      "/rivals/maps/large/map_1314.png",
      "/premium/maps/xl/map_1314.png?expires=1759221398&signature=58b17ddb0e87034ba659c830390126feba89d9e160f91dc8b83797832714c23f"
    ]
  },
  {
    "id": 1317,
    "name": "Celestial Husk",
    "full_name": "Klyntar: Celestial Husk",
    "location": "Klyntar",
    "description": "N/A",
    "game_mode": "Domination",
    "is_competitve": false,
    "images": [
      "/rivals/maps/map_1317.png",
      "/rivals/maps/medium/map_1317.png",
      "/rivals/maps/large/map_1317.png",
      "/premium/maps/xl/map_1317.png?expires=1759221398&signature=aa259893c56a4d6f53912162e27f7d682bdb32e19ad57685c29528d1691328dd"
    ]
  },
  {
    "id": 1318,
    "name": "Celestial Husk",
    "full_name": "Klyntar: Celestial Husk",
    "location": "Klyntar",
    "description": "N/A",
    "game_mode": "Domination",
    "is_competitve": true,
    "images": [
      "/rivals/maps/map_1318.png",
      "/rivals/maps/medium/map_1318.png",
      "/rivals/maps/large/map_1318.png",
      "/premium/maps/xl/map_1318.png?expires=1759221398&signature=135335b6a2f0bd9aeb0b405089d6d97528b162949e5d26b69879e451a8ef515e"
    ]
  }
];

// Create a map for fast lookups
const MAP_LOOKUP = new Map<number, MapData>();
MARVEL_RIVALS_MAPS.forEach(map => {
  MAP_LOOKUP.set(map.id, map);
});

/**
 * Get map information by map ID
 * @param mapId The map ID to look up
 * @returns Map data if found, null otherwise
 */
export function getMapData(mapId: number | string): MapData | null {
  const id = typeof mapId === 'string' ? parseInt(mapId) : mapId;
  return MAP_LOOKUP.get(id) || null;
}

/**
 * Get map name by map ID
 * @param mapId The map ID to look up
 * @returns Map name if found, fallback string otherwise
 */
export function getMapName(mapId: number | string): string {
  const mapData = getMapData(mapId);
  return mapData?.name || `Map ${mapId}`;
}

/**
 * Get map image URL by map ID
 * @param mapId The map ID to look up
 * @param size Size preference ('small', 'medium', 'large', 'xl')
 * @returns Full image URL if found, null otherwise
 */
export function getMapImageUrl(mapId: number | string, size: 'small' | 'medium' | 'large' | 'xl' = 'small'): string | null {
  const mapData = getMapData(mapId);
  if (!mapData || !mapData.images || mapData.images.length === 0) {
    return null;
  }

  // Map size preference to array index
  const sizeIndex = {
    'small': 0,      // /rivals/maps/map_1310.png
    'medium': 1,     // /rivals/maps/medium/map_1310.png
    'large': 2,      // /rivals/maps/large/map_1310.png
    'xl': 3          // /premium/maps/xl/map_1310.png
  };

  const index = sizeIndex[size] || 0;
  const imagePath = mapData.images[index] || mapData.images[0]; // Fallback to first image

  // Convert relative path to full URL
  if (imagePath.startsWith('/')) {
    return `https://marvelrivalsapi.com${imagePath}`;
  }
  
  return imagePath;
}

/**
 * Get all available maps
 * @returns Array of all map data
 */
export function getAllMaps(): MapData[] {
  return MARVEL_RIVALS_MAPS;
}

/**
 * Search maps by name
 * @param query Search query
 * @returns Array of matching maps
 */
export function searchMaps(query: string): MapData[] {
  const searchQuery = query.toLowerCase();
  return MARVEL_RIVALS_MAPS.filter(map => 
    map.name.toLowerCase().includes(searchQuery) ||
    map.full_name.toLowerCase().includes(searchQuery) ||
    map.location.toLowerCase().includes(searchQuery)
  );
}
