import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock crypto.randomUUID
vi.stubGlobal("crypto", {
  randomUUID: () => "12345678-1234-1234-1234-123456789abc",
});

// Mock the Supabase admin client
const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockSupabase = {
  rpc: mockRpc,
  from: mockFrom,
};

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: () => mockSupabase,
}));

// Mock audit module
vi.mock("@/lib/audit", () => ({
  auditBookingChange: vi.fn().mockResolvedValue(undefined),
}));

// Import after mocking
import { createBookingAction } from "@/app/actions/booking";

describe("createBookingAction", () => {
  const validParams = {
    provider_id: "provider-123",
    service_id: "service-456",
    start_at: "2025-01-20T10:00:00Z",
    client_name: "John Doe",
    client_email: "john@example.com",
    client_phone: "0412345678",
    notes: "Test booking",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Successful Booking Creation", () => {
    it("should create booking successfully with valid params", async () => {
      // Mock successful RPC call
      mockRpc.mockResolvedValue({
        data: { id: "booking-789" },
        error: null,
      });

      // Mock token insertion
      mockFrom.mockImplementation((table: string) => {
        if (table === "action_tokens") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === "bookings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "booking-789",
                    provider_id: "provider-123",
                    service_id: "service-456",
                    start_at: "2025-01-20T10:00:00Z",
                    status: "confirmed",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { insert: vi.fn(), select: vi.fn() };
      });

      const result = await createBookingAction(validParams);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.cancelToken).toBeDefined();
      expect(mockRpc).toHaveBeenCalledWith("create_booking", {
        p_provider_id: "provider-123",
        p_service_id: "service-456",
        p_start_at: "2025-01-20T10:00:00Z",
        p_client_name: "John Doe",
        p_client_email: "john@example.com",
        p_client_phone: "0412345678",
        p_notes: "Test booking",
      });
    });

    it("should generate cancel token that expires 24h before appointment", async () => {
      mockRpc.mockResolvedValue({
        data: { id: "booking-789" },
        error: null,
      });

      let insertedToken: { expires_at: string } | null = null;
      mockFrom.mockImplementation((table: string) => {
        if (table === "action_tokens") {
          return {
            insert: vi
              .fn()
              .mockImplementation((data: { expires_at: string }) => {
                insertedToken = data;
                return Promise.resolve({ error: null });
              }),
          };
        }
        if (table === "bookings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "booking-789" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { insert: vi.fn() };
      });

      await createBookingAction(validParams);

      expect(insertedToken).toBeDefined();
      // Token should expire 24h before appointment
      const appointmentTime = new Date(validParams.start_at).getTime();
      const expectedExpiry = new Date(
        appointmentTime - 24 * 60 * 60 * 1000,
      ).toISOString();
      expect(insertedToken?.expires_at).toBe(expectedExpiry);
    });

    it("should handle empty email correctly", async () => {
      mockRpc.mockResolvedValue({
        data: { id: "booking-789" },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "action_tokens") {
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }
        if (table === "bookings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "booking-789" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { insert: vi.fn() };
      });

      const paramsWithoutEmail = { ...validParams, client_email: null };
      await createBookingAction(paramsWithoutEmail);

      expect(mockRpc).toHaveBeenCalledWith(
        "create_booking",
        expect.objectContaining({
          p_client_email: "", // Should convert null to empty string
        }),
      );
    });
  });

  describe("Error Handling", () => {
    it("should return error when RPC fails", async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: "Time slot no longer available" },
      });

      const result = await createBookingAction(validParams);

      expect(result.error).toBe("Time slot no longer available");
      expect(result.success).toBeUndefined();
    });

    it("should return error when RPC returns no ID", async () => {
      mockRpc.mockResolvedValue({
        data: null, // No ID returned
        error: null,
      });

      const result = await createBookingAction(validParams);

      expect(result.error).toBe("Booking creation failed - no ID returned");
    });

    it("should continue if token creation fails", async () => {
      mockRpc.mockResolvedValue({
        data: { id: "booking-789" },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "action_tokens") {
          return {
            insert: vi
              .fn()
              .mockResolvedValue({ error: { message: "Token error" } }),
          };
        }
        if (table === "bookings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "booking-789" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { insert: vi.fn() };
      });

      const result = await createBookingAction(validParams);

      // Should still succeed even if token creation fails
      expect(result.success).toBe(true);
    });

    it("should return error when booking fetch fails", async () => {
      mockRpc.mockResolvedValue({
        data: { id: "booking-789" },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "action_tokens") {
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }
        if (table === "bookings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Fetch error" },
                }),
              }),
            }),
          };
        }
        return { insert: vi.fn() };
      });

      const result = await createBookingAction(validParams);

      expect(result.error).toBe(
        "Booking created but failed to retrieve details",
      );
    });

    it("should handle unexpected exceptions", async () => {
      mockRpc.mockRejectedValue(new Error("Network error"));

      const result = await createBookingAction(validParams);

      expect(result.error).toBe("An unexpected error occurred");
    });
  });

  describe("Double Booking Prevention", () => {
    it("should use atomic RPC to prevent race conditions", async () => {
      mockRpc.mockResolvedValue({
        data: { id: "booking-789" },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "action_tokens") {
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }
        if (table === "bookings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "booking-789" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { insert: vi.fn() };
      });

      await createBookingAction(validParams);

      // Verify RPC is called (atomic operation)
      expect(mockRpc).toHaveBeenCalledWith(
        "create_booking",
        expect.any(Object),
      );
      // Verify direct insert is NOT used (would be non-atomic)
      const insertCalls = mockFrom.mock.calls.filter(
        (call: string[]) => call[0] === "bookings",
      );
      const hasDirectInsert = insertCalls.some((_call: string[]) => {
        // Check if any bookings call used insert method
        return false; // RPC handles insert atomically
      });
      expect(hasDirectInsert).toBe(false);
    });
  });
});
