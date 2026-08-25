import {
  createPingRequest,
  respondToPingRequest,
  listPingRequests,
  updateSharedLocation,
  stopShare,
} from '../service';
import * as models from '../../../database/models';

// ── Mocks ──

const requesterId = '550e8400-e29b-41d4-a716-446655440001';
const targetUserId = '660e8400-e29b-41d4-a716-446655440002';
const householdId = '770e8400-e29b-41d4-a716-446655440003';
const pingRequestId = '11111111-1111-1111-1111-111111111111';

const mockRequester = { id: requesterId, displayName: 'Requester', avatarUrl: null };
const mockTarget = { id: targetUserId, displayName: 'Target', avatarUrl: null };

jest.mock('../../../database/models', () => ({
  PingRequest: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  },
  CheckIn: {
    create: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
  },
  HouseholdMember: {
    findOne: jest.fn(),
  },
}));

jest.mock('../../../shared/services/notifications', () => ({
  notifyUser: jest.fn().mockResolvedValue(undefined),
}));

const mockEmit = jest.fn();
const mockTo = jest.fn(() => ({ emit: mockEmit }));
jest.mock('../../../shared/utils/socket', () => ({
  getIO: () => ({ to: mockTo }),
}));

const modelsMock = models as jest.Mocked<typeof models>;

function makePingRequest(overrides: Record<string, unknown> = {}) {
  const base = {
    id: pingRequestId,
    householdId,
    requesterId,
    targetUserId,
    status: 'pending',
    note: null,
    checkInId: null,
    respondedAt: null,
    shareDurationMinutes: null,
    shareExpiresAt: null as Date | null,
    liveLatitude: null,
    liveLongitude: null,
    liveUpdatedAt: null,
    createdAt: new Date('2026-08-10T10:00:00.000Z'),
    save: jest.fn().mockResolvedValue(undefined),
    get: jest.fn((key: string) => {
      if (key === 'requester') return mockRequester;
      if (key === 'target') return mockTarget;
      return undefined;
    }),
    ...overrides,
  };
  return base;
}

beforeEach(() => {
  jest.clearAllMocks();
  (modelsMock.PingRequest.findOne as jest.Mock).mockResolvedValue(null);
  (modelsMock.PingRequest.update as jest.Mock).mockResolvedValue([0]);
  (modelsMock.HouseholdMember.findOne as jest.Mock).mockImplementation(({ where }: any) => {
    if (where.userId === requesterId) return Promise.resolve({ householdId, userId: requesterId });
    if (where.userId === targetUserId) return Promise.resolve({ householdId, userId: targetUserId });
    return Promise.resolve(null);
  });
  (modelsMock.User.findByPk as jest.Mock).mockImplementation((id: string) => {
    if (id === requesterId) return Promise.resolve(mockRequester);
    if (id === targetUserId) return Promise.resolve(mockTarget);
    return Promise.resolve(null);
  });
});

describe('createPingRequest', () => {
  it('creates a pending ping request and notifies + emits to the target', async () => {
    const created = makePingRequest();
    (modelsMock.PingRequest.create as jest.Mock).mockResolvedValue(created);
    (modelsMock.PingRequest.findByPk as jest.Mock).mockResolvedValue(created);

    const result = await createPingRequest(requesterId, { targetUserId });

    expect(modelsMock.PingRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({ householdId, requesterId, targetUserId, status: 'pending' }),
    );
    expect(result.status).toBe('pending');

    const notifications = jest.requireMock('../../../shared/services/notifications') as {
      notifyUser: jest.Mock;
    };
    expect(notifications.notifyUser).toHaveBeenCalledWith(
      targetUserId,
      'ping_request',
      'Location Request',
      expect.stringContaining('wants your location'),
      expect.objectContaining({ type: 'ping_request', pingRequestId }),
    );
    expect(mockTo).toHaveBeenCalledWith(`user:${targetUserId}`);
    expect(mockEmit).toHaveBeenCalledWith('ping:request', expect.objectContaining({ status: 'pending' }));
  });

  it('rejects pinging yourself', async () => {
    await expect(createPingRequest(requesterId, { targetUserId: requesterId })).rejects.toThrow(
      'You cannot ping yourself',
    );
  });

  it('throws NotFound when target is not a household member', async () => {
    (modelsMock.HouseholdMember.findOne as jest.Mock).mockImplementation(({ where }: any) => {
      if (where.userId === requesterId) return Promise.resolve({ householdId, userId: requesterId });
      return Promise.resolve(null);
    });

    await expect(createPingRequest(requesterId, { targetUserId })).rejects.toThrow(
      'Household member',
    );
  });
});

describe('respondToPingRequest', () => {
  it('accepts by creating a CheckIn, marking fulfilled, and notifying the requester', async () => {
    const pending = makePingRequest();
    (modelsMock.PingRequest.findByPk as jest.Mock)
      .mockResolvedValueOnce(pending) // initial load
      .mockResolvedValueOnce(makePingRequest({ status: 'fulfilled', checkInId: 'ci-1' })); // reload for response

    (modelsMock.CheckIn.create as jest.Mock).mockResolvedValue({ id: 'ci-1' });

    const result = await respondToPingRequest(targetUserId, pingRequestId, {
      action: 'accept',
      latitude: 27.7172,
      longitude: 85.324,
      address: 'Kathmandu, Nepal',
      durationMinutes: 15,
    });

    expect(modelsMock.CheckIn.create).toHaveBeenCalledWith(
      expect.objectContaining({ householdId, userId: targetUserId, latitude: 27.7172 }),
    );
    expect(pending.status).toBe('fulfilled');
    expect(pending.checkInId).toBe('ci-1');
    expect(pending.shareDurationMinutes).toBe(15);
    expect(pending.shareExpiresAt).toBeInstanceOf(Date);
    expect(pending.shareExpiresAt!.getTime()).toBeGreaterThan(Date.now());
    expect(pending.liveLatitude).toBe(27.7172);
    expect(pending.save).toHaveBeenCalled();
    expect(result.status).toBe('fulfilled');

    const notifications = jest.requireMock('../../../shared/services/notifications') as {
      notifyUser: jest.Mock;
    };
    expect(notifications.notifyUser).toHaveBeenCalledWith(
      requesterId,
      'ping_response',
      'Location Shared',
      expect.stringContaining('shared their location'),
      expect.objectContaining({ type: 'ping_response', checkInId: 'ci-1' }),
    );
    expect(mockTo).toHaveBeenCalledWith(`user:${requesterId}`);
  });

  it('declines without creating a CheckIn', async () => {
    const pending = makePingRequest();
    (modelsMock.PingRequest.findByPk as jest.Mock)
      .mockResolvedValueOnce(pending)
      .mockResolvedValueOnce(makePingRequest({ status: 'declined' }));

    const result = await respondToPingRequest(targetUserId, pingRequestId, { action: 'decline' });

    expect(modelsMock.CheckIn.create).not.toHaveBeenCalled();
    expect(pending.status).toBe('declined');
    expect(result.status).toBe('declined');
  });

  it('throws Forbidden when responder is not the target', async () => {
    (modelsMock.PingRequest.findByPk as jest.Mock).mockResolvedValue(makePingRequest());

    await expect(
      respondToPingRequest(requesterId, pingRequestId, { action: 'accept' }),
    ).rejects.toThrow('This ping request is not addressed to you');
  });

  it('throws when the request was already responded to', async () => {
    (modelsMock.PingRequest.findByPk as jest.Mock).mockResolvedValue(
      makePingRequest({ status: 'fulfilled' }),
    );

    await expect(
      respondToPingRequest(targetUserId, pingRequestId, { action: 'accept' }),
    ).rejects.toThrow('already been responded to');
  });

  it('throws NotFound for an unknown ping request', async () => {
    (modelsMock.PingRequest.findByPk as jest.Mock).mockResolvedValue(null);

    await expect(
      respondToPingRequest(targetUserId, pingRequestId, { action: 'accept' }),
    ).rejects.toThrow('Ping request not found');
  });
});

describe('listPingRequests', () => {
  it('lists incoming requests for the target', async () => {
    (modelsMock.PingRequest.findAll as jest.Mock).mockResolvedValue([makePingRequest()]);

    const result = await listPingRequests(targetUserId, { direction: 'incoming', limit: 20 });

    expect(modelsMock.PingRequest.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { targetUserId }, order: [['createdAt', 'DESC']] }),
    );
    expect(result.items.length).toBe(1);
  });

  it('lists outgoing requests for the requester', async () => {
    (modelsMock.PingRequest.findAll as jest.Mock).mockResolvedValue([]);

    await listPingRequests(requesterId, { direction: 'outgoing', limit: 20 });

    expect(modelsMock.PingRequest.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { requesterId } }),
    );
  });
});

describe('updateSharedLocation', () => {
  it('updates live coordinates and emits to the requester while the share is active', async () => {
    const active = makePingRequest({
      status: 'fulfilled',
      shareExpiresAt: new Date(Date.now() + 10 * 60_000),
    });
    (modelsMock.PingRequest.findByPk as jest.Mock)
      .mockResolvedValueOnce(active)
      .mockResolvedValueOnce(active);

    const result = await updateSharedLocation(targetUserId, pingRequestId, {
      latitude: 27.72,
      longitude: 85.32,
    });

    expect(active.liveLatitude).toBe(27.72);
    expect(active.liveLongitude).toBe(85.32);
    expect(active.save).toHaveBeenCalled();
    expect(mockTo).toHaveBeenCalledWith(`user:${requesterId}`);
    expect(mockEmit).toHaveBeenCalledWith('ping:location-update', expect.any(Object));
    expect(result).toBeDefined();
  });

  it('rejects updates from someone other than the responder', async () => {
    (modelsMock.PingRequest.findByPk as jest.Mock).mockResolvedValue(
      makePingRequest({ status: 'fulfilled', shareExpiresAt: new Date(Date.now() + 60_000) }),
    );

    await expect(
      updateSharedLocation(requesterId, pingRequestId, { latitude: 1, longitude: 1 }),
    ).rejects.toThrow('not yours to update');
  });

  it('rejects updates once the share has expired', async () => {
    (modelsMock.PingRequest.findByPk as jest.Mock).mockResolvedValue(
      makePingRequest({ status: 'fulfilled', shareExpiresAt: new Date(Date.now() - 1000) }),
    );

    await expect(
      updateSharedLocation(targetUserId, pingRequestId, { latitude: 1, longitude: 1 }),
    ).rejects.toThrow('has ended');
  });
});

describe('stopShare', () => {
  it('expires the share immediately and notifies the requester', async () => {
    const active = makePingRequest({
      status: 'fulfilled',
      shareExpiresAt: new Date(Date.now() + 10 * 60_000),
    });
    (modelsMock.PingRequest.findByPk as jest.Mock)
      .mockResolvedValueOnce(active)
      .mockResolvedValueOnce(active);

    await stopShare(targetUserId, pingRequestId);

    expect(active.shareExpiresAt!.getTime()).toBeLessThanOrEqual(Date.now());
    expect(active.save).toHaveBeenCalled();
    expect(mockTo).toHaveBeenCalledWith(`user:${requesterId}`);
    expect(mockEmit).toHaveBeenCalledWith('ping:share-ended', expect.any(Object));
  });

  it('rejects stopping a share that is not yours', async () => {
    (modelsMock.PingRequest.findByPk as jest.Mock).mockResolvedValue(makePingRequest());

    await expect(stopShare(requesterId, pingRequestId)).rejects.toThrow('not yours to stop');
  });
});
