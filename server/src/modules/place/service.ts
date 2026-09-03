import { v4 as uuidv4 } from 'uuid';
import { SavedPlace } from '../../database/models';
import { ForbiddenError, NotFoundError } from '../../shared/utils/errors';
import { getUserHousehold as getUserHouseholdCore } from '../../shared/utils/household';
import type { CreateSavedPlaceBody, UpdateSavedPlaceBody, SavedPlaceResponse } from './types';

// ── Helpers ──

async function getUserHousehold(userId: string): Promise<string> {
  return getUserHouseholdCore(userId, 'You must belong to a household to save places');
}

function toSavedPlaceResponse(place: SavedPlace): SavedPlaceResponse {
  return {
    id: place.id,
    householdId: place.householdId,
    userId: place.userId,
    name: place.name,
    icon: place.icon,
    latitude: Number(place.latitude),
    longitude: Number(place.longitude),
    address: place.address,
    createdAt: place.createdAt.toISOString(),
    updatedAt: place.updatedAt.toISOString(),
  };
}

// ── Service ──

/** Save a new bookmarked location (Home, Office, School, or custom). */
export async function createSavedPlace(
  userId: string,
  body: CreateSavedPlaceBody,
): Promise<SavedPlaceResponse> {
  const householdId = await getUserHousehold(userId);

  const place = await SavedPlace.create({
    id: uuidv4(),
    householdId,
    userId,
    name: body.name,
    icon: body.icon,
    latitude: body.latitude,
    longitude: body.longitude,
    address: body.address ?? null,
  });

  return toSavedPlaceResponse(place);
}

/** List all saved places for the household (shared, so everyone sees Home/Office pins). */
export async function listSavedPlaces(userId: string): Promise<SavedPlaceResponse[]> {
  const householdId = await getUserHousehold(userId);

  const places = await SavedPlace.findAll({
    where: { householdId },
    order: [['createdAt', 'ASC']],
  });

  return places.map(toSavedPlaceResponse);
}

/** Update a saved place — only the member who created it may edit it. */
export async function updateSavedPlace(
  userId: string,
  placeId: string,
  body: UpdateSavedPlaceBody,
): Promise<SavedPlaceResponse> {
  const place = await SavedPlace.findByPk(placeId);
  if (!place) throw new NotFoundError('Saved place');
  if (place.userId !== userId) {
    throw new ForbiddenError('Only the member who saved this place can edit it');
  }

  if (body.name !== undefined) place.name = body.name;
  if (body.icon !== undefined) place.icon = body.icon;
  if (body.latitude !== undefined) place.latitude = body.latitude;
  if (body.longitude !== undefined) place.longitude = body.longitude;
  if (body.address !== undefined) place.address = body.address;
  await place.save();

  return toSavedPlaceResponse(place);
}

/** Delete a saved place — only the member who created it may remove it. */
export async function deleteSavedPlace(userId: string, placeId: string): Promise<void> {
  const place = await SavedPlace.findByPk(placeId);
  if (!place) throw new NotFoundError('Saved place');
  if (place.userId !== userId) {
    throw new ForbiddenError('Only the member who saved this place can delete it');
  }
  await place.destroy();
}
