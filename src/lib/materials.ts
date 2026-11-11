// Color/finish catalog for the 3D viewer. Each entry is a named material
// swatch (roughness/metalness included), so the theme can be applied to the
// models by picking swatches instead of editing each file's hex codes.

export interface MaterialDef {
  id: string
  name: string
  color: string
  roughness: number
  metalness: number
}

export interface Swatches {
  body: MaterialDef
  limb: MaterialDef
  joint: MaterialDef
  dark: MaterialDef
  accent: MaterialDef
}

export interface Theme {
  id: string
  name: string
  swatches: Swatches
}

export const THEMES: Theme[] = [
  {
    id: 'burgundy',
    name: 'Burgundy',
    swatches: {
      body:   { id: 'body',   name: 'Deep burgundy',  color: '#752f45', roughness: 0.55, metalness: 0.08 },
      limb:   { id: 'limb',   name: 'Dusty rose',     color: '#a95a6e', roughness: 0.55, metalness: 0.08 },
      joint:  { id: 'joint',  name: 'Antique gold',   color: '#d9b46a', roughness: 0.38, metalness: 0.2 },
      dark:   { id: 'dark',   name: 'Dark plum',      color: '#5d1f33', roughness: 0.6,  metalness: 0.08 },
      accent: { id: 'accent', name: 'Gold accent',    color: '#d9b46a', roughness: 0.5,  metalness: 0.15 },
    },
  },
  {
    id: 'cad',
    name: 'CAD gray',
    swatches: {
      body:   { id: 'body',   name: 'Light gray',   color: '#d5d8dd', roughness: 0.55, metalness: 0.05 },
      limb:   { id: 'limb',   name: 'Mid gray',     color: '#c3c7cd', roughness: 0.55, metalness: 0.08 },
      joint:  { id: 'joint',  name: 'Blue accent',  color: '#3b82f6', roughness: 0.35, metalness: 0.2 },
      dark:   { id: 'dark',   name: 'Charcoal',     color: '#9aa0a8', roughness: 0.6,  metalness: 0.1 },
      accent: { id: 'accent', name: 'Steel',        color: '#c3c7cd', roughness: 0.5,  metalness: 0.15 },
    },
  },
  {
    id: 'studio',
    name: 'Studio white',
    swatches: {
      body:   { id: 'body',   name: 'Porcelain',    color: '#f2ede6', roughness: 0.45, metalness: 0.05 },
      limb:   { id: 'limb',   name: 'Sand',         color: '#e0d3c2', roughness: 0.5,  metalness: 0.05 },
      joint:  { id: 'joint',  name: 'Copper',       color: '#c97b4a', roughness: 0.35, metalness: 0.3 },
      dark:   { id: 'dark',   name: 'Walnut',       color: '#8a6a52', roughness: 0.55, metalness: 0.1 },
      accent: { id: 'accent', name: 'Bronze',       color: '#c97b4a', roughness: 0.4,  metalness: 0.25 },
    },
  },
]
