import re
from typing import Optional, Tuple


def normalize_phone_number(raw_phone: Optional[str], default_country: str = "IN") -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Normalizes a phone number to standard E.164 international format (+[country_code][number]).
    Returns (is_valid, normalized_phone, error_reason).
    """
    if not raw_phone or not raw_phone.strip():
        return False, None, "Phone number is empty or missing"

    # Remove all whitespace, dashes, dots, brackets, slashes
    cleaned = re.sub(r"[\s\-\.\(\)\/]", "", raw_phone.strip())

    if not cleaned:
        return False, None, "Phone number contains no digits"

    # If it begins with a plus sign '+'
    if cleaned.startswith("+"):
        digits_only = cleaned[1:]
        if not digits_only.isdigit():
            return False, None, "Invalid characters in phone number"
        if len(digits_only) < 7:
            return False, None, "Phone number is too short (min 7 digits with country code)"
        if len(digits_only) > 15:
            return False, None, "Phone number is too long (max 15 digits per E.164 standard)"
        return True, f"+{digits_only}", None

    # If it begins with '00' (international dialing prefix)
    if cleaned.startswith("00") and len(cleaned) > 2:
        digits_only = cleaned[2:]
        if digits_only.isdigit() and 7 <= len(digits_only) <= 15:
            return True, f"+{digits_only}", None

    # Extract all digits
    if not cleaned.isdigit():
        return False, None, "Phone number contains non-numeric characters"

    # Handle Indian numbers (+91)
    if default_country == "IN":
        # 10 digit Indian standard mobile (starts with 5, 6, 7, 8, 9)
        if len(cleaned) == 10:
            if cleaned[0] in "56789":
                return True, f"+91{cleaned}", None
            else:
                return False, None, "Indian mobile number must start with 5, 6, 7, 8, or 9"

        # 11 digits with leading 0 (e.g. 09876543210)
        if len(cleaned) == 11 and cleaned.startswith("0"):
            sub = cleaned[1:]
            if sub[0] in "56789":
                return True, f"+91{sub}", None
            else:
                return False, None, "Indian mobile number must start with 5, 6, 7, 8, or 9"

        # 12 digits starting with 91 (e.g. 919876543210)
        if len(cleaned) == 12 and cleaned.startswith("91"):
            sub = cleaned[2:]
            if sub[0] in "56789":
                return True, f"+91{sub}", None
            else:
                return False, None, "Indian mobile number must start with 5, 6, 7, 8, or 9"

    # Generic fallback: if 10 to 15 digits
    if 10 <= len(cleaned) <= 15:
        # Prepend +91 if default is IN and 10 digits
        if default_country == "IN" and len(cleaned) == 10:
            return True, f"+91{cleaned}", None
        return True, f"+{cleaned}", None

    return False, None, f"Invalid phone number length ({len(cleaned)} digits)"


def mask_phone_number(phone: Optional[str]) -> str:
    """
    Masks a phone number for privacy display (e.g., +91 98XXX X4210)
    """
    if not phone:
        return "N/A"
    clean = phone.strip()
    if len(clean) >= 8:
        return f"{clean[:5]}****{clean[-3:]}"
    return clean
