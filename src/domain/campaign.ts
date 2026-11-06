export type GearSlot = "weapon" | "coat" | "charm";
export interface GearItem { readonly id: string; readonly name: string; readonly slot: GearSlot; readonly description: string }
export interface CampaignProfile {
  readonly characterName: string;
  readonly inventory: readonly string[];
  readonly equipment: Readonly<Record<GearSlot, string | null>>;
  readonly upgrades: readonly string[];
  readonly completedStoryIds: readonly string[];
}
export const initialProfile: CampaignProfile = {
  characterName: "Aven", inventory: [], equipment: { weapon: null, coat: null, charm: null },
  upgrades: [], completedStoryIds: [],
};
export function collectItems(profile: CampaignProfile, itemIds: readonly string[]): CampaignProfile {
  return { ...profile, inventory: [...new Set([...profile.inventory, ...itemIds])] };
}
export function equipItem(profile: CampaignProfile, item: GearItem): CampaignProfile {
  if (!profile.inventory.includes(item.id)) return profile;
  return { ...profile, equipment: { ...profile.equipment, [item.slot]: item.id } };
}
export function completeStory(profile: CampaignProfile, storyId: string): CampaignProfile {
  return { ...profile, completedStoryIds: [...new Set([...profile.completedStoryIds, storyId])] };
}
