
import { FootballStudioSettings, FootballCategory } from "../types";

export const FOOTBALL_ASPECT_RATIOS = [
    { value: "1:1", labelKey: "footballStudio.aspectRatios.square" },
    { value: "4:3", labelKey: "footballStudio.aspectRatios.portrait_classic" },
    { value: "3:4", labelKey: "footballStudio.aspectRatios.portrait_phone" },
    { value: "16:9", labelKey: "footballStudio.aspectRatios.landscape" },
    { value: "9:16", labelKey: "footballStudio.aspectRatios.story" }
];

export const FOOTBALL_TEAMS: Record<FootballCategory, string[]> = {
    contemporary: ["vietnam", "argentina", "portugal", "france", "brazil", "england", "norway", "belgium", "south_korea"],
    legendary: ["vietnam", "brazil", "argentina", "france", "portugal", "england", "netherlands", "germany", "italy"]
};

export const FOOTBALL_PLAYERS: { [category: string]: { [teamKey: string]: { vi: string, en: string }[] } } = {
    contemporary: {
        "argentina": [
            { vi: "Lionel Messi", en: "Lionel Messi" },
            { vi: "Ángel Di María", en: "Angel Di Maria" },
            { vi: "Julián Álvarez", en: "Julian Alvarez" }
        ],
        "portugal": [
            { vi: "Cristiano Ronaldo", en: "Cristiano Ronaldo" },
            { vi: "Bruno Fernandes", en: "Bruno Fernandes" },
            { vi: "Bernardo Silva", en: "Bernardo Silva" }
        ],
        "france": [
            { vi: "Kylian Mbappé", en: "Kylian Mbappe" },
            { vi: "Antoine Griezmann", en: "Antoine Griezmann" },
            { vi: "Aurélien Tchouaméni", en: "Aurelien Tchouameni" }
        ],
        "brazil": [
            { vi: "Neymar Jr.", en: "Neymar Jr." },
            { vi: "Vinícius Júnior", en: "Vinicius Junior" },
            { vi: "Rodrygo", en: "Rodrygo" }
        ],
        "england": [
            { vi: "Harry Kane", en: "Harry Kane" },
            { vi: "Jude Bellingham", en: "Jude Bellingham" },
            { vi: "Bukayo Saka", en: "Bukayo Saka" }
        ],
        "norway": [
            { vi: "Erling Haaland", en: "Erling Haaland" },
            { vi: "Martin Ødegaard", en: "Martin Odegaard" }
        ],
        "belgium": [
            { vi: "Kevin De Bruyne", en: "Kevin De Bruyne" },
            { vi: "Romelu Lukaku", en: "Romelu Lukaku" }
        ],
        "south_korea": [
            { vi: "Son Heung-min", en: "Son Heung-min" },
            { vi: "Kim Min-jae", en: "Kim Min-jae" },
            { vi: "Lee Kang-in", en: "Lee Kang-in" }
        ],
        "vietnam": [
            { vi: "Đặng Văn Lâm", en: "Dang Van Lam" },
            { vi: "Đoàn Văn Hậu", en: "Doan Van Hau" },
            { vi: "Nguyễn Quang Hải", en: "Nguyen Quang Hai" },
            { vi: "Nguyễn Công Phượng", en: "Nguyen Cong Phuong" },
            { vi: "Nguyễn Tiến Linh", en: "Nguyen Tien Linh" },
            { vi: "Nguyễn Hoàng Đức", en: "Nguyen Hoang Duc" },
            { vi: "Quế Ngọc Hải", en: "Que Ngoc Hai" }
        ]
    },
    legendary: {
        "brazil": [
            { vi: "Pelé", en: "Pele" },
            { vi: "Ronaldo Nazário", en: "Ronaldo Nazario" },
            { vi: "Ronaldinho", en: "Ronaldinho" },
            { vi: "Garrincha", en: "Garrincha" },
            { vi: "Zico", en: "Zico" },
            { vi: "Cafu", en: "Cafu" },
            { vi: "Roberto Carlos", en: "Roberto Carlos" }
        ],
        "argentina": [
            { vi: "Diego Maradona", en: "Diego Maradona" },
            { vi: "Alfredo Di Stéfano", en: "Alfredo Di Stefano" },
            { vi: "Gabriel Batistuta", en: "Gabriel Batistuta" }
        ],
        "france": [
            { vi: "Zinedine Zidane", en: "Zinedine Zidane" },
            { vi: "Thierry Henry", en: "Thierry Henry" },
            { vi: "Michel Platini", en: "Michel Platini" }
        ],
        "portugal": [
            { vi: "Eusébio", en: "Eusebio" },
            { vi: "Luís Figo", en: "Luis Figo" }
        ],
        "england": [
            { vi: "David Beckham", en: "David Beckham" },
            { vi: "Bobby Charlton", en: "Bobby Charlton" },
            { vi: "Wayne Rooney", en: "Wayne Rooney" }
        ],
        "netherlands": [
            { vi: "Johan Cruyff", en: "Johan Cruyff" },
            { vi: "Marco van Basten", en: "Marco van Basten" },
            { vi: "Ruud Gullit", en: "Ruud Gullit" }
        ],
        "germany": [
            { vi: "Franz Beckenbauer", en: "Franz Beckenbauer" },
            { vi: "Gerd Müller", en: "Gerd Muller" },
            { vi: "Lothar Matthäus", en: "Lothar Matthaus" }
        ],
        "italy": [
            { vi: "Paolo Maldini", en: "Paolo Maldini" },
            { vi: "Roberto Baggio", en: "Roberto Baggio" },
            { vi: "Andrea Pirlo", en: "Andrea Pirlo" }
        ],
        "vietnam": [
            { vi: "Đặng Văn Lâm", en: "Dang Van Lam" },
            { vi: "Đoàn Minh Xương", en: "Doan Minh Xuong" },
            { vi: "Đỗ Thế Vinh", en: "Do The Vinh" },
            { vi: "Lê Công Vinh", en: "Le Cong Vinh" },
            { vi: "Lê Huỳnh Đức", en: "Le Huynh Duc" },
            { vi: "Mai Đức Chung", en: "Mai Duc Chung" },
            { vi: "Nguyễn Cao Cường", en: "Nguyen Cao Cuong" },
            { vi: "Nguyễn Công Minh", en: "Nguyen Cong Minh" },
            { vi: "Nguyễn Hồng Sơn", en: "Nguyen Hong Son" },
            { vi: "Nguyễn Hữu Thắng", en: "Nguyen Huu Thang" },
            { vi: "Nguyễn Minh Phương", en: "Nguyen Minh Phuong" },
            { vi: "Nguyễn Quang Hải", en: "Nguyen Quang Hai" },
            { vi: "Nguyễn Tiến Linh", en: "Nguyen Tien Linh" },
            { vi: "Phạm Văn Quyến", en: "Pham Van Quyen" },
            { vi: "Trần Công Minh", en: "Tran Cong Minh" }
        ].sort((a, b) => a.vi.localeCompare(b.vi, 'vi'))
    }
};

export const FOOTBALL_IDOL_SCENES = [
    'scenes.idol.celebrate',
    'scenes.idol.training',
    'scenes.idol.exchangeJerseys',
    'scenes.idol.trophy',
    'scenes.idol.tunnel',
    'scenes.idol.selfie',
    'scenes.idol.coffee',
    'scenes.idol.tv',
    'scenes.idol.street',
    'scenes.idol.golf',
    'scenes.idol.gym',
    'scenes.idol.pressConference',
    'scenes.idol.fanSigning',
    'scenes.idol.travel',
    'scenes.idol.festival',
    'scenes.idol.luxuryRestaurant',
    'scenes.idol.charityEvent'
];

export const FOOTBALL_OUTFIT_SCENES = [
    'scenes.outfit.scoring',
    'scenes.outfit.celebratingTeam',
    'scenes.outfit.liftingTrophy',
    'scenes.outfit.photoshoot',
    'scenes.outfit.running',
    'scenes.outfit.actionShot'
];

export const FOOTBALL_STYLES = [
    'styles.poster',
    'styles.highFashion',
    'styles.realistic'
];


export const DEFAULT_FOOTBALL_SETTINGS: FootballStudioSettings = {
    mode: 'idol',
    sourceImage: null,
    category: 'contemporary',
    team: 'vietnam',
    player: FOOTBALL_PLAYERS.contemporary.vietnam[2].vi, // Nguyễn Quang Hải
    scene: FOOTBALL_IDOL_SCENES[0],
    aspectRatio: '3:4',
    style: FOOTBALL_STYLES[0],
    customPrompt: '',
};
