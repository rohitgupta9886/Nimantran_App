"""
Nimantran AI — Backend Theme Catalog Service
Provides structured celebration themes with celebration filtering,
recommended defaults, and metadata for persistence.
"""
from typing import List, Dict, Any, Optional

MASTER_BACKEND_THEMES: List[Dict[str, Any]] = [
    {
        "id": "wedding-royal-marigold",
        "celebration_type": "WEDDING",
        "name": "Royal Marigold Mandap",
        "tagline": "Traditional Indian Wedding Luxury",
        "description": "Auspicious saffron, fresh marigold garlands, sacred Sanskrit typography and royal golden leaf flourishes.",
        "preview_image": "/romantic_3d_wedding_stage.jpg",
        "typography": "font-serif",
        "background_style": "sacred-marigold-radial",
        "decoration_style": "MARIGOLD_PETALS_DIYAS",
        "animation_style": "traditional",
        "tags": ["ROYAL", "TRADITIONAL", "RECOMMENDED"],
        "recommended_occasions": ["WEDDING", "VIVAH", "HALDI", "MEHNDI", "SANGEET"],
        "is_recommended": True,
    },
    {
        "id": "wedding-blush-romance",
        "celebration_type": "WEDDING",
        "name": "Blush Romance & Champagne",
        "tagline": "Ivory, Blush Florals & Cinematic Warmth",
        "description": "An ethereal ivory and blush rose design with champagne illumination and delicate gold filigree.",
        "preview_image": "/romantic_3d_invitation_hero.jpg",
        "typography": "font-serif",
        "background_style": "romantic-wine-radial",
        "decoration_style": "ROSE_PETALS_HEARTS",
        "animation_style": "romantic",
        "tags": ["ROMANTIC", "FLORAL", "ROYAL"],
        "recommended_occasions": ["WEDDING", "RECEPTION", "SAGAI", "ENGAGEMENT"],
        "is_recommended": False,
    },
    {
        "id": "wedding-emerald-palace",
        "celebration_type": "WEDDING",
        "name": "Emerald Palace Grandeur",
        "tagline": "Imperial Palace Arches & Royal Jewels",
        "description": "Rich royal emerald velvet blended with Rajasthani jharokha arches, gold foil embossing and majestic elegance.",
        "preview_image": "/velvet_invitation_chest.jpg",
        "typography": "font-serif",
        "background_style": "emerald-palace-radial",
        "decoration_style": "GOLD_SPARKLES_EMERALD",
        "animation_style": "traditional",
        "tags": ["ROYAL", "TRADITIONAL"],
        "recommended_occasions": ["WEDDING", "RECEPTION", "SANGEET", "MEHNDI"],
        "is_recommended": False,
    },
    {
        "id": "engagement-rings-roses",
        "celebration_type": "ENGAGEMENT",
        "name": "Ring & Roses Romance",
        "tagline": "Sparkling Solitaire & Rose Petals",
        "description": "Luminous dual ring emblems, blossoming English roses, and sparkling champagne bubbles celebrating your commitment.",
        "preview_image": "/romantic_3d_envelope_rings.jpg",
        "typography": "font-serif",
        "background_style": "romantic-wine-radial",
        "decoration_style": "ROSE_PETALS_HEARTS",
        "animation_style": "romantic",
        "tags": ["ROMANTIC", "FLORAL", "RECOMMENDED"],
        "recommended_occasions": ["ENGAGEMENT", "SAGAI", "ROKA", "PROPOSAL"],
        "is_recommended": True,
    },
    {
        "id": "mundan-sacred-beginnings",
        "celebration_type": "MUNDAN",
        "name": "Sacred Beginnings & Blessings",
        "tagline": "Holy Diyas, Lotus & Sanskrit Invocations",
        "description": "Devotional saffron and sandalwood palette, glowing brass diyas, sacred lotus petals, and divine family blessings for the child.",
        "preview_image": "/velvet_invitation_chest.jpg",
        "typography": "font-serif",
        "background_style": "sacred-marigold-radial",
        "decoration_style": "LOTUS_BLOSSOMS",
        "animation_style": "traditional",
        "tags": ["TRADITIONAL", "BABY", "RECOMMENDED"],
        "recommended_occasions": ["MUNDAN", "NAAMKARAN", "ANNAPRASHAN", "UPANAYANA"],
        "is_recommended": True,
    },
    {
        "id": "mundan-little-prince",
        "celebration_type": "MUNDAN",
        "name": "Little Prince & Royal Heritage",
        "tagline": "Pastel Blue, Gold Crest & Soft Lighting",
        "description": "Soft baby blue and royal gold trim with traditional Indian peacock motifs and heartfelt blessings for the little one.",
        "preview_image": "/velvet_invitation_chest.jpg",
        "typography": "font-serif",
        "background_style": "baby-pastel-radial",
        "decoration_style": "LOTUS_BLOSSOMS",
        "animation_style": "traditional",
        "tags": ["BABY", "ROYAL", "TRADITIONAL"],
        "recommended_occasions": ["MUNDAN", "FIRST_BIRTHDAY", "NAAMKARAN"],
        "is_recommended": False,
    },
    {
        "id": "birthday-celebration-burst",
        "celebration_type": "BIRTHDAY",
        "name": "Celebration Burst & Confetti",
        "tagline": "Festive Cake, Balloons & Sparkling Confetti",
        "description": "High-energy party atmosphere with vibrant floating balloons, exploding golden confetti, and birthday starbursts.",
        "preview_image": "/romantic_3d_invitation_hero.jpg",
        "typography": "font-sans",
        "background_style": "party-stardust-radial",
        "decoration_style": "CONFETTI_BALLOONS",
        "animation_style": "festive",
        "tags": ["FESTIVE", "RECOMMENDED"],
        "recommended_occasions": ["BIRTHDAY", "FIRST_BIRTHDAY", "MILESTONE_BIRTHDAY", "SURPRISE_PARTY"],
        "is_recommended": True,
    },
    {
        "id": "anniversary-forever-us",
        "celebration_type": "ANNIVERSARY",
        "name": "Forever Us & Rose Garden",
        "tagline": "Romantic Couple Silhouette & Warm Candles",
        "description": "Emotional rose wine palette with delicate gold accents, celebrating cherished memories and years of loving companionship.",
        "preview_image": "/romantic_3d_invitation_hero.jpg",
        "typography": "font-serif",
        "background_style": "romantic-wine-radial",
        "decoration_style": "ROSE_PETALS_HEARTS",
        "animation_style": "romantic",
        "tags": ["ROMANTIC", "FLORAL", "RECOMMENDED"],
        "recommended_occasions": ["ANNIVERSARY", "WEDDING_ANNIVERSARY", "VALENTINE"],
        "is_recommended": True,
    },
    {
        "id": "housewarming-griha-pravesh",
        "celebration_type": "HOUSEWARMING",
        "name": "Griha Pravesh & Shubh Rangoli",
        "tagline": "Traditional Toran, Diyas & New Home Blessings",
        "description": "Auspicious mango leaf toran, glowing brass diyas, and sacred Kalash motifs welcoming friends and family to your new abode.",
        "preview_image": "/velvet_invitation_chest.jpg",
        "typography": "font-serif",
        "background_style": "sacred-marigold-radial",
        "decoration_style": "FESTIVE_DIYAS",
        "animation_style": "traditional",
        "tags": ["TRADITIONAL", "RECOMMENDED"],
        "recommended_occasions": ["GRIHA_PRAVESH", "HOUSEWARMING", "PUJA", "SATYANARAYAN_KATHA"],
        "is_recommended": True,
    },
    {
        "id": "corporate-modern-professional",
        "celebration_type": "CORPORATE",
        "name": "Modern Professional Summit",
        "tagline": "Platinum, Executive Navy & Clean Geometry",
        "description": "Minimalist architectural lines, crisp modern typography, and clean platinum reflections tailored for summits and galas.",
        "preview_image": "/velvet_invitation_chest.jpg",
        "typography": "font-sans",
        "background_style": "corporate-navy-radial",
        "decoration_style": "GEOMETRIC_TECH_STREAKS",
        "animation_style": "professional",
        "tags": ["CORPORATE", "MODERN", "RECOMMENDED"],
        "recommended_occasions": ["CORPORATE", "CONFERENCE", "BUSINESS_CONFERENCE", "ANNUAL_DAY_AWARDS", "NETWORKING_MEET"],
        "is_recommended": True,
    },
    {
        "id": "celebration-universal-modern",
        "celebration_type": "OTHER",
        "name": "Modern Universal Celebration",
        "tagline": "Abstract Radiant Bokeh & Golden Ambient Lights",
        "description": "An elegant, versatile design with glowing ambient bokeh, modern serif typography, and balanced celebratory aesthetics.",
        "preview_image": "/romantic_3d_invitation_hero.jpg",
        "typography": "font-serif",
        "background_style": "romantic-wine-radial",
        "decoration_style": "GOLD_SPARKLES_EMERALD",
        "animation_style": "romantic",
        "tags": ["MODERN", "ROYAL", "RECOMMENDED"],
        "recommended_occasions": ["OTHER", "REUNION", "FAMILY_REUNION", "DINNER_PARTY"],
        "is_recommended": True,
    },
]


class ThemeCatalogService:
    @staticmethod
    def get_themes(celebration_type: Optional[str] = None) -> List[Dict[str, Any]]:
        if not celebration_type:
            return MASTER_BACKEND_THEMES
        
        c_type = celebration_type.upper().strip()
        filtered = [
            t for t in MASTER_BACKEND_THEMES
            if t["celebration_type"] == c_type or c_type in t.get("recommended_occasions", [])
        ]
        return filtered if filtered else MASTER_BACKEND_THEMES

    @staticmethod
    def get_theme_by_id(theme_id: str) -> Dict[str, Any]:
        for t in MASTER_BACKEND_THEMES:
            if t["id"] == theme_id:
                return t
        return MASTER_BACKEND_THEMES[0]
