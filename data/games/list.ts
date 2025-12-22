
import { 
    Gamepad2, BrainCircuit, Hash, Bomb, Type, 
    Ghost, Layers, Move, Grid3X3, Crown, BoxSelect,
    Rocket, Shield, Car, Layout, Play, Minimize,
    Sword, Building2, MousePointer2, Scissors,
    Wind, ShieldAlert, Grid
} from 'lucide-react';

export interface GameMeta {
    id: string;
    title: string;
    description: string;
    icon: any;
    color: string;
    componentName: string;
    isDevChoice?: boolean;
    category: 'Action' | 'Puzzle' | 'Strategy' | 'Classic' | 'RPG' | 'Simulation' | 'Idle';
}

export const GAMES_LIST: GameMeta[] = [
    // DEV'S CHOICE / TRENDING
    {
        id: 'code-clicker', title: 'Code Clicker', description: 'The addicting idle game. Write code, hire interns, buy AI, and take over the web.',
        icon: MousePointer2, color: 'text-green-400', componentName: 'CodeClicker', isDevChoice: true, category: 'Idle'
    },
    {
        id: 'cyber-fly', title: 'Cyber Fly', description: 'Navigate the drone through the server farm. Don\'t crash!',
        icon: Wind, color: 'text-cyan-400', componentName: 'FlappyDrone', isDevChoice: true, category: 'Action'
    },
    {
        id: 'firewall', title: 'Firewall Defense', description: 'Strategic Tower Defense. Stop the viruses from reaching the Core.',
        icon: ShieldAlert, color: 'text-red-500', componentName: 'TowerDefense', isDevChoice: true, category: 'Strategy'
    },
    {
        id: 'bug-ninja', title: 'Bug Ninja', description: 'Slice the bugs, avoid the syntax errors. High-speed reflex action.',
        icon: Scissors, color: 'text-rose-500', componentName: 'BugNinja', category: 'Action'
    },

    // STRATEGY & BRAIN
    {
        id: 'chess', title: 'Grandmaster Chess', description: 'Play against a locally running AI engine. Smart evaluation.',
        icon: Crown, color: 'text-amber-400', componentName: 'Chess', category: 'Strategy'
    },
    {
        id: 'sudoku', title: 'Logic Grid', description: 'Classic Sudoku. Generate infinite valid puzzles.',
        icon: Grid, color: 'text-blue-400', componentName: 'Sudoku', category: 'Puzzle'
    },
    {
        id: '2048', title: '2048 Pro', description: 'Merge the numbers. Smooth animations and addictive gameplay.',
        icon: Hash, color: 'text-yellow-400', componentName: 'Game2048', category: 'Puzzle'
    },

    // ACTION & ARCADE
    {
        id: 'dungeon', title: 'Neon Rogue', description: 'Turn-based dungeon crawler. Slay enemies, find loot, descend deeper.',
        icon: Sword, color: 'text-red-500', componentName: 'Dungeon', category: 'RPG'
    },
    {
        id: 'space-shooter', title: 'Cosmic Defender', description: 'Defend the system from bugs. Classic vertical scrolling shooter.',
        icon: Rocket, color: 'text-blue-500', componentName: 'SpaceShooter', category: 'Action'
    },
    {
        id: 'platformer', title: 'Neon Runner', description: 'Endless runner. Jump over syntax errors and glitches.',
        icon: Play, color: 'text-yellow-400', componentName: 'Platformer', category: 'Action'
    },
    {
        id: 'racing', title: 'Packet Racer', description: 'Dodge traffic at high speeds. Reach the gateway.',
        icon: Car, color: 'text-orange-500', componentName: 'Racing', category: 'Action'
    },
    
    // CLASSIC PUZZLES
    {
        id: 'city', title: 'Cyber City', description: 'Build and manage your own neon metropolis. Balance power and population.',
        icon: Building2, color: 'text-cyan-400', componentName: 'CyberCity', category: 'Simulation'
    },
    {
        id: 'tetris', title: 'Cyber Blocks', description: 'The classic stacking game with a neon aesthetic.',
        icon: Layout, color: 'text-cyan-400', componentName: 'Tetris', category: 'Classic'
    },
    {
        id: 'wordle', title: 'Syntax Wordle', description: 'Guess the 5-letter tech term. 6 Tries. Pure logic.',
        icon: Type, color: 'text-green-400', componentName: 'Wordle', category: 'Puzzle'
    },
    {
        id: 'minesweeper', title: 'Minesweeper', description: 'Clear the grid without detonating the bombs.',
        icon: Bomb, color: 'text-rose-500', componentName: 'Minesweeper', category: 'Puzzle'
    },
    {
        id: 'tank-battle', title: 'Neon Tanks', description: 'Destroy enemy tanks in a digital maze.',
        icon: Shield, color: 'text-green-500', componentName: 'TankBattle', category: 'Action'
    },
    {
        id: 'breakout', title: 'Firewall Breaker', description: 'Smash through the security layers. Classic brick breaker.',
        icon: Minimize, color: 'text-purple-400', componentName: 'Breakout', category: 'Classic'
    },
    {
        id: 'py-snake', title: 'Cyber Snake', description: 'Consume libraries, avoid syntax errors.',
        icon: Gamepad2, color: 'text-emerald-500', componentName: 'Snake', category: 'Action'
    },
    {
        id: 'memory', title: 'Binary Memory', description: 'Match the tech icons. Test your RAM.',
        icon: BrainCircuit, color: 'text-purple-400', componentName: 'Memory', category: 'Puzzle'
    },
    {
        id: 'tictactoe', title: 'TicTacToe AI', description: 'Can you beat the Minimax AI?',
        icon: Grid3X3, color: 'text-slate-200', componentName: 'TicTacToe', category: 'Strategy'
    },
    {
        id: 'whack', title: 'Whack-a-Bug', description: 'Squash the bugs before they crash production.',
        icon: Ghost, color: 'text-red-400', componentName: 'WhackABug', category: 'Action'
    },
    {
        id: 'hanoi', title: 'Tower of Hanoi', description: 'Move the stack to the last pole.',
        icon: Layers, color: 'text-indigo-400', componentName: 'Hanoi', category: 'Puzzle'
    },
    {
        id: 'slide', title: '15-Puzzle', description: 'Order the numbers by sliding the tiles.',
        icon: Move, color: 'text-blue-400', componentName: 'Slide', category: 'Puzzle'
    },
    {
        id: 'simon', title: 'Simon Says', description: 'Memorize the color sequence.',
        icon: BoxSelect, color: 'text-pink-400', componentName: 'Simon', category: 'Classic'
    }
];
