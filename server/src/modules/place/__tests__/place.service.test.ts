import {
  createSavedPlace,
  listSavedPlaces,
  updateSavedPlace,
  deleteSavedPlace,
} from '../service';
import * as models from '../../../database/models';

const userId = '550e8400-e29b-41d4-a716-446655440001';
const otherUserId = '660e8400-e29b-41d4-a716-446655440002';
const householdId = '770e8400-e29b-41d4-a716-446655440003';
const placeId = '11111111-1111-1111-1111-111111111111';

jest.mock('../../../database/models', () => ({
  SavedPlace: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
  HouseholdMember: {
    findOne: jest.fn(),
  },
}));

const modelsMock = models as jest.Mocked<typeof models>;

function makePlace(overrides: Record<string, unknown> = {}) {
  return {
    id: placeId,
    householdId,
    userId,
    name: 'Home',
    icon: 'home',
    latitude: 27.7172,
    longitude: 85.324,
    address: 'Kathmandu, Nepal',
    createdAt: new Date('2026-08-11T10:00:00.000Z'),
    updatedAt: new Date('2026-08-11T10:00:00.000Z'),
    save: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  (modelsMock.HouseholdMember.findOne as jest.Mock).mockResolvedValue({ householdId, userId });
});

describe('createSavedPlace', () => {
  it('creates a place scoped to the household', async () => {
    (modelsMock.SavedPlace.create as jest.Mock).mockResolvedValue(makePlace());

    const result = await createSavedPlace(userId, {
      name: 'Home',
      icon: 'home',
      latitude: 27.7172,
      longitude: 85.324,
      address: 'Kathmandu, Nepal',
    });

    expect(modelsMock.SavedPlace.create).toHaveBeenCalledWith(
      expect.objectContaining({ householdId, userId, name: 'Home', icon: 'home' }),
    );
    expect(result.name).toBe('Home');
    expect(result.latitude).toBe(27.7172);
  });

  it('throws when the user is not in a household', async () => {
    (modelsMock.HouseholdMember.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      createSavedPlace(userId, { name: 'Home', icon: 'home', latitude: 0, longitude: 0 }),
    ).rejects.toThrow('You must belong to a household to save places');
  });
});

describe('listSavedPlaces', () => {
  it('lists all places for the household', async () => {
    (modelsMock.SavedPlace.findAll as jest.Mock).mockResolvedValue([makePlace()]);

    const result = await listSavedPlaces(userId);

    expect(modelsMock.SavedPlace.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { householdId } }),
    );
    expect(result.length).toBe(1);
  });
});

describe('updateSavedPlace', () => {
  it('updates a place owned by the requester', async () => {
    const place = makePlace();
    (modelsMock.SavedPlace.findByPk as jest.Mock).mockResolvedValue(place);

    const result = await updateSavedPlace(userId, placeId, { name: 'Office' });

    expect(place.name).toBe('Office');
    expect(place.save).toHaveBeenCalled();
    expect(result.name).toBe('Office');
  });

  it('throws Forbidden when the requester does not own the place', async () => {
    (modelsMock.SavedPlace.findByPk as jest.Mock).mockResolvedValue(makePlace({ userId: otherUserId }));

    await expect(updateSavedPlace(userId, placeId, { name: 'Office' })).rejects.toThrow(
      'Only the member who saved this place can edit it',
    );
  });

  it('throws NotFound for an unknown place', async () => {
    (modelsMock.SavedPlace.findByPk as jest.Mock).mockResolvedValue(null);

    await expect(updateSavedPlace(userId, placeId, { name: 'Office' })).rejects.toThrow(
      'Saved place not found',
    );
  });
});

describe('deleteSavedPlace', () => {
  it('deletes a place owned by the requester', async () => {
    const place = makePlace();
    (modelsMock.SavedPlace.findByPk as jest.Mock).mockResolvedValue(place);

    await deleteSavedPlace(userId, placeId);

    expect(place.destroy).toHaveBeenCalled();
  });

  it('throws Forbidden when the requester does not own the place', async () => {
    (modelsMock.SavedPlace.findByPk as jest.Mock).mockResolvedValue(makePlace({ userId: otherUserId }));

    await expect(deleteSavedPlace(userId, placeId)).rejects.toThrow(
      'Only the member who saved this place can delete it',
    );
  });
});
