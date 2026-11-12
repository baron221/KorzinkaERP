// Sezonni yopishda yaratiladigan "boshlang'ich qoldiq" yozuvlari uchun umumiy qiymatlar.

export const OPENING_NOTE = "O'tgan sezondan qoldiq";

// Sezon yopilganda ko'chirilgan qarz mahsulotsiz (items bo'sh) Sale sifatida saqlanadi.
// Haqiqiy savdoda har doim kamida bitta mahsulot bo'ladi, shuning uchun daromad
// hisoblanadigan joylarda shu filtr bilan ko'chirilgan qarz chiqarib tashlanadi.
export const REAL_SALE = { items: { some: {} } } as const;
export const OPENING_SALE = { items: { none: {} } } as const;

export const SEASON_CONFIRM_WORD = "YOPISH";
