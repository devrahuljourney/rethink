import { AppCategory } from '../types/appLimits';

// Predefined category mappings based on package name patterns
const categoryRules: Record<string, AppCategory> = {
    // Social Media
    'facebook': AppCategory.SOCIAL,
    'instagram': AppCategory.SOCIAL,
    'twitter': AppCategory.SOCIAL,
    'snapchat': AppCategory.SOCIAL,
    'tiktok': AppCategory.SOCIAL,
    'linkedin': AppCategory.SOCIAL,
    'reddit': AppCategory.SOCIAL,
    'pinterest': AppCategory.SOCIAL,
    'whatsapp': AppCategory.COMMUNICATION,
    'telegram': AppCategory.COMMUNICATION,
    'messenger': AppCategory.COMMUNICATION,
    'discord': AppCategory.COMMUNICATION,
    'signal': AppCategory.COMMUNICATION,

    // Entertainment
    'youtube': AppCategory.ENTERTAINMENT,
    'netflix': AppCategory.ENTERTAINMENT,
    'spotify': AppCategory.ENTERTAINMENT,
    'prime': AppCategory.ENTERTAINMENT,
    'hulu': AppCategory.ENTERTAINMENT,
    'disney': AppCategory.ENTERTAINMENT,
    'twitch': AppCategory.ENTERTAINMENT,
    'soundcloud': AppCategory.ENTERTAINMENT,
    'music': AppCategory.ENTERTAINMENT,

    // Games
    'game': AppCategory.GAMES,
    'play.games': AppCategory.GAMES,
    'pubg': AppCategory.GAMES,
    'freefire': AppCategory.GAMES,
    'candy': AppCategory.GAMES,
    'clash': AppCategory.GAMES,

    // Productivity
    'gmail': AppCategory.PRODUCTIVITY,
    'outlook': AppCategory.PRODUCTIVITY,
    'calendar': AppCategory.PRODUCTIVITY,
    'drive': AppCategory.PRODUCTIVITY,
    'docs': AppCategory.PRODUCTIVITY,
    'sheets': AppCategory.PRODUCTIVITY,
    'slides': AppCategory.PRODUCTIVITY,
    'notion': AppCategory.PRODUCTIVITY,
    'evernote': AppCategory.PRODUCTIVITY,
    'trello': AppCategory.PRODUCTIVITY,
    'slack': AppCategory.PRODUCTIVITY,
    'teams': AppCategory.PRODUCTIVITY,
    'zoom': AppCategory.PRODUCTIVITY,
    'meet': AppCategory.PRODUCTIVITY,

    // Education
    'duolingo': AppCategory.EDUCATION,
    'khan': AppCategory.EDUCATION,
    'coursera': AppCategory.EDUCATION,
    'udemy': AppCategory.EDUCATION,
    'classroom': AppCategory.EDUCATION,

    // Shopping
    'amazon': AppCategory.SHOPPING,
    'flipkart': AppCategory.SHOPPING,
    'myntra': AppCategory.SHOPPING,
    'ebay': AppCategory.SHOPPING,
    'shopping': AppCategory.SHOPPING,

    // News
    'news': AppCategory.NEWS,
    'times': AppCategory.NEWS,
    'bbc': AppCategory.NEWS,
    'cnn': AppCategory.NEWS,

    // Health & Fitness
    'health': AppCategory.HEALTH,
    'fitness': AppCategory.HEALTH,
    'strava': AppCategory.HEALTH,
    'fitbit': AppCategory.HEALTH,
    'headspace': AppCategory.HEALTH,
    'calm': AppCategory.HEALTH,

    // Finance
    'paytm': AppCategory.FINANCE,
    'phonepe': AppCategory.FINANCE,
    'gpay': AppCategory.FINANCE,
    'bank': AppCategory.FINANCE,
    'wallet': AppCategory.FINANCE,

    // Utilities
    'camera': AppCategory.UTILITIES,
    'gallery': AppCategory.UTILITIES,
    'photos': AppCategory.UTILITIES,
    'files': AppCategory.UTILITIES,
    'calculator': AppCategory.UTILITIES,
    'clock': AppCategory.UTILITIES,
    'weather': AppCategory.UTILITIES,
};

/**
 * Maps a package name to its category
 */
export function getAppCategory(packageName: string): AppCategory {
    const lowerPackage = packageName.toLowerCase();

    // Check each rule
    for (const [keyword, category] of Object.entries(categoryRules)) {
        if (lowerPackage.includes(keyword)) {
            return category;
        }
    }

    // Default to OTHER if no match
    return AppCategory.OTHER;
}

/**
 * Gets a color for each category (for UI visualization)
 */
export function getCategoryColor(category: AppCategory): string {
    const colors: Record<AppCategory, string> = {
        [AppCategory.SOCIAL]: '#FF6B9D',
        [AppCategory.ENTERTAINMENT]: '#C77DFF',
        [AppCategory.PRODUCTIVITY]: '#4CAF50',
        [AppCategory.EDUCATION]: '#2196F3',
        [AppCategory.COMMUNICATION]: '#00BCD4',
        [AppCategory.GAMES]: '#FF9800',
        [AppCategory.SHOPPING]: '#E91E63',
        [AppCategory.NEWS]: '#607D8B',
        [AppCategory.HEALTH]: '#8BC34A',
        [AppCategory.FINANCE]: '#FFC107',
        [AppCategory.UTILITIES]: '#9E9E9E',
        [AppCategory.OTHER]: '#757575',
    };

    return colors[category];
}

/**
 * Gets an icon name for each category
 */
export function getCategoryIcon(category: AppCategory): string {
    const icons: Record<AppCategory, string> = {
        [AppCategory.SOCIAL]: 'people',
        [AppCategory.ENTERTAINMENT]: 'play-circle',
        [AppCategory.PRODUCTIVITY]: 'briefcase',
        [AppCategory.EDUCATION]: 'school',
        [AppCategory.COMMUNICATION]: 'chatbubbles',
        [AppCategory.GAMES]: 'game-controller',
        [AppCategory.SHOPPING]: 'cart',
        [AppCategory.NEWS]: 'newspaper',
        [AppCategory.HEALTH]: 'fitness',
        [AppCategory.FINANCE]: 'wallet',
        [AppCategory.UTILITIES]: 'construct',
        [AppCategory.OTHER]: 'apps',
    };

    return icons[category];
}
