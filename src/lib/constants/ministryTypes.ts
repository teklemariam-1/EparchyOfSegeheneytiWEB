export const MINISTRY_TYPES = [
  'youth-council',
  'catechists',
  'children',
  'small-christian-community',
  'lay-apostolate',
  'caritas',
  'women-league',
  'men-league',
] as const

export type MinistryType = (typeof MINISTRY_TYPES)[number]

export const MINISTRY_LABELS: Record<MinistryType, string> = {
  'youth-council': 'Youth Council',
  catechists: 'Catechists',
  children: "Children's Ministry",
  'small-christian-community': 'Small Christian Community',
  'lay-apostolate': 'Lay Apostolate',
  caritas: 'Caritas',
  'women-league': "Women's League",
  'men-league': "Men's League",
}
