import { TimeSlot, Activity, DEFAULT_ACTIVITIES, TimeSettings, DEFAULT_TIME_SETTINGS, getErPointsForCode } from '../types/data';

export type ZoomLevel = 15 | 30 | 60 | 180;
export const ZOOM_LEVELS: ZoomLevel[] = [15, 30, 60, 180];

export interface GroupedSlot {
  groupIndex: number;
  timeIn: string;
  timeOut: string;
  slots: TimeSlot[];
  totalMinutes: number;
  weightedER: number;
  filledMinutes: number;
  dominantCategory: string | null;
}

export function groupSlotsByZoom(
  slots: TimeSlot[],
  zoomLevel: ZoomLevel,
  baseSlotDuration: number,
  activities?: Activity[]
): GroupedSlot[] {
  if (zoomLevel <= baseSlotDuration) {
    return slots.map((slot, i) => {
      const duration = getSlotDurationMinutes(slot);
      const er = slot.activityCategory ? getSlotErPoints(slot, activities) : 0;
      return {
        groupIndex: i,
        timeIn: slot.timeIn,
        timeOut: slot.timeOut,
        slots: [slot],
        totalMinutes: duration,
        weightedER: er,
        filledMinutes: slot.activityCategory ? duration : 0,
        dominantCategory: slot.activityCategory,
      };
    });
  }

  const slotsPerGroup = Math.max(1, Math.round(zoomLevel / baseSlotDuration));
  const groups: GroupedSlot[] = [];

  for (let i = 0; i < slots.length; i += slotsPerGroup) {
    const chunk = slots.slice(i, i + slotsPerGroup);
    if (chunk.length === 0) continue;

    let totalWeighted = 0;
    let totalMinutes = 0;
    let filledMinutes = 0;
    const categoryMinutes: Record<string, number> = {};

    for (const slot of chunk) {
      const dur = getSlotDurationMinutes(slot);
      const pts = getSlotErPoints(slot, activities);
      totalWeighted += pts * dur;
      totalMinutes += dur;
      if (slot.activityCategory) {
        filledMinutes += dur;
        categoryMinutes[slot.activityCategory] = (categoryMinutes[slot.activityCategory] || 0) + dur;
      }
    }

    let dominantCategory: string | null = null;
    let maxCatMin = 0;
    for (const [cat, mins] of Object.entries(categoryMinutes)) {
      if (mins > maxCatMin) {
        maxCatMin = mins;
        dominantCategory = cat;
      }
    }

    const avgER = totalMinutes > 0 ? totalWeighted / totalMinutes : 0;

    groups.push({
      groupIndex: groups.length,
      timeIn: chunk[0].timeIn,
      timeOut: chunk[chunk.length - 1].timeOut,
      slots: chunk,
      totalMinutes,
      weightedER: Math.round(avgER * 100) / 100,
      filledMinutes,
      dominantCategory,
    });
  }

  return groups;
}

export function getERColor(er: number): string {
  if (er >= 0.8) return '#15803D';
  if (er >= 0.6) return '#65A30D';
  if (er >= 0.4) return '#D97706';
  if (er >= 0.2) return '#EA580C';
  if (er > 0) return '#DC2626';
  return '#9CA3AF';
}

export function getZoomLabel(zoom: ZoomLevel): string {
  if (zoom === 15) return '15m';
  if (zoom === 30) return '30m';
  if (zoom === 60) return '1h';
  return '3h';
}

export function getSlotDurationMinutes(slot: TimeSlot): number {
  const [inH, inM] = slot.timeIn.split(':').map(Number);
  const [outH, outM] = slot.timeOut.split(':').map(Number);
  const duration = (outH * 60 + outM) - (inH * 60 + inM);
  return duration > 0 ? duration : 15;
}

export const DAY_START_HOUR = 5;
export const DAY_END_HOUR = 23;
export const SLOT_MINUTES = 15;
export const TOTAL_SLOTS = 72;

export function calculateTotalSlots(timeSettings?: TimeSettings): number {
  const settings = timeSettings || DEFAULT_TIME_SETTINGS;
  const startMinutes = settings.dayStartHour * 60 + settings.dayStartMinute;
  const endMinutes = settings.dayEndHour * 60 + settings.dayEndMinute;
  const totalMinutes = endMinutes - startMinutes;
  return Math.floor(totalMinutes / settings.slotDuration);
}

export function generateTimeSlots(timeSettings?: TimeSettings): TimeSlot[] {
  const settings = timeSettings || DEFAULT_TIME_SETTINGS;
  const slots: TimeSlot[] = [];
  const totalSlots = calculateTotalSlots(settings);
  
  let currentMinutes = settings.dayStartHour * 60 + settings.dayStartMinute;

  for (let i = 0; i < totalSlots; i++) {
    const startHour = Math.floor(currentMinutes / 60);
    const startMinute = currentMinutes % 60;
    const timeIn = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
    
    currentMinutes += settings.slotDuration;
    
    const endHour = Math.floor(currentMinutes / 60);
    const endMinute = currentMinutes % 60;
    const timeOut = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    
    slots.push({
      index: i,
      timeIn,
      timeOut,
      activityCategory: null,
      plannedCategory: null,
      performedActivityText: '',
      pointsOverride: null,
    });
  }

  return slots;
}

export function getCurrentSlotIndex(timeSettings?: TimeSettings): number {
  const settings = timeSettings || DEFAULT_TIME_SETTINGS;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = settings.dayStartHour * 60 + settings.dayStartMinute;
  const endMinutes = settings.dayEndHour * 60 + settings.dayEndMinute;
  const totalSlots = calculateTotalSlots(settings);
  
  if (currentMinutes < startMinutes) return -1;
  if (currentMinutes >= endMinutes) return totalSlots;
  
  const minutesSinceDayStart = currentMinutes - startMinutes;
  return Math.floor(minutesSinceDayStart / settings.slotDuration);
}

export function getDaySpentSlotsCount(timeSettings?: TimeSettings): number {
  const settings = timeSettings || DEFAULT_TIME_SETTINGS;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = settings.dayStartHour * 60 + settings.dayStartMinute;
  const endMinutes = settings.dayEndHour * 60 + settings.dayEndMinute;
  const totalSlots = calculateTotalSlots(settings);
  
  if (currentMinutes < startMinutes) return 0;
  if (currentMinutes >= endMinutes) return totalSlots;
  
  const roundedMinutes = Math.floor((currentMinutes - startMinutes) / settings.slotDuration) * settings.slotDuration;
  return Math.min(Math.max(Math.floor(roundedMinutes / settings.slotDuration), 0), totalSlots);
}

export function getSlotPoints(
  slot: TimeSlot, 
  activities?: Activity[],
  categoryOverrides?: Record<string, { points: number; color: string }> | null
): number {
  if (slot.pointsOverride !== null) return slot.pointsOverride;
  if (!slot.activityCategory) return 0;
  
  if (categoryOverrides && categoryOverrides[slot.activityCategory]) {
    return categoryOverrides[slot.activityCategory].points;
  }
  
  const activityList = activities || DEFAULT_ACTIVITIES;
  const activity = activityList.find(a => a.code === slot.activityCategory);
  return activity?.points ?? 0;
}

export function getSlotErPoints(
  slot: TimeSlot,
  activities?: Activity[]
): number {
  if (!slot.activityCategory) return 0;
  
  const activityList = activities || DEFAULT_ACTIVITIES;
  const activity = activityList.find(a => a.code === slot.activityCategory);
  
  if (activity) {
    return activity.erPoints ?? getErPointsForCode(activity.code);
  }
  
  return getErPointsForCode(slot.activityCategory);
}

export function calculateCurrentER(
  slots: TimeSlot[], 
  activities?: Activity[],
  _categoryOverrides?: Record<string, { points: number; color: string }> | null,
  _timeSettings?: TimeSettings
): number {
  if (slots.length <= 0) return 0;
  
  let totalWeightedPoints = 0;
  let totalMinutes = 0;
  
  for (const slot of slots) {
    const duration = getSlotDurationMinutes(slot);
    const points = getSlotErPoints(slot, activities);
    totalWeightedPoints += points * duration;
    totalMinutes += duration;
  }
  
  if (totalMinutes <= 0) return 0;
  return Math.round((totalWeightedPoints / totalMinutes) * 100) / 100;
}

export function calculateMaxReachableER(
  slots: TimeSlot[], 
  activities?: Activity[],
  _categoryOverrides?: Record<string, { points: number; color: string }> | null,
  _timeSettings?: TimeSettings
): number {
  if (slots.length <= 0) return 0;
  
  let totalWeightedPoints = 0;
  let totalBlankMinutes = 0;
  let totalMinutes = 0;
  
  for (const slot of slots) {
    const duration = getSlotDurationMinutes(slot);
    const points = getSlotErPoints(slot, activities);
    totalWeightedPoints += points * duration;
    if (slot.activityCategory === null) {
      totalBlankMinutes += duration;
    }
    totalMinutes += duration;
  }
  
  if (totalMinutes <= 0) return 0;
  const maxPossibleWeighted = totalWeightedPoints + totalBlankMinutes;
  return Math.round((maxPossibleWeighted / totalMinutes) * 100) / 100;
}

export function getDaySpentPercentage(timeSettings?: TimeSettings): number {
  const settings = timeSettings || DEFAULT_TIME_SETTINGS;
  const totalSlots = calculateTotalSlots(settings);
  const daySpentSlots = getDaySpentSlotsCount(settings);
  return totalSlots > 0 ? daySpentSlots / totalSlots : 0;
}

export function formatDateHeader(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getPreviousSlotIndex(timeSettings?: TimeSettings): number {
  const currentIndex = getCurrentSlotIndex(timeSettings);
  if (currentIndex <= 0) return -1;
  return currentIndex - 1;
}

export function getInitialScrollIndex(timeSettings?: TimeSettings): number {
  const currentIndex = getCurrentSlotIndex(timeSettings);
  const totalSlots = calculateTotalSlots(timeSettings);
  const targetIndex = Math.max(0, currentIndex - 4);
  return Math.min(targetIndex, Math.max(0, totalSlots - 1));
}

export function getPendingSlotsCount(slots: TimeSlot[], timeSettings?: TimeSettings): number {
  const daySpentSlots = getDaySpentSlotsCount(timeSettings);
  const completedSlots = slots.slice(0, daySpentSlots);
  return completedSlots.filter(s => s.activityCategory === null).length;
}

export function getHoursPerCategory(slots: TimeSlot[]): Record<string, number> {
  const hours: Record<string, number> = {};
  
  slots.forEach(slot => {
    if (slot.activityCategory) {
      const duration = getSlotDurationMinutes(slot);
      hours[slot.activityCategory] = (hours[slot.activityCategory] || 0) + (duration / 60);
    }
  });
  
  return hours;
}

export function getFilledSlotsCount(slots: TimeSlot[]): number {
  return slots.filter(s => s.activityCategory !== null).length;
}

export function getUnfilledSlotsCount(slots: TimeSlot[]): number {
  return slots.filter(s => s.activityCategory === null).length;
}

export function calculateDayER(
  slots: TimeSlot[], 
  activities?: Activity[],
  _categoryOverrides?: Record<string, { points: number; color: string }> | null,
  _timeSettings?: TimeSettings
): number {
  if (slots.length <= 0) return 0;
  
  let totalWeightedPoints = 0;
  let totalMinutes = 0;
  
  for (const slot of slots) {
    const duration = getSlotDurationMinutes(slot);
    const points = getSlotErPoints(slot, activities);
    totalWeightedPoints += points * duration;
    totalMinutes += duration;
  }
  
  if (totalMinutes <= 0) return 0;
  return Math.round((totalWeightedPoints / totalMinutes) * 100) / 100;
}

export function calculateDayERPercentage(
  slots: TimeSlot[],
  activities?: Activity[],
  timeSettings?: TimeSettings
): number {
  return Math.round(calculateDayER(slots, activities, null, timeSettings) * 100);
}

export function slotToMinuteRange(slot: TimeSlot): [number, number] {
  const [inH, inM] = slot.timeIn.split(':').map(Number);
  const [outH, outM] = slot.timeOut.split(':').map(Number);
  return [inH * 60 + inM, outH * 60 + outM];
}

export function mergeSlotsByTime(oldSlots: TimeSlot[], newSlots: TimeSlot[]): void {
  const filledOld = oldSlots.filter(s => s.activityCategory !== null);
  if (filledOld.length === 0) return;

  for (const newSlot of newSlots) {
    const [newStart, newEnd] = slotToMinuteRange(newSlot);

    const overlapping = filledOld.filter(old => {
      const [oldStart, oldEnd] = slotToMinuteRange(old);
      return oldStart < newEnd && oldEnd > newStart;
    });

    if (overlapping.length === 0) continue;

    const categoryMinutes: Record<string, number> = {};
    let totalOverlapMinutes = 0;

    for (const old of overlapping) {
      const [oldStart, oldEnd] = slotToMinuteRange(old);
      const overlapStart = Math.max(newStart, oldStart);
      const overlapEnd = Math.min(newEnd, oldEnd);
      const overlapMins = overlapEnd - overlapStart;
      if (overlapMins <= 0) continue;

      totalOverlapMinutes += overlapMins;
      const cat = old.activityCategory!;
      categoryMinutes[cat] = (categoryMinutes[cat] || 0) + overlapMins;
    }

    if (totalOverlapMinutes <= 0) continue;

    let dominantCategory: string | null = null;
    let maxMins = 0;
    for (const [cat, mins] of Object.entries(categoryMinutes)) {
      if (mins > maxMins) {
        maxMins = mins;
        dominantCategory = cat;
      }
    }

    if (dominantCategory) {
      newSlot.activityCategory = dominantCategory;
    }

    const firstOverlap = overlapping[0];
    if (firstOverlap.performedActivityText) {
      newSlot.performedActivityText = firstOverlap.performedActivityText;
    }
    if (firstOverlap.plannedCategory) {
      newSlot.plannedCategory = firstOverlap.plannedCategory;
    }
  }
}

export function calculatePointsScore(
  slots: TimeSlot[], 
  activities?: Activity[],
  categoryOverrides?: Record<string, { points: number; color: string }> | null
): number {
  return slots.reduce((sum, slot) => sum + getSlotPoints(slot, activities, categoryOverrides), 0);
}
