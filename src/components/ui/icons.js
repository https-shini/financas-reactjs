// Registro explícito de ícones de categoria (evita importar a biblioteca inteira de ícones).
import {
    Baby, Bike, BookOpen, Briefcase, Bus, Car, Coffee, Droplet, Dumbbell, Film, Fuel, Gift, GraduationCap, HeartPulse, Home,
    Landmark, Laptop, Music, PartyPopper, PawPrint, PiggyBank, Pill, Plane, Receipt, Repeat, Scissors, Shirt, ShoppingBag,
    ShoppingCart, Smartphone, Tag, TrendingUp, Utensils, Wifi, Wrench, Zap,
} from "lucide-react";

export const CATEGORY_ICON_COMPONENTS = {
    Baby, Bike, BookOpen, Briefcase, Bus, Car, Coffee, Droplet, Dumbbell, Film, Fuel, Gift, GraduationCap, HeartPulse, Home,
    Landmark, Laptop, Music, PartyPopper, PawPrint, PiggyBank, Pill, Plane, Receipt, Repeat, Scissors, Shirt, ShoppingBag,
    ShoppingCart, Smartphone, Tag, TrendingUp, Utensils, Wifi, Wrench, Zap,
};

export function iconFor(name) {
    return CATEGORY_ICON_COMPONENTS[name] ?? Tag;
}
