export interface GeorgianFood {
  name: string
  category: string
  calories: number
  protein_g: number
  fat_g: number
  carbs_g: number
  serving: string
  amount_g: number
}

export const GEORGIAN_FOODS: GeorgianFood[] = [
  // ხორცის კერძები
  { name: 'ხინკალი (1 ცალი)', category: 'ხორცი', calories: 85, protein_g: 5.5, fat_g: 3.2, carbs_g: 9.5, serving: '1 ცალი', amount_g: 50 },
  { name: 'მწვადი (ქათამი)', category: 'ხორცი', calories: 165, protein_g: 28, fat_g: 5.5, carbs_g: 0, serving: '100გ', amount_g: 100 },
  { name: 'მწვადი (ღორი)', category: 'ხორცი', calories: 220, protein_g: 22, fat_g: 14, carbs_g: 0, serving: '100გ', amount_g: 100 },
  { name: 'ჩაქაფული', category: 'ხორცი', calories: 180, protein_g: 18, fat_g: 10, carbs_g: 5, serving: '100გ', amount_g: 100 },
  { name: 'სათაური (ხბოს)', category: 'ხორცი', calories: 210, protein_g: 20, fat_g: 13, carbs_g: 2, serving: '100გ', amount_g: 100 },
  { name: 'ჩიხირთმა', category: 'ხორცი', calories: 145, protein_g: 14, fat_g: 7, carbs_g: 6, serving: '100გ', amount_g: 100 },
  { name: 'ბასტურმა', category: 'ხორცი', calories: 170, protein_g: 27, fat_g: 6, carbs_g: 1, serving: '100გ', amount_g: 100 },
  { name: 'კუპატი (1 ცალი)', category: 'ხორცი', calories: 280, protein_g: 15, fat_g: 22, carbs_g: 5, serving: '1 ცალი', amount_g: 100 },

  // პური / ფქვილეული
  { name: 'ხაჭაპური (იმერული, 1 ნაჭერი)', category: 'პური', calories: 320, protein_g: 12, fat_g: 14, carbs_g: 38, serving: '1 ნაჭერი', amount_g: 150 },
  { name: 'ხაჭაპური (აჭარული)', category: 'პური', calories: 480, protein_g: 18, fat_g: 24, carbs_g: 48, serving: '1 ცალი', amount_g: 220 },
  { name: 'ლობიანი (1 ნაჭერი)', category: 'პური', calories: 290, protein_g: 10, fat_g: 8, carbs_g: 45, serving: '1 ნაჭერი', amount_g: 150 },
  { name: 'მჭადი (1 ცალი)', category: 'პური', calories: 180, protein_g: 4, fat_g: 3, carbs_g: 36, serving: '1 ცალი', amount_g: 80 },
  { name: 'პური (შავი, 1 ნაჭერი)', category: 'პური', calories: 70, protein_g: 2.5, fat_g: 0.5, carbs_g: 14, serving: '1 ნაჭერი', amount_g: 30 },
  { name: 'შოთის პური (100გ)', category: 'პური', calories: 250, protein_g: 8, fat_g: 1.5, carbs_g: 52, serving: '100გ', amount_g: 100 },

  // ბოსტნეული / სალათი
  { name: 'ბადრიჯნის ხიზილალა', category: 'ბოსტნეული', calories: 120, protein_g: 4, fat_g: 8, carbs_g: 8, serving: '100გ', amount_g: 100 },
  { name: 'ფხალი (ისპანახის)', category: 'ბოსტნეული', calories: 95, protein_g: 5, fat_g: 6, carbs_g: 6, serving: '100გ', amount_g: 100 },
  { name: 'ნიგვზიანი ბადრიჯანი', category: 'ბოსტნეული', calories: 185, protein_g: 4, fat_g: 15, carbs_g: 10, serving: '100გ', amount_g: 100 },
  { name: 'სოკო (შემწვარი)', category: 'ბოსტნეული', calories: 75, protein_g: 4, fat_g: 4, carbs_g: 6, serving: '100გ', amount_g: 100 },
  { name: 'ახალი პომიდვრის სალათი', category: 'ბოსტნეული', calories: 35, protein_g: 1.5, fat_g: 1.5, carbs_g: 5, serving: '100გ', amount_g: 100 },
  { name: 'ჩირი (ბოსტნეულის)', category: 'ბოსტნეული', calories: 65, protein_g: 2, fat_g: 3, carbs_g: 8, serving: '100გ', amount_g: 100 },

  // პარკოსნები
  { name: 'ლობიო (მოხარშული)', category: 'პარკოსნები', calories: 130, protein_g: 9, fat_g: 0.5, carbs_g: 23, serving: '100გ', amount_g: 100 },
  { name: 'მწვანე ლობიო (ახალი)', category: 'პარკოსნები', calories: 35, protein_g: 2, fat_g: 0.2, carbs_g: 7, serving: '100გ', amount_g: 100 },

  // რძის პროდუქტები
  { name: 'ხაჭო (ქართული, 100გ)', category: 'რძე', calories: 90, protein_g: 14, fat_g: 3, carbs_g: 2, serving: '100გ', amount_g: 100 },
  { name: 'სულგუნი', category: 'რძე', calories: 290, protein_g: 21, fat_g: 22, carbs_g: 0, serving: '100გ', amount_g: 100 },
  { name: 'ნადუღი', category: 'რძე', calories: 60, protein_g: 10, fat_g: 1, carbs_g: 4, serving: '100გ', amount_g: 100 },
  { name: 'მაწონი (100გ)', category: 'რძე', calories: 62, protein_g: 5, fat_g: 3.2, carbs_g: 4.5, serving: '100გ', amount_g: 100 },
  { name: 'ყველი ადიღური', category: 'რძე', calories: 265, protein_g: 19, fat_g: 20, carbs_g: 0, serving: '100გ', amount_g: 100 },

  // სოუსები / პასტები
  { name: 'ტყემლი (სოუსი)', category: 'სოუსი', calories: 45, protein_g: 0.5, fat_g: 0.2, carbs_g: 11, serving: '50გ', amount_g: 50 },
  { name: 'ბაჟე (ნიგვზის)', category: 'სოუსი', calories: 220, protein_g: 7, fat_g: 20, carbs_g: 6, serving: '100გ', amount_g: 100 },
  { name: 'სატსებელი', category: 'სოუსი', calories: 40, protein_g: 1, fat_g: 0.5, carbs_g: 9, serving: '50გ', amount_g: 50 },

  // ფაფები / ბურღული
  { name: 'ღომი (100გ)', category: 'ფაფა', calories: 115, protein_g: 2.5, fat_g: 1.5, carbs_g: 23, serving: '100გ', amount_g: 100 },

  // ნიგოზი
  { name: 'ნიგოზი', category: 'თხილეული', calories: 650, protein_g: 15, fat_g: 65, carbs_g: 14, serving: '100გ', amount_g: 100 },

  // ყველაზე გავრცელებული ქართული საუზმეები
  { name: 'კვერცხი (1 ცალი)', category: 'კვერცხი', calories: 70, protein_g: 6, fat_g: 5, carbs_g: 0.6, serving: '1 ცალი', amount_g: 50 },
  { name: 'კვერცხი შემწვარი (2 ცალი)', category: 'კვერცხი', calories: 180, protein_g: 12, fat_g: 14, carbs_g: 1, serving: '2 ცალი', amount_g: 100 },
  { name: 'კვერცხი მოხარშული (1 ცალი)', category: 'კვერცხი', calories: 68, protein_g: 6, fat_g: 4.5, carbs_g: 0.5, serving: '1 ცალი', amount_g: 50 },

  // ხილი
  { name: 'ყურძენი (100გ)', category: 'ხილი', calories: 67, protein_g: 0.6, fat_g: 0.2, carbs_g: 17, serving: '100გ', amount_g: 100 },
  { name: 'ქლიავი (100გ)', category: 'ხილი', calories: 46, protein_g: 0.7, fat_g: 0.3, carbs_g: 11, serving: '100გ', amount_g: 100 },
  { name: 'ბანანი (1 ცალი)', category: 'ხილი', calories: 89, protein_g: 1, fat_g: 0.3, carbs_g: 23, serving: '1 ცალი', amount_g: 100 },
  { name: 'ვაშლი (1 ცალი)', category: 'ხილი', calories: 72, protein_g: 0.4, fat_g: 0.2, carbs_g: 19, serving: '1 ცალი', amount_g: 130 },
  { name: 'ნარინჯი (1 ცალი)', category: 'ხილი', calories: 47, protein_g: 0.9, fat_g: 0.1, carbs_g: 12, serving: '1 ცალი', amount_g: 100 },

  // სასმელი
  { name: 'ჩაი (1 ჭიქა)', category: 'სასმელი', calories: 0, protein_g: 0, fat_g: 0, carbs_g: 0, serving: '250მლ', amount_g: 250 },
  { name: 'ყავა (შავი)', category: 'სასმელი', calories: 2, protein_g: 0.3, fat_g: 0, carbs_g: 0.3, serving: '250მლ', amount_g: 250 },
]

export function searchGeorgianFoods(query: string): GeorgianFood[] {
  if (!query.trim()) return []
  const q = query.toLowerCase().trim()
  return GEORGIAN_FOODS.filter(f =>
    f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
  ).slice(0, 8)
}
